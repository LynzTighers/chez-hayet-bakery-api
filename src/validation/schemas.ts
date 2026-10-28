// What the public forms are allowed to send. These run before anything touches the database.
import { z } from "zod";

// Must match the <option value="..."> list in the site's order form.
export const ORDER_CATEGORIES = ["cakes", "algerian-sweets", "custom"] as const;

// "Today" for the bakery, not for the server (Vercel servers run on UTC).
const BAKERY_TIMEZONE = process.env.BAKERY_TIMEZONE ?? "America/New_York";
function todayAtBakery(): string {
  // en-CA formats dates as YYYY-MM-DD, the same shape as the form's date input.
  return new Intl.DateTimeFormat("en-CA", { timeZone: BAKERY_TIMEZONE }).format(new Date());
}

// z.string("Required") gives a friendly message when a field is missing entirely.
const text = () => z.string("Required").trim();

const name = (max: number) => text().min(1, "Required").max(max);

// Digits plus common separators, with at least 7 actual digits.
const phone = text().refine(
  (value) => /^[0-9+()\-.\s]{7,30}$/.test(value) && value.replace(/\D/g, "").length >= 7,
  "Enter a valid phone number",
);

const email = text().toLowerCase().pipe(z.email("Enter a valid email address")).pipe(z.string().max(254));

export const createOrderSchema = z.object({
  firstName: name(100),
  lastName: name(100),
  phone,
  email,
  category: z.enum(ORDER_CATEGORIES, "Choose a category"),
  product: z.string().trim().max(100).optional(),
  details: text().min(5, "Tell us a bit more about your order").max(2000),
  pickupDate: z.iso
    .date("Choose a pickup date")
    .refine((value) => value >= todayAtBakery(), "Pickup date can't be in the past"),
});

export const createContactSchema = z.object({
  name: name(200),
  phone: phone.optional(),
  email,
  message: text().min(5, "Message is too short").max(2000),
});

export const loginSchema = z.object({
  username: text().toLowerCase().min(1, "Required").max(50),
  // Not trimmed: spaces can be part of a password.
  password: z.string("Required").min(1, "Required").max(200),
});

// Must match the order_status enum in db/schema.ts.
export const ORDER_STATUSES = ["new", "confirmed", "completed", "cancelled"] as const;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, "Choose a valid status"),
});

export const contactReplySchema = z.object({
  message: text().min(2, "Write a reply first").max(5000),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ContactReplyInput = z.infer<typeof contactReplySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
