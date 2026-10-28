// Applies any SQL migrations in /drizzle that the database hasn't run yet.
// Safe to run repeatedly; Docker runs it every time the API container starts.
import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./client.js";

await migrate(db, { migrationsFolder: "drizzle" });
console.log("Database migrations are up to date");
await pool.end();
