// Database tables, matching bakery_website_architecture.png.
// Edit this file, then run `npm run db:generate` to create a new SQL migration.
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

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

// Every email reply the baker sends to a contact message, so the dashboard can show
// the conversation.
export const contactReplies = pgTable("contact_replies", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id")
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

// The baker's login. Only a bcrypt hash of the password is ever stored.
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// One row per logged-in browser. The cookie holds a random token; only its SHA-256
// hash is stored, so a leaked database can't be used to log in.
export const sessions = pgTable("sessions", {
  tokenHash: varchar("token_hash", { length: 64 }).primaryKey(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => admins.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Every login try, used to block password guessing (too many failures in a short time).
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 50 }).notNull(),
    succeeded: boolean("succeeded").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("login_attempts_username_created_at_idx").on(table.username, table.createdAt)],
);
