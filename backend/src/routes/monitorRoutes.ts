import { Router, Request, Response } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { createMonitor, getMonitors, getMonitor, updateMonitor, deleteMonitor } from "../controllers/monitorController";
import { getMonitorDetails } from "../controllers/monitorDetailsController";
import { getMonitorLogs } from "../controllers/monitorLogsController";
import { executePingJob } from "../cron/pingJob";

const router = Router();

// Test route to verify routing works
router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Monitor routes are working", path: req.path });
});

// requireAuth() will return 401 for unauthenticated API requests
router.get("/", requireAuth(), getMonitors);
router.post("/", requireAuth(), createMonitor);
// Specific routes must come before /:id route
router.get("/:id/details", requireAuth(), getMonitorDetails);
router.get("/:id/logs", requireAuth(), getMonitorLogs);
// Manual ping trigger for testing (requires auth)
router.post("/:id/ping-now", requireAuth(), async (req: Request, res: Response) => {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const monitorId = parseInt(req.params.id);
    if (isNaN(monitorId)) {
      return res.status(400).json({ error: "Invalid monitor ID" });
    }

    // Trigger ping job manually (runs in background)
    executePingJob(monitorId).catch((err) => {
      console.error(`Background ping job error for monitor ${monitorId}:`, err);
    });
    
    return res.status(200).json({ 
      message: "Ping job triggered successfully",
      monitorId 
    });
  } catch (err: any) {
    console.error("Manual ping trigger error:", err);
    return res.status(500).json({ 
      error: "Failed to trigger ping", 
      detail: err.message 
    });
  }
});
router.get("/:id", requireAuth(), getMonitor);
router.put("/:id", requireAuth(), updateMonitor);
router.delete("/:id", requireAuth(), deleteMonitor);

export default router;