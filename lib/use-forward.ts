"use client";

interface ForwardResponse {
  success: boolean;
  data: {
    forwarded: number;
    conversationIds: string[];
  };
}

/**
 * Forward a message to one or more conversations.
 *
 * @param messageId - The ID of the message to forward
 * @param conversationIds - Array of conversation IDs to forward the message to
 * @returns The response data from the API
 * @throws Error if the request fails
 */
export async function forwardMessage(
  messageId: string,
  conversationIds: string[]
): Promise<ForwardResponse["data"]> {
  const res = await fetch("/api/messages/forward", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, conversationIds }),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || "Failed to forward message");
  }

  return json.data;
}
