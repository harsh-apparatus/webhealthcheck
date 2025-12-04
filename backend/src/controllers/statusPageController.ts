import { getAuth } from "@clerk/express";
import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { hasPublicStatusPage } from "../config/appConfiguration";
import prisma from "../prismaClient";
import { getUserPlan } from "../services/subscriptionService";

/**
 * Get all status pages for the authenticated user
 */
export const getStatusPages = async (req: Request, res: Response) => {
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

    const statusPages = await prisma.statusPage.findMany({
      where: { userId: user.id },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ statusPages });
  } catch (err) {
    console.error("getStatusPages error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Get a single status page by ID
 */
export const getStatusPage = async (req: Request, res: Response) => {
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

    const statusPageId = parseInt(req.params.id, 10);
    if (Number.isNaN(statusPageId)) {
      return res.status(400).json({ error: "Invalid status page ID" });
    }

    const statusPage = await prisma.statusPage.findFirst({
      where: {
        id: statusPageId,
        userId: user.id,
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    if (!statusPage) {
      return res.status(404).json({ error: "Status page not found" });
    }

    return res.status(200).json({ statusPage });
  } catch (err) {
    console.error("getStatusPage error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Create a new status page
 */
export const createStatusPage = async (req: Request, res: Response) => {
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

    // Check if user has access to public status pages
    const userPlan = await getUserPlan(user.id);
    if (!hasPublicStatusPage(userPlan)) {
      return res.status(403).json({
        error: "Public status pages are not available on your plan",
        detail:
          "Please upgrade to PRO or ENTERPRISE plan to use public status pages.",
      });
    }

    const { name, slug, monitorIds } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: "Invalid slug format",
        detail:
          "Slug must contain only lowercase letters, numbers, and hyphens",
      });
    }

    // Check if slug already exists
    const existingSlug = await prisma.statusPage.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return res.status(400).json({ error: "Slug already exists" });
    }

    // Verify monitors belong to user
    if (monitorIds && Array.isArray(monitorIds) && monitorIds.length > 0) {
      const monitors = await prisma.monitor.findMany({
        where: {
          id: { in: monitorIds.map((id: string) => parseInt(id, 10)) },
          userId: user.id,
        },
      });

      if (monitors.length !== monitorIds.length) {
        return res
          .status(400)
          .json({ error: "Some monitors not found or don't belong to you" });
      }
    }

    // Create status page with monitors
    const statusPage = await prisma.statusPage.create({
      data: {
        userId: user.id,
        name,
        slug,
        monitors: {
          create: (monitorIds || []).map(
            (monitorId: string, index: number) => ({
              monitorId: parseInt(monitorId, 10),
              displayOrder: index,
            }),
          ),
        },
      },
      include: {
        monitors: {
          include: {
            monitor: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    return res.status(201).json({ statusPage });
  } catch (err) {
    console.error("createStatusPage error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Update a status page
 */
export const updateStatusPage = async (req: Request, res: Response) => {
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

    const statusPageId = parseInt(req.params.id, 10);
    if (Number.isNaN(statusPageId)) {
      return res.status(400).json({ error: "Invalid status page ID" });
    }

    // Check if status page exists and belongs to user
    const existingStatusPage = await prisma.statusPage.findFirst({
      where: {
        id: statusPageId,
        userId: user.id,
      },
    });

    if (!existingStatusPage) {
      return res.status(404).json({ error: "Status page not found" });
    }

    const { name, slug, isActive, monitorIds } = req.body;

    // Validate slug if provided
    if (slug && slug !== existingStatusPage.slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return res.status(400).json({
          error: "Invalid slug format",
          detail:
            "Slug must contain only lowercase letters, numbers, and hyphens",
        });
      }

      const existingSlug = await prisma.statusPage.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        return res.status(400).json({ error: "Slug already exists" });
      }
    }

    // Verify monitors belong to user if provided
    if (monitorIds && Array.isArray(monitorIds)) {
      const monitors = await prisma.monitor.findMany({
        where: {
          id: { in: monitorIds.map((id: string) => parseInt(id, 10)) },
          userId: user.id,
        },
      });

      if (monitors.length !== monitorIds.length) {
        return res
          .status(400)
          .json({ error: "Some monitors not found or don't belong to you" });
      }
    }

    // Update status page
    const updateData: Prisma.StatusPageUpdateInput = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update monitors if provided
    if (monitorIds && Array.isArray(monitorIds)) {
      // Delete existing monitor associations
      await prisma.statusPageMonitor.deleteMany({
        where: { statusPageId },
      });

      // Create new associations
      await prisma.statusPageMonitor.createMany({
        data: monitorIds.map((monitorId: string, index: number) => ({
          statusPageId,
          monitorId: parseInt(monitorId, 10),
          displayOrder: index,
        })),
      });
    }

    const statusPage = await prisma.statusPage.update({
      where: { id: statusPageId },
      data: updateData,
      include: {
        monitors: {
          include: {
            monitor: true,
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    return res.status(200).json({ statusPage });
  } catch (err) {
    console.error("updateStatusPage error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Delete a status page
 */
export const deleteStatusPage = async (req: Request, res: Response) => {
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

    const statusPageId = parseInt(req.params.id, 10);
    if (Number.isNaN(statusPageId)) {
      return res.status(400).json({ error: "Invalid status page ID" });
    }

    const existingStatusPage = await prisma.statusPage.findFirst({
      where: {
        id: statusPageId,
        userId: user.id,
      },
    });

    if (!existingStatusPage) {
      return res.status(404).json({ error: "Status page not found" });
    }

    await prisma.statusPage.delete({
      where: { id: statusPageId },
    });

    return res
      .status(200)
      .json({ message: "Status page deleted successfully" });
  } catch (err) {
    console.error("deleteStatusPage error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

/**
 * Get public status page by slug (no auth required)
 */
export const getPublicStatusPage = async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;

    const statusPage = await prisma.statusPage.findUnique({
      where: {
        slug,
        isActive: true,
      },
      include: {
        monitors: {
          include: {
            monitor: {
              include: {
                history: {
                  orderBy: { createdAt: "desc" },
                  take: 1, // Latest ping
                },
              },
            },
          },
          orderBy: {
            displayOrder: "asc",
          },
        },
      },
    });

    if (!statusPage) {
      return res.status(404).json({ error: "Status page not found" });
    }

    // Get 30-day history for each monitor for uptime calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monitorsWithStats = await Promise.all(
      statusPage.monitors.map(async (spm) => {
        const monitor = spm.monitor;

        // Get logs from last 30 days
        const logs = await prisma.historyLog.findMany({
          where: {
            monitorId: monitor.id,
            createdAt: {
              gte: thirtyDaysAgo,
            },
          },
          orderBy: { createdAt: "asc" },
        });

        const totalPings = logs.length;
        const upPings = logs.filter((log) => log.isUp).length;
        const uptimePercentage =
          totalPings > 0 ? (upPings / totalPings) * 100 : 100;

        // Create 30-day uptime bar data (one data point per day)
        const uptimeBarData = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          date.setHours(0, 0, 0, 0);
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);

          const dayLogs = logs.filter(
            (log) => log.createdAt >= date && log.createdAt < nextDate,
          );
          const dayUp =
            dayLogs.length > 0 ? dayLogs.every((log) => log.isUp) : null;
          uptimeBarData.push({
            date: date.toISOString(),
            isUp: dayUp,
            hasData: dayLogs.length > 0,
          });
        }

        return {
          id: monitor.id,
          name: monitor.name,
          url: monitor.url,
          isUp: monitor.history[0]?.isUp ?? false,
          lastPing: monitor.history[0]?.createdAt ?? null,
          uptimePercentage: uptimePercentage.toFixed(3),
          uptimeBarData,
        };
      }),
    );

    return res.status(200).json({
      statusPage: {
        id: statusPage.id,
        name: statusPage.name,
        slug: statusPage.slug,
        monitors: monitorsWithStats,
      },
    });
  } catch (err) {
    console.error("getPublicStatusPage error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};
