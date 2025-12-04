"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const pingRoutes_1 = __importDefault(require("./routes/pingRoutes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4001;
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express_1.default.json());
app.use("/", pingRoutes_1.default);
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
const shutdown = async (signal) => {
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
