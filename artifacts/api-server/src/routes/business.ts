import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";
import { BusinessInput, BusinessUpdate, Business } from "@workspace/api-zod";

const router: IRouter = Router();

function userId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

router.get("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);
  if (!ownerId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const [business] = await db.select().from(businessesTable).where(eq(businessesTable.ownerClerkUserId, ownerId)).limit(1);
  res.json(business ? Business.parse(business) : null);
});

router.post("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);
  if (!ownerId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = BusinessInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [business] = await db.insert(businessesTable).values({ ...parsed.data, ownerClerkUserId: ownerId }).onConflictDoUpdate({
    target: businessesTable.ownerClerkUserId,
    set: { ...parsed.data, updatedAt: new Date() },
  }).returning();
  res.status(201).json(Business.parse(business));
});

router.patch("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);
  if (!ownerId) { res.status(401).json({ error: "Unauthorized" }); return; }
  const parsed = BusinessUpdate.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [business] = await db.update(businessesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(businessesTable.ownerClerkUserId, ownerId)).returning();
  if (!business) { res.status(404).json({ error: "Business not found" }); return; }
  res.json(Business.parse(business));
});

export default router;