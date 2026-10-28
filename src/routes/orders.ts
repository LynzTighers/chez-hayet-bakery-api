import { Router } from "express";
import { db } from "../db/client.js";
import { orders } from "../db/schema.js";
import { validateBody } from "../middleware/validate.js";
import { createOrderSchema, type CreateOrderInput } from "../validation/schemas.js";

export const ordersRouter = Router();

// Public: the order form posts here. No login needed.
ordersRouter.post("/", validateBody(createOrderSchema), async (req, res) => {
  const input = req.body as CreateOrderInput;

  const [order] = await db
    .insert(orders)
    .values(input)
    .returning({ id: orders.id, createdAt: orders.createdAt });

  // Only send back the id; the customer's details stay on the server.
  res.status(201).json({ id: order.id, createdAt: order.createdAt });
});
