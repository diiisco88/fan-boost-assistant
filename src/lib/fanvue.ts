const BASE_URL = "https://api.fanvue.com";

const SCOPES = [
  "read:self",
  "read:creator",
  "read:fan",
  "read:chat",
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
    headers: { Authorization: `Bearer ${token}` },
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

export async function getSubscribers(token: string): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/v1/creator/subscribers`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch subscribers: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.subscribers ?? [];
}

export async function getTips(token: string): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/v1/creator/tips`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tips: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.tips ?? [];
}

export async function getPosts(token: string): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/v1/creator/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : data.data ?? data.posts ?? [];
}

export async function sendMessage(
  token: string,
  fanId: string,
  message: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/v1/chat/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fan_id: fanId, message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${text}`);
  }
}
