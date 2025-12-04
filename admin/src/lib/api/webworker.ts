import { apiClient } from "../api";

export interface WebworkerStatusResponse {
  status: "online" | "offline";
  service?: string;
  url: string;
  lastChecked: string;
  response?: {
    status: string;
    service: string;
    time: string;
  };
  error?: string;
}

export interface WebworkerTestResponse {
  success: boolean;
  message?: string;
  result?: {
    monitorId: number;
    pingMs: number | null;
    statusCode: number | null;
    isUp: boolean;
    bodySnippet: string | null;
    error: string | null;
  };
  error?: string;
  detail?: string;
}

/**
 * Get webworker service status
 */
export async function getWebworkerStatus(
  token: string | null,
): Promise<WebworkerStatusResponse> {
  return apiClient.get<WebworkerStatusResponse>("/api/webworker/status", token);
}

/**
 * Test webworker ping functionality
 */
export async function testWebworker(
  url?: string,
  isHttps?: boolean,
  token?: string | null,
): Promise<WebworkerTestResponse> {
  return apiClient.post<WebworkerTestResponse>(
    "/api/webworker/test",
    { url, isHttps },
    token,
  );
}
