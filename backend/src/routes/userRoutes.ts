import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getUsers, createUser } from "../controllers/userController";
import { getAccountInfo, getPlanDetails, syncSubscription } from "../controllers/accountController";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.get("/account", requireAuth(), getAccountInfo);
router.get("/plan", requireAuth(), getPlanDetails);
router.post("/sync-subscription", requireAuth(), syncSubscription);

export default router;
