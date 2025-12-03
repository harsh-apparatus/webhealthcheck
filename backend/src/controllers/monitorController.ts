import { Request, Response } from "express";
import prisma from "../prismaClient";
import { getAuth } from "@clerk/express";
import { getUserPlan } from "../services/subscriptionService";
import { canAddWebsite, getTierLimits } from "../config/appConfiguration";
import { scheduleMonitor, stopMonitor, rescheduleMonitor } from "../cron/monitorScheduler";

export const createMonitor = async (req: Request, res: Response) => {
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

    const { name, url, isHttps } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "name and url are required" });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Check subscription limits before creating monitor
    const userPlan = await getUserPlan(user.id);
    const currentMonitorCount = await prisma.monitor.count({
      where: { userId: user.id },
    });

    if (!canAddWebsite(currentMonitorCount, userPlan)) {
      const limits = getTierLimits(userPlan);
      const errorMessage = `Your ${userPlan} plan allows ${limits.maxWebsites} website${limits.maxWebsites === 1 ? '' : 's'} maximum. Please upgrade your plan to add more websites.`;
      return res.status(403).json({
        error: "Website limit reached",
        detail: errorMessage,
        message: errorMessage,
        currentCount: currentMonitorCount,
        maxAllowed: limits.maxWebsites,
        plan: userPlan,
      });
    }

    const monitor = await prisma.monitor.create({
      data: {
        userId: user.id,
        name,
        url,
        isHttps: isHttps ?? url.startsWith("https://"),
      },
    });

    // Schedule cron job for the new monitor
    await scheduleMonitor(monitor.id);

    return res.status(201).json({ monitor });
  } catch (err) {
    console.error("createMonitor error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

export const getMonitors = async (req: Request, res: Response) => {
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

    const monitors = await prisma.monitor.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get only the latest history log
        },
      },
    });

    // Transform the data to include latest ping info
    const monitorsWithLatestPing = monitors.map((monitor) => {
      const latestLog = monitor.history[0];
      return {
        id: monitor.id,
        userId: monitor.userId,
        name: monitor.name,
        url: monitor.url,
        isHttps: monitor.isHttps,
        isActive: monitor.isActive,
        createdAt: monitor.createdAt,
        updatedAt: monitor.updatedAt,
        lastPing: latestLog
          ? {
              latency: latestLog.pingMs,
              status: latestLog.isUp ? "up" : "down",
              statusCode: latestLog.statusCode,
              timestamp: latestLog.createdAt,
            }
          : null,
      };
    });

    return res.status(200).json({ monitors: monitorsWithLatestPing });
  } catch (err) {
    console.error("getMonitors error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

export const getMonitor = async (req: Request, res: Response) => {
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

    const monitorId = parseInt(req.params.id);
    if (isNaN(monitorId)) {
      return res.status(400).json({ error: "Invalid monitor ID" });
    }

    const monitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id, // Ensure the monitor belongs to the user
      },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    const latestLog = monitor.history[0];
    const monitorWithLatestPing = {
      id: monitor.id,
      userId: monitor.userId,
      name: monitor.name,
      url: monitor.url,
      isHttps: monitor.isHttps,
      isActive: monitor.isActive,
      createdAt: monitor.createdAt,
      updatedAt: monitor.updatedAt,
      lastPing: latestLog
        ? {
            latency: latestLog.pingMs,
            status: latestLog.isUp ? "up" : "down",
            statusCode: latestLog.statusCode,
            timestamp: latestLog.createdAt,
          }
        : null,
    };

    return res.status(200).json({ monitor: monitorWithLatestPing });
  } catch (err) {
    console.error("getMonitor error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

export const updateMonitor = async (req: Request, res: Response) => {
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

    const monitorId = parseInt(req.params.id);
    if (isNaN(monitorId)) {
      return res.status(400).json({ error: "Invalid monitor ID" });
    }

    // Check if monitor exists and belongs to the user
    const existingMonitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id,
      },
    });

    if (!existingMonitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    const { name, url, isHttps } = req.body;

    // Validate that at least one field is provided
    if (!name && !url && isHttps === undefined) {
      return res.status(400).json({ error: "At least one field (name, url, isHttps) must be provided" });
    }

    // Validate URL if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }
    }

    // Prepare update data
    const updateData: {
      name?: string;
      url?: string;
      isHttps?: boolean;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (url !== undefined) {
      updateData.url = url;
      // Auto-detect HTTPS if not explicitly provided
      if (isHttps === undefined) {
        updateData.isHttps = url.startsWith("https://");
      }
    }
    if (isHttps !== undefined) updateData.isHttps = isHttps;
    if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

    const monitor = await prisma.monitor.update({
      where: { id: monitorId },
      data: updateData,
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    // Handle cron job scheduling based on isActive status
    if (updateData.isActive !== undefined) {
      if (monitor.isActive) {
        // Reschedule if monitor is activated
        await rescheduleMonitor(monitorId);
      } else {
        // Stop cron job if monitor is deactivated
        stopMonitor(monitorId);
      }
    } else if (updateData.url !== undefined || updateData.isHttps !== undefined) {
      // Reschedule if URL or HTTPS changed (might affect ping behavior)
      await rescheduleMonitor(monitorId);
    }

    const latestLog = monitor.history[0];
    const monitorWithLatestPing = {
      id: monitor.id,
      userId: monitor.userId,
      name: monitor.name,
      url: monitor.url,
      isHttps: monitor.isHttps,
      isActive: monitor.isActive,
      createdAt: monitor.createdAt,
      updatedAt: monitor.updatedAt,
      lastPing: latestLog
        ? {
            latency: latestLog.pingMs,
            status: latestLog.isUp ? "up" : "down",
            statusCode: latestLog.statusCode,
            timestamp: latestLog.createdAt,
          }
        : null,
    };

    return res.status(200).json({ monitor: monitorWithLatestPing });
  } catch (err) {
    console.error("updateMonitor error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

export const deleteMonitor = async (req: Request, res: Response) => {
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

    const monitorId = parseInt(req.params.id);
    if (isNaN(monitorId)) {
      return res.status(400).json({ error: "Invalid monitor ID" });
    }

    // Check if monitor exists and belongs to the user
    const existingMonitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id,
      },
    });

    if (!existingMonitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Stop cron job before deleting
    stopMonitor(monitorId);

    // Delete the monitor (cascade will handle history logs)
    await prisma.monitor.delete({
      where: { id: monitorId },
    });

    return res.status(200).json({ 
      message: "Monitor deleted successfully",
      id: monitorId 
    });
  } catch (err) {
    console.error("deleteMonitor error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};