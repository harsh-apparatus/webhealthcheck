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

export interface PlanDetailsResponse {
  plan: "FREE" | "PRO" | "ENTERPRISE";
  subscription: {
    status: string;
    startedAt: string | null;
    expiresAt: string | null;
  };
  limits: {
    maxWebsites: number | null;
    currentWebsites: number;
    activeWebsites: number;
    pingInterval: number;
    pingIntervalFormatted: string;
    logRetentionSeconds: number;
    logRetentionFormatted: string;
    publicStatusPage: boolean;
  };
  usage: {
    websitesUsed: number;
    websitesRemaining: number | null;
    canAddMore: boolean;
  };
}

/**
 * Get account information including subscription plan and limits
 */
export async function getAccountInfo(token: string | null): Promise<AccountInfoResponse> {
  return apiClient.get<AccountInfoResponse>("/api/users/account", token);
}

/**
 * Get plan details including limits and current usage
 */
export async function getPlanDetails(token: string | null): Promise<PlanDetailsResponse> {
  return apiClient.get<PlanDetailsResponse>("/api/users/plan", token);
}

/**
 * Sync subscription from Clerk metadata
 */
export async function syncSubscription(plan: "FREE" | "PRO" | "ENTERPRISE", token: string | null): Promise<{ message: string; subscription: any; plan: string }> {
  return apiClient.post<{ message: string; subscription: any; plan: string }>("/api/users/sync-subscription", { plan }, token);
}

