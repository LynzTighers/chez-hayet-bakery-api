import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// On Vercel each function instance should hold very few connections, so use Neon's
// *pooled* connection string there. A normal server can keep a bigger pool.
export const pool = new pg.Pool({
  connectionString,
  max: process.env.VERCEL ? 1 : 10,
});

export const db = drizzle(pool, { schema });
