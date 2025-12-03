import "dotenv/config";
import app from "./app";
import prisma from "./prismaClient";
import { initializeAllMonitors } from "./cron/monitorScheduler";

const PORT = process.env.PORT ? Number(process.env.PORT) : 5001;

const server = app.listen(PORT, async () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  // Initialize all monitor cron jobs on startup
  await initializeAllMonitors();
});

const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async (err) => {
    if (err) {
      console.error("Error closing server:", err);
      process.exit(1);
    }
    try {
      await prisma.$disconnect();
      console.log("Prisma disconnected. Exiting.");
      process.exit(0);
    } catch (e) {
      console.error("Error disconnecting Prisma:", e);
      process.exit(1);
    }
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
