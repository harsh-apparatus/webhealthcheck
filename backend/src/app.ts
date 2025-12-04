import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import logRoutes from "./routes/logRoutes";
import monitorRoutes from "./routes/monitorRoutes";
import statusPagePublicRoutes from "./routes/statusPagePublicRoutes";
import statusPageRoutes from "./routes/statusPageRoutes";
import userRoutes from "./routes/userRoutes";
import webhookRoutes from "./routes/webhookRoutes";
import webworkerRoutes from "./routes/webworkerRoutes";

const app = express();

app.use("/webhook", express.raw({ type: () => true }));

app.use(
  cors({
    origin: [
      "https://console.latenzo.aspltools.in",
      "http://localhost:3000", // Allow localhost for development
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);
app.use(express.json());

// Root route to check if backend is working
app.get("/", (_req, res) => {
  res.send("latenzo backend is working");
});

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

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

export default app;
