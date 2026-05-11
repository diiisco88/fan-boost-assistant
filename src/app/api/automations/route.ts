import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.creatorSettings.findUnique({
    where: { creatorId: session.creatorId },
  });

  const automations = await prisma.automation.findMany({
    where: { creatorId: session.creatorId },
  });

  const automationMap = Object.fromEntries(automations.map((a) => [a.type, a]));

  return NextResponse.json({
    welcome: {
      enabled: settings?.welcomeEnabled ?? true,
      template: settings?.welcomeTemplate ?? "",
      runCount: automationMap["welcome"]?.runCount ?? 0,
      lastRunAt: automationMap["welcome"]?.lastRunAt ?? null,
    },
    thankYou: {
      enabled: settings?.thankYouEnabled ?? true,
      template: settings?.thankYouTemplate ?? "",
      runCount: automationMap["thank_you"]?.runCount ?? 0,
      lastRunAt: automationMap["thank_you"]?.lastRunAt ?? null,
    },
    reengage: {
      enabled: settings?.reengageEnabled ?? false,
      template: settings?.reengageTemplate ?? "",
      daysThreshold: settings?.reengageDaysThreshold ?? 14,
      runCount: automationMap["reengage"]?.runCount ?? 0,
      lastRunAt: automationMap["reengage"]?.lastRunAt ?? null,
    },
  });
}

const patchSchema = z.object({
  welcome: z
    .object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
    })
    .optional(),
  thankYou: z
    .object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
    })
    .optional(),
  reengage: z
    .object({
      enabled: z.boolean().optional(),
      template: z.string().optional(),
      daysThreshold: z.number().int().min(1).max(365).optional(),
    })
    .optional(),
});

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    const json = await request.json();
    body = patchSchema.parse(json);
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updateData: any = {};
  if (body.welcome?.enabled !== undefined) updateData.welcomeEnabled = body.welcome.enabled;
  if (body.welcome?.template !== undefined) updateData.welcomeTemplate = body.welcome.template;
  if (body.thankYou?.enabled !== undefined) updateData.thankYouEnabled = body.thankYou.enabled;
  if (body.thankYou?.template !== undefined)
    updateData.thankYouTemplate = body.thankYou.template;
  if (body.reengage?.enabled !== undefined) updateData.reengageEnabled = body.reengage.enabled;
  if (body.reengage?.template !== undefined)
    updateData.reengageTemplate = body.reengage.template;
  if (body.reengage?.daysThreshold !== undefined)
    updateData.reengageDaysThreshold = body.reengage.daysThreshold;

  await prisma.creatorSettings.upsert({
    where: { creatorId: session.creatorId },
    update: updateData,
    create: { creatorId: session.creatorId, ...updateData },
  });

  await logAudit(session.creatorId, "automations.updated", { changes: body });

  return NextResponse.json({ ok: true });
}
