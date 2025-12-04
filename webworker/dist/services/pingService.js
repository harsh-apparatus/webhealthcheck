"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pingUrl = pingUrl;
const TIMEOUT_MS = 10000; // 10 seconds timeout
const MAX_BODY_SNIPPET_LENGTH = 500;
async function pingUrl(request) {
    const startTime = Date.now();
    let pingMs = null;
    let statusCode = null;
    let isUp = false;
    let bodySnippet = null;
    let error = null;
    try {
        // Ensure URL has protocol
        let urlToPing = request.url;
        if (!urlToPing.startsWith("http://") && !urlToPing.startsWith("https://")) {
            urlToPing = request.isHttps
                ? `https://${urlToPing}`
                : `http://${urlToPing}`;
        }
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const response = await fetch(urlToPing, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "User-Agent": "WebHealthCheck/1.0",
                },
                redirect: "follow",
            });
            clearTimeout(timeoutId);
            pingMs = Date.now() - startTime;
            statusCode = response.status;
            isUp = response.ok; // 200-299 status codes
            // Only capture body snippet when there's an error (response is not OK)
            // This reduces storage overhead while still providing debugging info for failures
            if (!isUp) {
                try {
                    const contentType = response.headers.get("content-type") || "";
                    if (contentType.includes("text/") ||
                        contentType.includes("application/json")) {
                        const text = await response.text();
                        bodySnippet = text.substring(0, MAX_BODY_SNIPPET_LENGTH);
                    }
                }
                catch (_bodyError) {
                    // Ignore body reading errors
                }
            }
        }
        catch (fetchError) {
            clearTimeout(timeoutId);
            pingMs = Date.now() - startTime;
            if (fetchError instanceof Error && fetchError.name === "AbortError") {
                error = "Request timeout";
                isUp = false;
            }
            else {
                error =
                    fetchError instanceof Error ? fetchError.message : "Unknown error";
                isUp = false;
            }
        }
    }
    catch (err) {
        pingMs = Date.now() - startTime;
        error = err instanceof Error ? err.message : "Failed to ping URL";
        isUp = false;
    }
    return {
        monitorId: request.id,
        pingMs,
        statusCode,
        isUp,
        bodySnippet,
        error,
    };
}
