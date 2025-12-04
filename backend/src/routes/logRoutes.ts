import { Router } from "express";
import { logPingResult } from "../controllers/logController";

const router = Router();

// This endpoint is called by the webworker/cron jobs
// No authentication required as it's internal service-to-service
router.post("/monitors/:id/ping", logPingResult);

export default router;
