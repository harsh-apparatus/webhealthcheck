import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { getUsers, createUser } from "../controllers/userController";
import { getAccountInfo } from "../controllers/accountController";

const router = Router();

router.get("/", getUsers);
router.post("/", createUser);
router.get("/account", requireAuth(), getAccountInfo);

export default router;
