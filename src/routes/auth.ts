import { and, count, eq, gt } from "drizzle-orm";
import { Router } from "express";
import { verifyPassword } from "../auth/password.js";
import {
  clearSessionCookie,
  createSession,
  deleteSession,
  readSessionCookie,
  setSessionCookie,
} from "../auth/sessions.js";
import { db } from "../db/client.js";
import { admins, loginAttempts } from "../db/schema.js";
import { requireAdmin, type AdminUser } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, type LoginInput } from "../validation/schemas.js";

export const authRouter = Router();

// After this many wrong passwords for one username, wait LOCKOUT_MINUTES.
const MAX_FAILURES = 5;
const LOCKOUT_MINUTES = 15;

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { username, password } = req.body as LoginInput;

  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000);
  const [{ failures }] = await db
    .select({ failures: count() })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.username, username),
        eq(loginAttempts.succeeded, false),
        gt(loginAttempts.createdAt, since),
      ),
    );
  if (failures >= MAX_FAILURES) {
    res.status(429).json({ error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.` });
    return;
  }

  const [admin] = await db.select().from(admins).where(eq(admins.username, username));
  const ok = await verifyPassword(password, admin?.passwordHash);
  await db.insert(loginAttempts).values({ username, succeeded: ok });

  if (!ok || !admin) {
    // Same message either way, so it doesn't reveal whether the username exists.
    res.status(401).json({ error: "Wrong username or password" });
    return;
  }

  const { token, expiresAt } = await createSession(admin.id);
  setSessionCookie(res, token, expiresAt);
  res.json({ username: admin.username });
});

authRouter.post("/logout", async (req, res) => {
  const token = readSessionCookie(req);
  if (token) await deleteSession(token);
  clearSessionCookie(res);
  res.status(204).end();
});

// Lets the site ask "who is logged in?" when the admin page loads.
authRouter.get("/me", requireAdmin, (_req, res) => {
  const admin = res.locals.admin as AdminUser;
  res.json({ username: admin.username });
});
