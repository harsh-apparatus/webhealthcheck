import prisma from "../prismaClient";
import { Plan } from "@prisma/client";

/**
 * Get the active subscription plan for a user
 * Returns FREE if no active subscription found
 */
export async function getUserPlan(userId: number): Promise<Plan> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return subscription?.plan || Plan.FREE;
}

