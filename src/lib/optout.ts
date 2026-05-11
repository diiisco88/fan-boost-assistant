export const DEFAULT_OPT_OUT_KEYWORDS =
  "stop,unsubscribe,no more,leave me alone,opt out,remove me";

export function containsOptOut(message: string, keywords: string): boolean {
  const lowerMessage = message.toLowerCase();
  const keywordList = keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length > 0);

  return keywordList.some((keyword) => lowerMessage.includes(keyword));
}
