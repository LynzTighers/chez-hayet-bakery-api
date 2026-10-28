import type { ErrorRequestHandler, RequestHandler } from "express";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

// Express 5 sends errors thrown in async handlers here automatically.
// Always answer with JSON and never leak internal details to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // express.json() throws these for malformed or oversized bodies.
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Request body must be valid JSON" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "Request body is too large" });
    return;
  }

  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
