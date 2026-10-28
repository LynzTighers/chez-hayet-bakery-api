// The Express app itself, with no app.listen().
// Vercel picks this file up automatically (src/app.ts + default export) and runs it
// as a serverless function. For Docker and local dev, src/server.ts imports it and listens.
import express from "express";
import helmet from "helmet";
import { ordersRouter } from "./routes/orders.js";
import { contactsRouter } from "./routes/contacts.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const app = express();

app.use(helmet());
// Forms are small; a low limit stops anyone posting huge bodies.
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/orders", ordersRouter);
app.use("/api/contacts", contactsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
