import { Router } from "express";
import { db } from "../db/client.js";
import { contacts } from "../db/schema.js";
import { validateBody } from "../middleware/validate.js";
import { createContactSchema, type CreateContactInput } from "../validation/schemas.js";

export const contactsRouter = Router();

// Public: the contact form posts here. No login needed.
contactsRouter.post("/", validateBody(createContactSchema), async (req, res) => {
  const input = req.body as CreateContactInput;

  const [contact] = await db
    .insert(contacts)
    .values(input)
    .returning({ id: contacts.id, createdAt: contacts.createdAt });

  res.status(201).json({ id: contact.id, createdAt: contact.createdAt });
});
