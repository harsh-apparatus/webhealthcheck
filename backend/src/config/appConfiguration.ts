import type { Plan } from "@prisma/client";

export interface TierLimits {
  maxWebsites: number | null; // null means unlimited
  pingIntervalSeconds: number;
  logRetentionSeconds: number; // Number of seconds to retain logs
  publicStatusPage: boolean; // Whether public status page is available
}

export const APP_CONFIG: Record<Plan, TierLimits> = {
  FREE: {
    maxWebsites: 2,
    pingIntervalSeconds: 60,
    logRetentionSeconds: 7 * 24 * 60 * 60, // 7 days in seconds
    publicStatusPage: false,
  },
  PRO: {
    maxWebsites: 10,
    pingIntervalSeconds: 20 * 1,
    logRetentionSeconds: 30 * 24 * 60 * 60,
    publicStatusPage: true,
  },
  ENTERPRISE: {
    maxWebsites: null,
    pingIntervalSeconds: 60 * 6,
    logRetentionSeconds: 180 * 24 * 60 * 60,
    publicStatusPage: true,
  },
};

/**
 * Get the limits for a specific subscription plan
 */
export function getTierLimits(plan: Plan): TierLimits {
  return APP_CONFIG[plan];
}

/**
 * Check if a user can add more websites based on their plan
 */
export function canAddWebsite(
  currentWebsiteCount: number,
  plan: Plan,
): boolean {
  const limits = getTierLimits(plan);
  if (limits.maxWebsites === null) {
    return true; // Unlimited
  }
  return currentWebsiteCount < limits.maxWebsites;
}

/**
 * Get the ping interval in milliseconds for a plan
 */
export function getPingIntervalMs(plan: Plan): number {
  const limits = getTierLimits(plan);
  return limits.pingIntervalSeconds * 1000;
}

/**
 * Get the ping interval in seconds for a plan
 */
export function getPingIntervalSeconds(plan: Plan): number {
  const limits = getTierLimits(plan);
  return limits.pingIntervalSeconds;
}

/**
 * Get the log retention period in seconds for a plan
 */
export function getLogRetentionSeconds(plan: Plan): number {
  const limits = getTierLimits(plan);
  return limits.logRetentionSeconds;
}

/**
 * Check if public status page is available for a plan
 */
export function hasPublicStatusPage(plan: Plan): boolean {
  const limits = getTierLimits(plan);
  return limits.publicStatusPage;
}

/**
 * Get the date before which logs should be deleted (based on retention policy)
 */
export function getLogRetentionCutoffDate(plan: Plan): Date {
  const retentionSeconds = getLogRetentionSeconds(plan);
  const cutoffDate = new Date();
  cutoffDate.setTime(cutoffDate.getTime() - retentionSeconds * 1000);
  return cutoffDate;
}
