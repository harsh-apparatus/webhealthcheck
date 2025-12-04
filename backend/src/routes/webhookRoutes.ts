// src/routes/webhookRoutes.ts
import { Router } from "express";
import prisma from "../prismaClient";
import { Webhook } from "svix";
import { Request, Response } from "express";
import { Plan, SubscriptionStatus } from "@prisma/client";

const router = Router();

/**
 * Sync subscription from Clerk publicMetadata
 */
async function syncSubscriptionFromMetadata(userId: number, publicMetadata: any) {
  const planFromMetadata = publicMetadata?.plan as string | undefined;
  
  if (!planFromMetadata) {
    console.log(`No plan found in metadata for user ${userId}`);
    return;
  }

  // Validate plan value
  const validPlans: Plan[] = [Plan.FREE, Plan.PRO, Plan.ENTERPRISE];
  if (!validPlans.includes(planFromMetadata as Plan)) {
    console.warn(`Invalid plan in metadata: ${planFromMetadata} for user ${userId}`);
    return;
  }

  const plan = planFromMetadata as Plan;

  // Check if user already has an active subscription with this plan
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
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
    console.log(`User ${userId} already has active ${plan} subscription`);
    return;
  }

  // Deactivate any existing active subscriptions
  await prisma.subscription.updateMany({
    where: {
      userId,
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
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      startedAt: new Date(),
    },
  });

  console.log(`Created ${plan} subscription for user ${userId} (subscription ID: ${subscription.id})`);
}

router.post("/clerk", async (req: Request, res: Response) => {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("Missing CLERK_WEBHOOK_SECRET in .env");
      return res.status(500).json({ error: "Missing CLERK_WEBHOOK_SECRET" });
    }

    const rawBodyBuffer: Buffer = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body));

    console.log("Webhook incoming headers:", {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]?.toString?.().slice(0, 80),
    });
    console.log("Webhook raw body (snippet):", rawBodyBuffer.toString("utf8", 0, 200));

    const svixHeaders = {
      "svix-id": (req.headers["svix-id"] as string) ?? "",
      "svix-timestamp": (req.headers["svix-timestamp"] as string) ?? "",
      "svix-signature": (req.headers["svix-signature"] as string) ?? "",
    };

    const wh = new Webhook(WEBHOOK_SECRET);
    const evt = wh.verify(rawBodyBuffer, svixHeaders);

    const { type, data } = evt;

    if (type === "user.created" || type === "user.updated") {
      const email = data?.email_addresses?.[0]?.email_address ?? null;
      const name = data?.first_name ?? null;
      const publicMetadata = data?.public_metadata as any;

      // Build create/update objects only with defined fields
      const createData: { clerkId: string; email?: string; name?: string } = {
        clerkId: data.id,
      };
      if (email) createData.email = email;
      if (name) createData.name = name ?? undefined;

      const updateData: { email?: string; name?: string } = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name ?? undefined;

      const user = await prisma.user.upsert({
        where: { clerkId: data.id },
        update: updateData,
        create: createData,
      });

      console.log(`User synced: ${user.email ?? "(no email)"} (clerkId=${user.clerkId})`);

      // Sync subscription from Clerk publicMetadata
      if (publicMetadata) {
        await syncSubscriptionFromMetadata(user.id, publicMetadata);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return res.status(400).json({ error: "Invalid webhook", detail: String(err) });
  }
});

export default router;
