import { apiClient } from "../api";

export interface AccountInfoResponse {
  user: {
    id: number;
    email: string | null;
    name: string | null;
    createdAt: string;
  };
  subscription: {
    plan: "FREE" | "PRO" | "ENTERPRISE";
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
  };
  limits: {
    maxWebsites: number | null;
    currentWebsites: number;
    pingInterval: number;
    pingIntervalFormatted: string;
    logRetentionSeconds: number;
    logRetentionFormatted: string;
    publicStatusPage: boolean;
  };
}

/**
 * Get account information including subscription plan and limits
 */
export async function getAccountInfo(token: string | null): Promise<AccountInfoResponse> {
  return apiClient.get<AccountInfoResponse>("/api/users/account", token);
}

