import "dotenv/config";
import cors from "cors";
import express from "express";
import pingRoutes from "./routes/pingRoutes";

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;

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

app.use("/", pingRoutes);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "webworker",
    time: new Date().toISOString(),
  });
});

const server = app.listen(PORT, () => {
  console.log(`Webworker server listening on http://localhost:${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close((err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    console.log("Server closed. Exiting.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown("unhandledRejection");
});
