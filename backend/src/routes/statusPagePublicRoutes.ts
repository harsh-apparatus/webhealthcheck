import { Router } from "express";
import { getPublicStatusPage } from "../controllers/statusPageController";

const router = Router();

// Public route (no auth required)
router.get("/public/:slug", getPublicStatusPage);

export default router;

