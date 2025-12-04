import type { Request, Response } from "express";
import prisma from "../prismaClient";

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    return res.json({ users });
  } catch (err) {
    console.error("getUsers error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name, clerkId } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await prisma.user.create({
      data: { email, name: name ?? null, clerkId: clerkId ?? null },
    });

    return res.status(201).json({ user });
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({ error: "db error", detail: String(err) });
  }
};
