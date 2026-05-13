const BASE_URL = "https://api.fanvue.com";
const API_VERSION = "2025-06-26";

function apiHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "X-Fanvue-API-Version": API_VERSION,
  };
}

const SCOPES = [
  "read:self",
  "read:creator",
  "read:fan",
  "read:chat",
  "write:chat",
  "read:insights",
  "read:post",
  "read:media",
  "read:tracking_links",
].join(" ");

export function getFanvueAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FANVUE_CLIENT_ID ?? "",
    redirect_uri: process.env.FANVUE_REDIRECT_URI ?? "",
    response_type: "code",
    scope: SCOPES,
    state,
  });
  return `https://fanvue.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch(`${BASE_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.FANVUE_CLIENT_ID ?? "",
      client_secret: process.env.FANVUE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.FANVUE_REDIRECT_URI ?? "",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Fanvue token exchange failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getCreatorProfile(token: string): Promise<{
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string;
}> {
  const response = await fetch(`${BASE_URL}/v1/me`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch creator profile: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id ?? data.uuid ?? "",
    handle: data.username ?? data.handle ?? "",
    displayName: data.display_name ?? data.displayName ?? data.username ?? "",
    avatarUrl: data.avatar_url ?? data.avatarUrl ?? "",
  };
}

export async function getCreatorSubscribers(
  token: string,
  creatorUserUuid: string,
  page = 1,
  size = 15
): Promise<FollowersPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetch(
    `${BASE_URL}/creators/${creatorUserUuid}/subscribers?${params}`,
    { headers: apiHeaders(token) }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch creator subscribers: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getTips(token: string): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/v1/creator/tips`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tips: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.tips ?? [];
}

export async function getPosts(token: string): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/v1/creator/posts`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.posts ?? [];
}

export async function sendMessage(
  token: string,
  userUuid: string,
  options: {
    text?: string | null;
    mediaUuids?: string[];
    price?: number | null;
    templateUuid?: string | null;
  }
): Promise<{ messageUuid: string }> {
  const response = await fetch(`${BASE_URL}/chats/${userUuid}/message`, {
    method: "POST",
    headers: { ...apiHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${text}`);
  }

  return response.json();
}

export interface Follower {
  uuid: string;
  handle: string;
  displayName: string;
  nickname: string | null;
  isTopSpender: boolean;
  avatarUrl: string | null;
  registeredAt: string;
}

export interface Pagination {
  page: number;
  size: number;
  hasMore: boolean;
}

export interface FollowersPage {
  data: Follower[];
  pagination: Pagination;
}

export async function getFollowers(
  token: string,
  page = 1,
  size = 15
): Promise<FollowersPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetch(`${BASE_URL}/followers?${params}`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch followers: ${response.status} ${text}`);
  }

  return response.json();
}

export interface ChatterLeaderboardEntry {
  chatterUuid: string;
  chatterName: string;
  avatarUrl: string | null;
  messages: number;
  ppvsSent: number;
  ppvsUnlocked: number;
  revenue: number;
  goldenRatio: number;
  unlockRatio: number;
  activeHours: number;
  eph: number;
  avgResponseMs: number | null;
}

export type ChatMessageType =
  | "AUTOMATED_CANCELED"
  | "AUTOMATED_NEW_FOLLOWER"
  | "AUTOMATED_NEW_PURCHASE"
  | "AUTOMATED_NEW_SUBSCRIBER"
  | "AUTOMATED_RE_SUBSCRIBED"
  | "AUTOMATED_RENEWED"
  | "AUTOMATED_CHAT_MESSAGE_REPLY"
  | "AUTOMATED_FIRST_MESSAGE_REPLY"
  | "CHAT_TEXT_GENERATION"
  | "CHAT_TEXT_REPLY"
  | "CHAT_TEXT_REWRITE"
  | "SINGLE_RECIPIENT"
  | "TIP"
  | "VOICE_CALL"
  | "BROADCAST"
  | "GHOST_PROMOTION";

export interface ChatLastMessage {
  text: string | null;
  type: ChatMessageType;
  uuid: string;
  sentAt: string | null;
  hasMedia: boolean | null;
  mediaType: "image" | "video" | "audio" | "document" | null;
  senderUuid: string;
  sentByUserId: string | null;
}

export interface Chat {
  createdAt: string | null;
  lastMessageAt: string | null;
  isRead: boolean;
  isMuted: boolean;
  unreadMessagesCount: number;
  user: Follower;
  lastMessage: ChatLastMessage | null;
}

export interface ChatsPage {
  data: Chat[];
  pagination: Pagination;
}

export interface MessageParticipant {
  uuid: string;
  handle: string;
}

export interface Message {
  uuid: string;
  text: string | null;
  sentAt: string | null;
  sender: MessageParticipant;
  recipient: MessageParticipant;
  hasMedia: boolean | null;
  mediaType: "image" | "video" | "audio" | "document" | null;
  mediaUuids: string[];
  type: ChatMessageType;
  pricing: { USD: { price: number } } | null;
  purchasedAt: string | null;
  sentByUserId: string | null;
  isRead: boolean;
}

export interface MessagesPage {
  data: Message[];
  pagination: Pagination;
}

export type MediaVariantType = "main" | "thumbnail" | "thumbnail_gallery" | "blurred";

export interface MediaVariant {
  variantType: MediaVariantType;
  displayPosition: number;
  url: string;
  width: number | null;
  height: number | null;
  lengthMs: number | null;
}

export interface ChatMedia {
  uuid: string;
  messageUuid: string;
  mediaType: "image" | "video" | "audio" | "document" | "unknown";
  created_at: string | null;
  sentAt: string | null;
  ownerUuid: string;
  name: string | null;
  variants?: MediaVariant[];
}

export interface MediaError {
  mediaUuid: string;
  code: "NOT_IN_MESSAGE" | "INTERNAL";
  message: string;
}

export async function getMessageMedia(
  token: string,
  userUuid: string,
  messageUuid: string,
  mediaUuids: string[],
  variants?: string[]
): Promise<{ results: Record<string, ChatMedia>; errors: MediaError[] }> {
  const params = new URLSearchParams({ mediaUuids: mediaUuids.join(",") });
  if (variants?.length) params.set("variants", variants.join(","));

  const response = await fetch(
    `${BASE_URL}/chats/${userUuid}/messages/${messageUuid}/media?${params}`,
    { headers: apiHeaders(token) }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch message media: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getChatMessages(
  token: string,
  userUuid: string,
  page = 1,
  size = 15,
  markAsRead = false
): Promise<MessagesPage> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    markAsRead: String(markAsRead),
  });
  const response = await fetch(`${BASE_URL}/chats/${userUuid}/messages?${params}`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch chat messages: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getCreatorChats(
  token: string,
  creatorUserUuid: string,
  page = 1,
  size = 15
): Promise<ChatsPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetch(
    `${BASE_URL}/creators/${creatorUserUuid}/chats?${params}`,
    { headers: apiHeaders(token) }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch creator chats: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getCreatorFollowers(
  token: string,
  creatorUserUuid: string,
  page = 1,
  size = 15
): Promise<FollowersPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const response = await fetch(
    `${BASE_URL}/creators/${creatorUserUuid}/followers?${params}`,
    { headers: apiHeaders(token) }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch creator followers: ${response.status} ${text}`);
  }

  return response.json();
}

export async function getChatterLeaderboard(
  token: string,
  options?: { startDate?: string; endDate?: string; chatterUuids?: string[] }
): Promise<ChatterLeaderboardEntry[]> {
  const params = new URLSearchParams();
  if (options?.startDate) params.set("startDate", options.startDate);
  if (options?.endDate) params.set("endDate", options.endDate);
  if (options?.chatterUuids?.length) params.set("chatterUuids", options.chatterUuids.join(","));

  const qs = params.toString();
  const response = await fetch(
    `${BASE_URL}/agencies/insights/chatter-leaderboard${qs ? `?${qs}` : ""}`,
    { headers: apiHeaders(token) }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch chatter leaderboard: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.data;
}

export type PricingPlanStatus = "pending_setup" | "active" | "withdrawn";
export type AppOverallStatus =
  | "notConfigured"
  | "pendingSetup"
  | "active"
  | "withdrawn"
  | "mixed"
  | "unavailable";

export interface PricingPlan {
  uuid: string;
  name: string;
  billingType: "free" | "one_time" | "recurring";
  interval: "monthly" | "yearly" | null;
  price: number;
  currencyCode: string;
  status: PricingPlanStatus;
}

export interface AppSubscriptionStatus {
  appUuid: string;
  appName: string;
  availability: "complete" | "horizonUnavailable";
  overallStatus: AppOverallStatus;
  pricingPlans: PricingPlan[];
}

export async function getAppSubscriptionStatus(
  token: string,
  appUuid: string
): Promise<AppSubscriptionStatus> {
  const response = await fetch(`${BASE_URL}/apps/${appUuid}/subscription-status`, {
    headers: apiHeaders(token),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch app subscription status: ${response.status} ${text}`);
  }

  return response.json();
}
