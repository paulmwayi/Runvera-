import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/auth/me", (req: Request, res: Response): void => {
  try {
    const auth = getAuth(req);
    const userId = auth?.userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.status(200).json({ userId });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
