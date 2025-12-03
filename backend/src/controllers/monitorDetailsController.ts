import { Request, Response } from "express";
import prisma from "../prismaClient";
import { getAuth } from "@clerk/express";

/**
 * Get detailed information about a monitor including statistics
 * GET /api/monitors/:id/details
 */
export const getMonitorDetails = async (req: Request, res: Response) => {
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

    // Get monitor with user validation
    const monitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id,
      },
      include: {
        history: {
          orderBy: { createdAt: "desc" },
          take: 1, // Latest log
        },
      },
    });

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Get statistics from history logs
    const totalLogs = await prisma.historyLog.count({
      where: { monitorId },
    });

    const upLogs = await prisma.historyLog.count({
      where: {
        monitorId,
        isUp: true,
      },
    });

    const downLogs = await prisma.historyLog.count({
      where: {
        monitorId,
        isUp: false,
      },
    });

    const uptimePercentage =
      totalLogs > 0 ? ((upLogs / totalLogs) * 100).toFixed(2) : "0.00";

    // Get average response time
    const avgResponseTime = await prisma.historyLog.aggregate({
      where: {
        monitorId,
        pingMs: { not: null },
      },
      _avg: {
        pingMs: true,
      },
    });

    // Get latest log
    const latestLog = monitor.history[0];

    // Get first log (oldest)
    const firstLog = await prisma.historyLog.findFirst({
      where: { monitorId },
      orderBy: { createdAt: "asc" },
    });

    const details = {
      id: monitor.id,
      userId: monitor.userId,
      name: monitor.name,
      url: monitor.url,
      isHttps: monitor.isHttps,
      isActive: monitor.isActive,
      createdAt: monitor.createdAt,
      updatedAt: monitor.updatedAt,
      statistics: {
        totalPings: totalLogs,
        upPings: upLogs,
        downPings: downLogs,
        uptimePercentage: parseFloat(uptimePercentage),
        averageResponseTime: avgResponseTime._avg.pingMs
          ? Math.round(avgResponseTime._avg.pingMs)
          : null,
        firstPing: firstLog?.createdAt || null,
        lastPing: latestLog?.createdAt || null,
      },
      lastPing: latestLog
        ? {
            id: latestLog.id,
            latency: latestLog.pingMs,
            status: latestLog.isUp ? "up" : "down",
            statusCode: latestLog.statusCode,
            bodySnippet: latestLog.bodySnippet,
            timestamp: latestLog.createdAt,
          }
        : null,
    };

    return res.status(200).json({ monitor: details });
  } catch (err) {
    console.error("getMonitorDetails error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

