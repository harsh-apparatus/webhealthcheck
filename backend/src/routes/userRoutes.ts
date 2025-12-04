import { requireAuth } from "@clerk/express";
import { Router } from "express";
import {
  getAccountInfo,
  getPlanDetails,
  syncSubscription,
} from "../controllers/accountController";
import { createUser, getUsers } from "../controllers/userController";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.get("/account", requireAuth(), getAccountInfo);
router.get("/plan", requireAuth(), getPlanDetails);
router.post("/sync-subscription", requireAuth(), syncSubscription);

export default router;
