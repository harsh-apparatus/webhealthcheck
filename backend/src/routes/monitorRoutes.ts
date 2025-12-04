import { getAuth, requireAuth } from "@clerk/express";
import { type Request, type Response, Router } from "express";
import {
  createMonitor,
  deleteMonitor,
  getMonitor,
  getMonitors,
  updateMonitor,
} from "../controllers/monitorController";
import { getMonitorDetails } from "../controllers/monitorDetailsController";
import { getMonitorLogs } from "../controllers/monitorLogsController";
import { executePingJob } from "../cron/pingJob";
import { checkPlanLimits } from "../middleware/planLimitMiddleware";

const router = Router();

// Test route to verify routing works
router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Monitor routes are working", path: req.path });
});

// requireAuth() will return 401 for unauthenticated API requests
router.get("/", requireAuth(), getMonitors);
router.post(
  "/",
  requireAuth(),
  checkPlanLimits({ checkWebsiteLimit: true }),
  createMonitor,
);
// Specific routes must come before /:id route
router.get("/:id/details", requireAuth(), getMonitorDetails);
router.get("/:id/logs", requireAuth(), getMonitorLogs);
// Manual ping trigger for testing (requires auth)
router.post(
  "/:id/ping-now",
  requireAuth(),
  async (req: Request, res: Response) => {
    try {
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const monitorId = parseInt(req.params.id, 10);
      if (Number.isNaN(monitorId)) {
        return res.status(400).json({ error: "Invalid monitor ID" });
      }

      // Trigger ping job manually (runs in background)
      executePingJob(monitorId).catch((err) => {
        console.error(
          `Background ping job error for monitor ${monitorId}:`,
          err,
        );
      });

      return res.status(200).json({
        message: "Ping job triggered successfully",
        monitorId,
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Manual ping trigger error:", err);
      return res.status(500).json({
        error: "Failed to trigger ping",
        detail: errorMessage,
      });
    }
  },
);
router.get("/:id", requireAuth(), getMonitor);
router.put("/:id", requireAuth(), updateMonitor);
router.delete("/:id", requireAuth(), deleteMonitor);

export default router;
