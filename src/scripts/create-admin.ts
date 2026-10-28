// Creates the baker's login, or resets the password if the username already exists.
//
//   npm run admin:create -- hayet          (local Docker database, uses .env)
//   npm run admin:create:neon -- hayet     (live Neon database, uses .env.neon)
//
// The password is typed in hidden (or read from ADMIN_PASSWORD for automated setups)
// and only its bcrypt hash is stored.
import "dotenv/config";
import { createInterface } from "node:readline";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password.js";
import { db, pool } from "../db/client.js";
import { admins, sessions } from "../db/schema.js";

const MIN_LENGTH = 12;

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Print the question, then stop echoing what the user types.
    process.stdout.write(question);
    (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};
    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const username = process.argv[2]?.trim().toLowerCase();
if (!username) {
  console.error("Usage: npm run admin:create -- <username>");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password) {
  password = await askHidden(`Password for "${username}" (min ${MIN_LENGTH} characters): `);
  const again = await askHidden("Type it again: ");
  if (password !== again) {
    console.error("The passwords don't match. Nothing was changed.");
    process.exit(1);
  }
}
if (password.length < MIN_LENGTH) {
  console.error(`Password must be at least ${MIN_LENGTH} characters. Nothing was changed.`);
  process.exit(1);
}

const passwordHash = await hashPassword(password);
const [existing] = await db.select().from(admins).where(eq(admins.username, username));

if (existing) {
  await db.update(admins).set({ passwordHash }).where(eq(admins.id, existing.id));
  // A password reset logs out every browser that was logged in.
  await db.delete(sessions).where(eq(sessions.adminId, existing.id));
  console.log(`Password updated for "${username}" (all their sessions were logged out).`);
} else {
  await db.insert(admins).values({ username, passwordHash });
  console.log(`Admin "${username}" created.`);
}

await pool.end();
