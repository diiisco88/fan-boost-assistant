import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { renderTemplate } from "@/lib/templates";
import { containsOptOut } from "@/lib/optout";
import { calculateChurnRisk } from "@/lib/churn";

function verifySignature(body: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fanvue-signature") ?? "";
  const signingSecret = process.env.FANVUE_SIGNING_SECRET ?? "";

  if (!signingSecret || !verifySignature(rawBody, signature, signingSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { event_type: string; data: any; creator_id?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Store webhook event
  const webhookEvent = await prisma.webhookEvent.create({
    data: {
      eventType: body.event_type,
      fanvueId: body.creator_id ?? null,
      payload: body as any,
      processed: false,
    },
  });

  try {
    await dispatchEvent(body.event_type, body.data, body.creator_id ?? null);

    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { processed: true, processedAt: new Date() },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: { error: message },
    });
    console.error("Webhook processing error:", err);
  }

  return NextResponse.json({ ok: true });
}

async function dispatchEvent(
  eventType: string,
  data: any,
  fanvueCreatorId: string | null
): Promise<void> {
  switch (eventType) {
    case "subscriber.new":
      await handleNewSubscriber(data, fanvueCreatorId);
      break;
    case "tip.received":
      await handleTipReceived(data, fanvueCreatorId);
      break;
    case "message.received":
      await handleMessageReceived(data, fanvueCreatorId);
      break;
    case "message.read":
      await handleMessageRead(data, fanvueCreatorId);
      break;
    case "purchase.received":
      if (fanvueCreatorId) {
        const creator = await prisma.creator.findUnique({ where: { fanvueId: fanvueCreatorId } });
        if (creator) await logAudit(creator.id, "purchase.received", { data });
      }
      break;
    case "follower.new":
      if (fanvueCreatorId) {
        const creator = await prisma.creator.findUnique({ where: { fanvueId: fanvueCreatorId } });
        if (creator) await logAudit(creator.id, "follower.new", { data });
      }
      break;
    default:
      console.log("Unhandled webhook event type:", eventType);
  }
}

async function handleNewSubscriber(data: any, fanvueCreatorId: string | null): Promise<void> {
  if (!fanvueCreatorId) return;

  const creator = await prisma.creator.findUnique({
    where: { fanvueId: fanvueCreatorId },
    include: { settings: true },
  });
  if (!creator) return;

  const fanId = data.fan_id ?? data.id ?? "";
  const displayName = data.display_name ?? data.username ?? "Fan";
  const subscribedAt = data.subscribed_at ? new Date(data.subscribed_at) : new Date();

  const subscriber = await prisma.subscriber.upsert({
    where: { creatorId_fanvueFanId: { creatorId: creator.id, fanvueFanId: fanId } },
    update: { displayName, status: "active" },
    create: {
      creatorId: creator.id,
      fanvueFanId: fanId,
      displayName,
      username: data.username ?? null,
      avatarUrl: data.avatar_url ?? null,
      subscribedAt,
    },
  });

  // Create welcome draft if enabled
  if (creator.settings?.welcomeEnabled && creator.settings.welcomeTemplate) {
    const body = renderTemplate(creator.settings.welcomeTemplate, { name: displayName });
    await prisma.messageDraft.create({
      data: {
        creatorId: creator.id,
        subscriberId: subscriber.id,
        type: "welcome",
        draftBody: body,
        triggerEvent: "subscriber.new",
      },
    });
  }
}

async function handleTipReceived(data: any, fanvueCreatorId: string | null): Promise<void> {
  if (!fanvueCreatorId) return;

  const creator = await prisma.creator.findUnique({
    where: { fanvueId: fanvueCreatorId },
    include: { settings: true },
  });
  if (!creator) return;

  const fanId = data.fan_id ?? data.from_id ?? "";
  const amount = parseFloat(data.amount ?? "0");
  const currency = data.currency ?? "USD";
  const tipId = data.tip_id ?? data.id ?? `tip-${Date.now()}`;
  const displayName = data.display_name ?? data.username ?? "Fan";
  const receivedAt = data.received_at ? new Date(data.received_at) : new Date();

  // Upsert subscriber
  const subscriber = await prisma.subscriber.upsert({
    where: { creatorId_fanvueFanId: { creatorId: creator.id, fanvueFanId: fanId } },
    update: {
      totalTips: { increment: amount },
      tipCount: { increment: 1 },
      lastInteractedAt: receivedAt,
    },
    create: {
      creatorId: creator.id,
      fanvueFanId: fanId,
      displayName,
      subscribedAt: receivedAt,
      totalTips: amount,
      tipCount: 1,
      lastInteractedAt: receivedAt,
    },
  });

  // Create tip record (ignore duplicate tipId)
  try {
    await prisma.tip.create({
      data: {
        creatorId: creator.id,
        subscriberId: subscriber.id,
        fanvueTipId: tipId,
        amount,
        currency,
        message: data.message ?? null,
        receivedAt,
      },
    });
  } catch {
    // Duplicate tip ID — skip
  }

  // Update churn risk
  const churnScore = calculateChurnRisk({
    subscribedAt: subscriber.subscribedAt,
    lastInteractedAt: subscriber.lastInteractedAt ?? receivedAt,
    lastMessageAt: subscriber.lastMessageAt,
    totalTips: subscriber.totalTips + amount,
    tipCount: subscriber.tipCount + 1,
  });

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { churnRiskScore: churnScore },
  });

  // Create thank-you draft if enabled
  if (creator.settings?.thankYouEnabled && creator.settings.thankYouTemplate) {
    const body = renderTemplate(creator.settings.thankYouTemplate, {
      name: displayName,
      amount: `${currency} ${amount.toFixed(2)}`,
    });
    await prisma.messageDraft.create({
      data: {
        creatorId: creator.id,
        subscriberId: subscriber.id,
        type: "thank_you",
        draftBody: body,
        triggerEvent: "tip.received",
      },
    });
  }
}

async function handleMessageReceived(data: any, fanvueCreatorId: string | null): Promise<void> {
  if (!fanvueCreatorId) return;

  const creator = await prisma.creator.findUnique({
    where: { fanvueId: fanvueCreatorId },
    include: { settings: true },
  });
  if (!creator) return;

  const fanId = data.fan_id ?? data.from_id ?? "";
  const messageText = data.message ?? data.body ?? "";
  const now = new Date();

  // Check for opt-out keywords
  const keywords =
    creator.settings?.optOutKeywords ?? "stop,unsubscribe,no more,leave me alone";
  const isOptOut = containsOptOut(messageText, keywords);

  const subscriber = await prisma.subscriber.findUnique({
    where: { creatorId_fanvueFanId: { creatorId: creator.id, fanvueFanId: fanId } },
  });

  if (subscriber) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: {
        lastMessageAt: now,
        lastInteractedAt: now,
        optedOut: isOptOut ? true : undefined,
      },
    });

    if (isOptOut) {
      await logAudit(creator.id, "subscriber.opted_out", { fanId, message: messageText });
    }
  }
}

async function handleMessageRead(data: any, fanvueCreatorId: string | null): Promise<void> {
  if (!fanvueCreatorId) return;

  const creator = await prisma.creator.findUnique({ where: { fanvueId: fanvueCreatorId } });
  if (!creator) return;

  const fanId = data.fan_id ?? data.from_id ?? "";
  const now = new Date();

  const subscriber = await prisma.subscriber.findUnique({
    where: { creatorId_fanvueFanId: { creatorId: creator.id, fanvueFanId: fanId } },
  });

  if (subscriber) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { lastInteractedAt: now },
    });
  }
}
