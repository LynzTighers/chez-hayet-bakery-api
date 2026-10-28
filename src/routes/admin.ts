import { desc } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { contacts, orders } from "../db/schema.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

// Everything in here is for the baker only.
export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/orders", async (_req, res) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(rows);
});

adminRouter.get("/contacts", async (_req, res) => {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  res.json(rows);
});
