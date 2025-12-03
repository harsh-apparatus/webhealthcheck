import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getWebworkerStatus, testWebworker } from "../controllers/webworkerController";

const router = Router();

// All routes require authentication
router.get("/status", requireAuth(), getWebworkerStatus);
router.post("/test", requireAuth(), testWebworker);

export default router;

