import prisma from "../prismaClient";

const WEBWORKER_URL = process.env.WEBWORKER_URL || "http://localhost:4001";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5001";

/**
 * Execute a ping job for a single monitor
 */
export async function executePingJob(monitorId: number): Promise<void> {
  try {
    // Get monitor details
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      include: { user: true },
    });

    if (!monitor) {
      console.error(`Monitor ${monitorId} not found`);
      return;
    }

    if (!monitor.isActive) {
      console.log(`Monitor ${monitorId} is inactive, skipping ping`);
      return;
    }

    // Ping the URL via webworker
    const pingResponse = await fetch(`${WEBWORKER_URL}/ping`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: monitor.id,
        url: monitor.url,
        isHttps: monitor.isHttps,
      }),
    });

    if (!pingResponse.ok) {
      throw new Error(`Webworker ping failed: ${pingResponse.statusText}`);
    }

    const pingResult = await pingResponse.json();

    // Store the result via backend API
    // monitorId is in the URL path, ping result data goes in the body
    const logResponse = await fetch(
      `${BACKEND_URL}/api/monitors/${monitorId}/ping`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pingMs: pingResult.pingMs,
          statusCode: pingResult.statusCode,
          isUp: pingResult.isUp,
          bodySnippet: pingResult.bodySnippet,
          error: pingResult.error,
        }),
      },
    );

    if (!logResponse.ok) {
      const errorText = await logResponse.text();
      throw new Error(
        `Log storage failed: ${logResponse.statusText} - ${errorText}`,
      );
    }

    const _logData = await logResponse.json();
    console.log(
      `Ping completed for monitor ${monitorId}: ${pingResult.isUp ? "UP" : "DOWN"} ` +
        `(${pingResult.pingMs}ms, status: ${pingResult.statusCode || "N/A"})`,
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `Error executing ping job for monitor ${monitorId}:`,
      errorMessage,
    );
    // Log error to database if possible (optional - don't fail if this fails)
    try {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      await prisma.historyLog.create({
        data: {
          monitorId,
          pingMs: null,
          statusCode: null,
          isUp: false,
          bodySnippet: `Error: ${errorMessage}`,
        },
      });
    } catch (logError) {
      // Silently fail - we don't want to crash if logging fails
      console.error("Failed to log error to database:", logError);
    }
  }
}
