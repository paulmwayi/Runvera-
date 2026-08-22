import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

router.get("/me", (req, res) => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.json({ userId });
});

export default router;