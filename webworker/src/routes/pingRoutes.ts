import { Router, Request, Response } from "express";
import { pingUrl } from "../services/pingService";

const router = Router();

interface PingRequestBody {
  id: number;
  url: string;
  isHttps: boolean;
}

router.post("/ping", async (req: Request, res: Response) => {
  try {
    const { id, url, isHttps } = req.body as PingRequestBody;

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
    const result = await pingUrl({
      id,
      url,
      isHttps: isHttps ?? url.startsWith("https://"),
    });

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Ping route error:", error);
    return res.status(500).json({
      error: "Internal server error",
      detail: error.message,
    });
  }
});

export default router;

