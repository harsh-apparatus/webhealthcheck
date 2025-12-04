import { getAuth } from "@clerk/express";
import type { Plan } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import {
  canAddWebsite,
  getTierLimits,
  hasPublicStatusPage,
  type TierLimits,
} from "../config/appConfiguration";
import prisma from "../prismaClient";
import { getUserPlan } from "../services/subscriptionService";

export interface PlanLimitCheck {
  checkWebsiteLimit?: boolean;
  checkStatusPageAccess?: boolean;
  customCheck?: (
    plan: Plan,
    userId: number,
  ) => Promise<boolean | { allowed: boolean; error: string }>;
}

export interface RequestWithPlanInfo extends Request {
  userPlan: Plan;
  userLimits: TierLimits;
  userId: number;
}

/**
 * Middleware to check if the user's plan allows the requested action
 */
export const checkPlanLimits = (checks: PlanLimitCheck) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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

      const userPlan = await getUserPlan(user.id);
      const limits = getTierLimits(userPlan);

      // Check website limit if required
      if (checks.checkWebsiteLimit) {
        const currentMonitorCount = await prisma.monitor.count({
          where: { userId: user.id },
        });

        if (!canAddWebsite(currentMonitorCount, userPlan)) {
          const errorMessage = `Your ${userPlan} plan allows ${limits.maxWebsites} website${limits.maxWebsites === 1 ? "" : "s"} maximum. Please upgrade your plan to add more websites.`;
          return res.status(403).json({
            error: "Website limit reached",
            detail: errorMessage,
            message: errorMessage,
            currentCount: currentMonitorCount,
            maxAllowed: limits.maxWebsites,
            plan: userPlan,
          });
        }
      }

      // Check status page access if required
      if (checks.checkStatusPageAccess) {
        if (!hasPublicStatusPage(userPlan)) {
          return res.status(403).json({
            error: "Public status pages are not available on your plan",
            detail:
              "Please upgrade to PRO or ENTERPRISE plan to use public status pages.",
            plan: userPlan,
          });
        }
      }

      // Custom check if provided
      if (checks.customCheck) {
        const result = await checks.customCheck(userPlan, user.id);
        if (typeof result === "object" && !result.allowed) {
          return res.status(403).json({
            error: "Plan limit exceeded",
            detail: result.error,
            plan: userPlan,
          });
        } else if (result === false) {
          return res.status(403).json({
            error: "Plan limit exceeded",
            detail: "This action is not allowed on your current plan.",
            plan: userPlan,
          });
        }
      }

      // Attach plan info to request for use in controllers
      (req as RequestWithPlanInfo).userPlan = userPlan;
      (req as RequestWithPlanInfo).userLimits = limits;
      (req as RequestWithPlanInfo).userId = user.id;

      next();
    } catch (err) {
      console.error("checkPlanLimits middleware error:", err);
      return res
        .status(500)
        .json({ error: "Internal server error", detail: String(err) });
    }
  };
};
