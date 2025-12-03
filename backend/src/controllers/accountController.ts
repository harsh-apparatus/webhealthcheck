import { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import prisma from "../prismaClient";
import { getUserPlan } from "../services/subscriptionService";
import { getTierLimits } from "../config/appConfiguration";

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
            status: "ACTIVE",
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
      if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"}`;
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

