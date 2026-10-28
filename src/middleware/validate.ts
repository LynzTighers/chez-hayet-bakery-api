import type { RequestHandler } from "express";
import { z } from "zod";

// Checks req.body against a zod schema. On success, req.body is replaced with the
// parsed (trimmed, typed) data; on failure the client gets a 400 with per-field messages.
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: "Invalid input",
        fields: z.flattenError(result.error).fieldErrors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
