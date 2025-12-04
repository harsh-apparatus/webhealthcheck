import { requireAuth } from "@clerk/express";
import { Router } from "express";
import {
  createStatusPage,
  deleteStatusPage,
  getStatusPage,
  getStatusPages,
  updateStatusPage,
} from "../controllers/statusPageController";
import { checkPlanLimits } from "../middleware/planLimitMiddleware";

const router = Router();

// Protected routes (auth required)
router.get("/", requireAuth(), getStatusPages);
router.get("/:id", requireAuth(), getStatusPage);
router.post(
  "/",
  requireAuth(),
  checkPlanLimits({ checkStatusPageAccess: true }),
  createStatusPage,
);
router.put("/:id", requireAuth(), updateStatusPage);
router.delete("/:id", requireAuth(), deleteStatusPage);

export default router;
