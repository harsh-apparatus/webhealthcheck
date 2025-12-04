import prisma from "../prismaClient";
import { Plan, SubscriptionStatus } from "@prisma/client";

/**
 * Get the active subscription plan for a user
 * Returns FREE if no active subscription found
 * Considers both ACTIVE and TRIALING subscriptions as active
 */
export async function getUserPlan(userId: number): Promise<Plan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription?.plan || Plan.FREE;
}

