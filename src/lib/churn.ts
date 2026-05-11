interface SubscriberChurnInput {
  subscribedAt: Date;
  lastInteractedAt: Date | null;
  lastMessageAt: Date | null;
  totalTips: number;
  tipCount: number;
}

export function calculateChurnRisk(subscriber: SubscriberChurnInput): number {
  const now = new Date();
  let score = 0;

  // Days since last interaction (up to 40 pts)
  if (subscriber.lastInteractedAt) {
    const daysSinceInteraction =
      (now.getTime() - subscriber.lastInteractedAt.getTime()) / (1000 * 60 * 60 * 24);
    // Scale: 0 pts at 0 days, 40 pts at 60+ days
    const interactionScore = Math.min(40, (daysSinceInteraction / 60) * 40);
    score += interactionScore;
  } else {
    // Never interacted since subscription
    const daysSinceSubscribed =
      (now.getTime() - subscriber.subscribedAt.getTime()) / (1000 * 60 * 60 * 24);
    const interactionScore = Math.min(40, (daysSinceSubscribed / 60) * 40);
    score += interactionScore;
  }

  // No tips ever (+20 pts)
  if (subscriber.tipCount === 0 || subscriber.totalTips === 0) {
    score += 20;
  }

  // No interaction in 30+ days (+40 pts)
  const referenceDate = subscriber.lastInteractedAt ?? subscriber.subscribedAt;
  const daysSinceActive =
    (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceActive >= 30) {
    score += 40;
  }

  // Never messaged back (+15 pts)
  if (!subscriber.lastMessageAt) {
    score += 15;
  }

  return Math.min(100, Math.round(score));
}
