// Database tables, matching bakery_website_architecture.png.
// Edit this file, then run `npm run db:generate` to create a new SQL migration.
import { date, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const orderStatus = pgEnum("order_status", ["new", "confirmed", "completed", "cancelled"]);
export const contactStatus = pgEnum("contact_status", ["new", "replied"]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  product: varchar("product", { length: 100 }),
  details: text("details").notNull(),
  // The day the customer wants to pick up the order.
  pickupDate: date("pickup_date").notNull(),
  status: orderStatus("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 254 }).notNull(),
  message: text("message").notNull(),
  status: contactStatus("status").notNull().default("new"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The baker's login. Only a bcrypt hash of the password is ever stored.
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
