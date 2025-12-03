import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import logRoutes from "./routes/logRoutes";
import statusPageRoutes from "./routes/statusPageRoutes";
import statusPagePublicRoutes from "./routes/statusPagePublicRoutes";
import webworkerRoutes from "./routes/webworkerRoutes";


import { clerkMiddleware } from "@clerk/express";
import monitorRoutes from "./routes/monitorRoutes";

const app = express();


app.use("/webhook", express.raw({ type: () => true }));


app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

// Log routes (no auth required - called by webworker/cron jobs)
app.use("/api", logRoutes);

// Public status page routes (no auth required)
app.use("/api/status-pages", statusPagePublicRoutes);

app.use(clerkMiddleware());


app.use("/api/users", userRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/status-pages", statusPageRoutes);
app.use("/api/webworker", webworkerRoutes);

app.use("/webhook", webhookRoutes);


app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

export default app;
