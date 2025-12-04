import { Request, Response } from "express";
import prisma from "../prismaClient";

interface LogPingResultBody {
  monitorId: number;
  pingMs: number | null;
  statusCode: number | null;
  isUp: boolean;
  bodySnippet: string | null;
  error: string | null;
}

export const logPingResult = async (req: Request, res: Response) => {
  try {
    // Get monitorId from URL parameter (primary) or body (fallback for backwards compatibility)
    const monitorIdFromParam = parseInt(req.params.id);
    const monitorId = !isNaN(monitorIdFromParam) ? monitorIdFromParam : req.body.monitorId;
    
    const { pingMs, statusCode, isUp, bodySnippet, error } =
      req.body;

    // Validate required fields
    if (monitorId === undefined || isNaN(Number(monitorId)) || isUp === undefined) {
      return res.status(400).json({
        error: "monitorId (in URL or body) and isUp are required fields",
      });
    }

    // Check if monitor exists
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
    });

    if (!monitor) {
      return res.status(404).json({ error: "Monitor not found" });
    }

    // Create history log entry
    // Only store bodySnippet when there's an error (isUp === false) to reduce storage overhead
    const historyLog = await prisma.historyLog.create({
      data: {
        monitorId,
        pingMs,
        statusCode,
        isUp,
        bodySnippet: isUp === false ? (bodySnippet || error || null) : null,
      },
    });

    return res.status(201).json({ log: historyLog });
  } catch (err) {
    console.error("logPingResult error:", err);
    return res.status(500).json({
      error: "Database error",
      detail: String(err),
    });
  }
};

