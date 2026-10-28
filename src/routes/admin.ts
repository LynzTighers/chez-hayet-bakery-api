import { asc, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/client.js";
import { contactReplies, contacts, orders } from "../db/schema.js";
import { EmailNotConfiguredError, sendEmail } from "../email/mailer.js";
import { contactReplyEmail } from "../email/templates.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import {
  contactReplySchema,
  updateOrderStatusSchema,
  type ContactReplyInput,
  type UpdateOrderStatusInput,
} from "../validation/schemas.js";

// Everything in here is for the baker only.
export const adminRouter = Router();
adminRouter.use(requireAdmin);

// Reads :id from the URL; answers 400 and returns undefined when it isn't a valid id.
function parseId(raw: string | string[] | undefined, res: import("express").Response) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: "Invalid id" });
    return undefined;
  }
  return id;
}

adminRouter.get("/orders", async (_req, res) => {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  res.json(rows);
});

// Move an order through new → confirmed → completed (or cancelled).
adminRouter.patch("/orders/:id", validateBody(updateOrderStatusSchema), async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === undefined) return;

  const { status } = req.body as UpdateOrderStatusInput;
  const [order] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(order);
});

// Contact messages, newest first, each with the replies already sent.
adminRouter.get("/contacts", async (_req, res) => {
  const [rows, replies] = await Promise.all([
    db.select().from(contacts).orderBy(desc(contacts.createdAt)),
    db.select().from(contactReplies).orderBy(asc(contactReplies.sentAt)),
  ]);
  res.json(
    rows.map((contact) => ({
      ...contact,
      replies: replies.filter((reply) => reply.contactId === contact.id),
    })),
  );
});

// Email a reply to the customer, then remember it and mark the message as replied.
adminRouter.post("/contacts/:id/reply", validateBody(contactReplySchema), async (req, res) => {
  const id = parseId(req.params.id, res);
  if (id === undefined) return;

  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
  if (!contact) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  const { message } = req.body as ContactReplyInput;
  try {
    await sendEmail({
      to: contact.email,
      ...contactReplyEmail({ reply: message, originalMessage: contact.message }),
    });
  } catch (err) {
    if (err instanceof EmailNotConfiguredError) {
      res.status(503).json({ error: "Email sending isn't set up yet." });
      return;
    }
    console.error("Sending reply email failed:", err);
    res.status(502).json({ error: "The email couldn't be sent. Please try again." });
    return;
  }

  // Only recorded after the email really went out.
  const repliedAt = new Date();
  const [reply] = await db.insert(contactReplies).values({ contactId: id, message, sentAt: repliedAt }).returning();
  await db.update(contacts).set({ status: "replied", repliedAt }).where(eq(contacts.id, id));

  res.status(201).json(reply);
});
