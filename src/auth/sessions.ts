// Login sessions: a random token lives in an httpOnly cookie, and its hash lives in the
// sessions table. Logging out (or the session expiring) makes the cookie worthless.
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client.js";
import { admins, sessions } from "../db/schema.js";

export const SESSION_COOKIE = "chb_session";
const SESSION_DAYS = 7;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(sessions).values({ tokenHash: hashToken(token), adminId, expiresAt });
  // Tidy up: drop sessions that have already expired.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));

  return { token, expiresAt };
}

// Returns the logged-in admin for this token, or undefined if it's unknown or expired.
export async function findSessionAdmin(token: string) {
  const [row] = await db
    .select({ id: admins.id, username: admins.username })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())));
  return row;
}

export async function deleteSession(token: string) {
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

// --- Cookie helpers ---

const cookieOptions = {
  httpOnly: true, // page JavaScript can't read it, so an XSS bug can't steal it
  secure: process.env.NODE_ENV === "production", // HTTPS only on the live site
  sameSite: "lax" as const, // not sent on POSTs from other websites (CSRF protection)
  path: "/",
};

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}

// Express doesn't parse cookies by default; this reads one from the Cookie header.
export function readSessionCookie(req: Request): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join("="));
  }
  return undefined;
}
