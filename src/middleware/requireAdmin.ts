import type { RequestHandler } from "express";
import { clearSessionCookie, findSessionAdmin, readSessionCookie } from "../auth/sessions.js";

export type AdminUser = { id: number; username: string };

// Put this in front of any route only the baker may use. On success the admin is
// available as res.locals.admin; otherwise the request stops with 401.
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = readSessionCookie(req);
  const admin = token ? await findSessionAdmin(token) : undefined;

  if (!admin) {
    if (token) clearSessionCookie(res);
    res.status(401).json({ error: "Please log in" });
    return;
  }

  res.locals.admin = admin satisfies AdminUser;
  next();
};
