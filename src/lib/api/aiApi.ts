import { fetchApi } from "./client";
import { ApiResponse } from "@/types/api";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiChatResponse {
  reply: string;
}

export async function apiSendAiChatMessage(
  messages: AiChatMessage[],
): Promise<ApiResponse<AiChatResponse>> {
  return fetchApi("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
    timeout: 120000,
  });
}
