import { getAuth } from "@clerk/express";
import type { Request, Response } from "express";

const WEBWORKER_URL = process.env.WEBWORKER_URL || "http://localhost:4001";

/**
 * Check webworker service status
 * GET /api/webworker/status
 */
export const getWebworkerStatus = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      // Create timeout controller for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const healthResponse = await fetch(`${WEBWORKER_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        return res.status(200).json({
          status: "online",
          service: healthData.service || "webworker",
          url: WEBWORKER_URL,
          lastChecked: new Date().toISOString(),
          response: healthData,
        });
      } else {
        return res.status(200).json({
          status: "offline",
          url: WEBWORKER_URL,
          lastChecked: new Date().toISOString(),
          error: `Health check returned ${healthResponse.status}`,
        });
      }
    } catch (error: unknown) {
      // Webworker is not accessible
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Webworker service is not accessible";
      return res.status(200).json({
        status: "offline",
        url: WEBWORKER_URL,
        lastChecked: new Date().toISOString(),
        error: errorMessage,
      });
    }
  } catch (err) {
    console.error("getWebworkerStatus error:", err);
    return res.status(500).json({
      error: "Failed to check webworker status",
      detail: String(err),
    });
  }
};

/**
 * Test webworker ping functionality
 * POST /api/webworker/test
 */
export const testWebworker = async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { url, isHttps } = req.body;
    const testUrl = url || "https://www.google.com";
    const testIsHttps = isHttps !== undefined ? isHttps : true;

    try {
      // Create timeout controller for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const pingResponse = await fetch(`${WEBWORKER_URL}/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: 0, // Test ID
          url: testUrl,
          isHttps: testIsHttps,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (pingResponse.ok) {
        const pingData = await pingResponse.json();
        return res.status(200).json({
          success: true,
          message: "Webworker test successful",
          result: pingData,
        });
      } else {
        const errorText = await pingResponse.text();
        return res.status(500).json({
          success: false,
          error: "Webworker test failed",
          detail: errorText,
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to connect to webworker service";
      return res.status(500).json({
        success: false,
        error: "Webworker is not accessible",
        detail: errorMessage,
      });
    }
  } catch (err) {
    console.error("testWebworker error:", err);
    return res.status(500).json({
      error: "Failed to test webworker",
      detail: String(err),
    });
  }
};
