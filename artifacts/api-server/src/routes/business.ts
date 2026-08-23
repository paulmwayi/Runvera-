import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, businessesTable } from "@workspace/db";

const router: IRouter = Router();

function userId(req: Request): string | null {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

function isValidBusinessInput(body: any): boolean {
  return (
    body &&
    typeof body.name === "string" &&
    body.name.trim().length >= 1 &&
    typeof body.currency === "string" &&
    body.currency.length === 3 &&
    typeof body.cashBalanceCents === "number" &&
    body.cashBalanceCents >= 0 &&
    typeof body.monthlyRevenueCents === "number" &&
    body.monthlyRevenueCents >= 0 &&
    typeof body.monthlyExpensesCents === "number" &&
    body.monthlyExpensesCents >= 0 &&
    typeof body.netProfitCents === "number" &&
    typeof body.assetsCents === "number" &&
    body.assetsCents >= 0 &&
    typeof body.liabilitiesCents === "number" &&
    body.liabilitiesCents >= 0 &&
    typeof body.monthlyGrowthRateBps === "number" &&
    body.monthlyGrowthRateBps >= -10000 &&
    body.monthlyGrowthRateBps <= 100000 &&
    typeof body.activeCustomers === "number" &&
    body.activeCustomers >= 0
  );
}

function isValidBusinessUpdate(body: any): boolean {
  if (!body || typeof body !== "object") return false;

  if ("name" in body && (typeof body.name !== "string" || body.name.trim().length < 1))
    return false;

  if ("currency" in body && (typeof body.currency !== "string" || body.currency.length !== 3))
    return false;

  const nonNegativeFields = [
    "cashBalanceCents",
    "monthlyRevenueCents",
    "monthlyExpensesCents",
    "assetsCents",
    "liabilitiesCents",
    "activeCustomers",
  ];

  for (const field of nonNegativeFields) {
    if (field in body && (typeof body[field] !== "number" || body[field] < 0))
      return false;
  }

  if ("netProfitCents" in body && typeof body.netProfitCents !== "number")
    return false;

  if (
    "monthlyGrowthRateBps" in body &&
    (typeof body.monthlyGrowthRateBps !== "number" ||
      body.monthlyGrowthRateBps < -10000 ||
      body.monthlyGrowthRateBps > 100000)
  )
    return false;

  if ("industry" in body && typeof body.industry !== "string")
    return false;

  return true;
}

router.get("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);

  if (!ownerId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerClerkUserId, ownerId))
    .limit(1);

  res.json(business ?? null);
});

router.post("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);

  if (!ownerId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isValidBusinessInput(req.body)) {
    res.status(400).json({ error: "Invalid business data" });
    return;
  }

  const [business] = await db
    .insert(businessesTable)
    .values({
      ...req.body,
      ownerClerkUserId: ownerId,
    })
    .onConflictDoUpdate({
      target: businessesTable.ownerClerkUserId,
      set: {
        ...req.body,
        updatedAt: new Date(),
      },
    })
    .returning();

  res.status(201).json(business);
});

router.patch("/business", async (req, res): Promise<void> => {
  const ownerId = userId(req);

  if (!ownerId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!isValidBusinessUpdate(req.body)) {
    res.status(400).json({ error: "Invalid business update data" });
    return;
  }

  const [business] = await db
    .update(businessesTable)
    .set({
      ...req.body,
      updatedAt: new Date(),
    })
    .where(eq(businessesTable.ownerClerkUserId, ownerId))
    .returning();

  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }

  res.json(business);
});

export default router;
