"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pingService_1 = require("../services/pingService");
const router = (0, express_1.Router)();
router.post("/ping", async (req, res) => {
    try {
        const { id, url, isHttps } = req.body;
        // Validate required fields
        if (!id || !url) {
            return res.status(400).json({
                error: "Missing required fields: id and url are required",
            });
        }
        if (typeof id !== "number" || typeof url !== "string") {
            return res.status(400).json({
                error: "Invalid field types: id must be number, url must be string",
            });
        }
        // Ping the URL
        const result = await (0, pingService_1.pingUrl)({
            id,
            url,
            isHttps: isHttps ?? url.startsWith("https://"),
        });
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Ping route error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return res.status(500).json({
            error: "Internal server error",
            detail: errorMessage,
        });
    }
});
exports.default = router;
