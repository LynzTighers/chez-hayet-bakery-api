import { desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { contacts, orders } from "../db/schema.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { updateOrderStatusSchema, type UpdateOrderStatusInput } from "../validation/schemas.js";

// Everything in here is for the baker only.
export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/orders", async (_req, res) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(rows);
});

// Move an order through new → confirmed → completed (or cancelled).
adminRouter.patch("/orders/:id", validateBody(updateOrderStatusSchema), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }

  const { status } = req.body as UpdateOrderStatusInput;
  const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

adminRouter.get("/contacts", async (_req, res) => {
  const rows = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  res.json(rows);
});
