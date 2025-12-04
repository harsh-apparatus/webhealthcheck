import { getAuth } from "@clerk/express";
import { Plan, SubscriptionStatus } from "@prisma/client";
import type { Request, Response } from "express";
import { getTierLimits } from "../config/appConfiguration";
import prisma from "../prismaClient";
import { getUserPlan } from "../services/subscriptionService";

/**
 * Get account information including subscription plan and limits
 */
export const getAccountInfo = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        monitors: {
          select: {
            id: true,
            isActive: true,
          },
        },
        subscriptions: {
          where: {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = await getUserPlan(user.id);
    const limits = getTierLimits(plan);
    const activeSubscription = user.subscriptions[0] || null;
    const totalMonitorsCount = user.monitors.length; // Total count (active + inactive)

    // Format ping interval for display
    const formatPingInterval = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      return `${Math.floor(seconds / 86400)}d`;
    };

    // Format log retention for display (converts seconds to days for display)
    const formatLogRetention = (seconds: number): string => {
      const days = Math.floor(seconds / (24 * 60 * 60));
      if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
      if (days < 365)
        return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"}`;
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"}`;
    };

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      subscription: {
        plan,
        status: activeSubscription?.status || "FREE",
        startedAt: activeSubscription?.startedAt || null,
        expiresAt: activeSubscription?.expiresAt || null,
      },
      limits: {
        maxWebsites: limits.maxWebsites,
        currentWebsites: totalMonitorsCount, // Total count of all monitors
        pingInterval: limits.pingIntervalSeconds,
        pingIntervalFormatted: formatPingInterval(limits.pingIntervalSeconds),
        logRetentionSeconds: limits.logRetentionSeconds,
        logRetentionFormatted: formatLogRetention(limits.logRetentionSeconds),
        publicStatusPage: limits.publicStatusPage,
      },
    });
  } catch (err) {
    console.error("getAccountInfo error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Get plan details including limits and current usage
 */
export const getPlanDetails = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        monitors: {
          select: {
            id: true,
            isActive: true,
          },
        },
        subscriptions: {
          where: {
            status: {
              in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = await getUserPlan(user.id);
    const limits = getTierLimits(plan);
    const activeSubscription = user.subscriptions[0] || null;
    const totalMonitorsCount = user.monitors.length;
    const activeMonitorsCount = user.monitors.filter((m) => m.isActive).length;

    // Format ping interval for display
    const formatPingInterval = (seconds: number): string => {
      if (seconds < 60) return `${seconds}s`;
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
      return `${Math.floor(seconds / 86400)}d`;
    };

    // Format log retention for display
    const formatLogRetention = (seconds: number): string => {
      const days = Math.floor(seconds / (24 * 60 * 60));
      if (days < 30) return `${days} day${days === 1 ? "" : "s"}`;
      if (days < 365)
        return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"}`;
      return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"}`;
    };

    return res.status(200).json({
      plan,
      subscription: {
        status: activeSubscription?.status || "FREE",
        startedAt: activeSubscription?.startedAt || null,
        expiresAt: activeSubscription?.expiresAt || null,
      },
      limits: {
        maxWebsites: limits.maxWebsites,
        currentWebsites: totalMonitorsCount,
        activeWebsites: activeMonitorsCount,
        pingInterval: limits.pingIntervalSeconds,
        pingIntervalFormatted: formatPingInterval(limits.pingIntervalSeconds),
        logRetentionSeconds: limits.logRetentionSeconds,
        logRetentionFormatted: formatLogRetention(limits.logRetentionSeconds),
        publicStatusPage: limits.publicStatusPage,
      },
      usage: {
        websitesUsed: totalMonitorsCount,
        websitesRemaining:
          limits.maxWebsites === null
            ? null
            : Math.max(0, limits.maxWebsites - totalMonitorsCount),
        canAddMore:
          limits.maxWebsites === null ||
          totalMonitorsCount < limits.maxWebsites,
      },
    });
  } catch (err) {
    console.error("getPlanDetails error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Sync subscription from Clerk metadata
 * POST /api/users/sync-subscription
 * Body: { plan: "FREE" | "PRO" | "ENTERPRISE" }
 */
export const syncSubscription = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { plan: planFromRequest } = req.body;
    if (!planFromRequest) {
      return res.status(400).json({ error: "Plan is required" });
    }

    // Validate plan value
    const validPlans: Plan[] = [Plan.FREE, Plan.PRO, Plan.ENTERPRISE];
    if (!validPlans.includes(planFromRequest as Plan)) {
      return res
        .status(400)
        .json({ error: "Invalid plan. Must be FREE, PRO, or ENTERPRISE" });
    }

    const plan = planFromRequest as Plan;

    // Check if user already has an active subscription with this plan
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        plan,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingSubscription) {
      return res.status(200).json({
        message: "Subscription already synced",
        subscription: existingSubscription,
        plan,
      });
    }

    // Deactivate any existing active subscriptions
    await prisma.subscription.updateMany({
      where: {
        userId: user.id,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
        },
      },
      data: {
        status: SubscriptionStatus.CANCELLED,
      },
    });

    // Create new subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
      },
    });

    console.log(
      `Synced ${plan} subscription for user ${user.id} (clerkId=${clerkId}, subscription ID: ${subscription.id})`,
    );

    return res.status(200).json({
      message: "Subscription synced successfully",
      subscription,
      plan,
    });
  } catch (err) {
    console.error("syncSubscription error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};
