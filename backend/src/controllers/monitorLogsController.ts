import { getAuth } from "@clerk/express";
import type { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import prisma from "../prismaClient";

/**
 * Get paginated logs for a monitor
 * GET /api/monitors/:id/logs?page=1&limit=50
 */
export const getMonitorLogs = async (req: Request, res: Response) => {
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

    const monitorId = parseInt(req.params.id, 10);
    if (Number.isNaN(monitorId)) {
      return res.status(400).json({ error: "Invalid monitor ID" });
    }

    // Verify monitor belongs to user
    const monitor = await prisma.monitor.findFirst({
      where: {
        id: monitorId,
        userId: user.id,
      },
    });

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Get filter parameters
    const status = req.query.status as string | undefined; // "up" or "down"
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    // Build where clause
    const where: Prisma.HistoryLogWhereInput = {
      monitorId,
    };

    if (status === "up") {
      where.isUp = true;
    } else if (status === "down") {
      where.isUp = false;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      prisma.historyLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.historyLog.count({ where }),
    ]);

    // Transform logs - ensure timestamp is properly formatted as ISO string
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      monitorId: log.monitorId,
      latency: log.pingMs,
      statusCode: log.statusCode,
      status: log.isUp ? "up" : "down",
      bodySnippet: log.bodySnippet,
      timestamp: log.createdAt.toISOString(), // Explicitly format as ISO string
    }));

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (err) {
    console.error("getMonitorLogs error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};
