import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const businessesTable = pgTable("businesses", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),
  ownerClerkUserId: text("owner_clerk_user_id").notNull().unique(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  currency: text("currency").notNull().default("USD"),
  cashBalanceCents: integer("cash_balance_cents").notNull().default(0),
  monthlyRevenueCents: integer("monthly_revenue_cents").notNull().default(0),
  monthlyExpensesCents: integer("monthly_expenses_cents").notNull().default(0),
  netProfitCents: integer("net_profit_cents").notNull().default(0),
  assetsCents: integer("assets_cents").notNull().default(0),
  liabilitiesCents: integer("liabilities_cents").notNull().default(0),
  monthlyGrowthRateBps: integer("monthly_growth_rate_bps").notNull().default(0),
  activeCustomers: integer("active_customers").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBusinessSchema = createInsertSchema(businessesTable).omit({
  ownerClerkUserId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businessesTable.$inferSelect;