import { Router } from "express";
import { requireAuth } from "@clerk/express";
import {
  getStatusPages,
  getStatusPage,
  createStatusPage,
  updateStatusPage,
  deleteStatusPage,
} from "../controllers/statusPageController";

const router = Router();

// Protected routes (auth required)
router.get("/", requireAuth(), getStatusPages);
router.get("/:id", requireAuth(), getStatusPage);
router.post("/", requireAuth(), createStatusPage);
router.put("/:id", requireAuth(), updateStatusPage);
router.delete("/:id", requireAuth(), deleteStatusPage);

export default router;
