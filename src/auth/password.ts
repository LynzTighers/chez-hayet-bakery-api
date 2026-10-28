import bcrypt from "bcryptjs";

// Cost 12 ≈ a quarter second per check: fine for one baker logging in, very slow for
// anyone trying millions of guesses against a stolen hash.
const COST = 12;

// A real bcrypt hash of a random throwaway password. When the username doesn't exist
// we still compare against this, so a wrong username takes as long as a wrong password
// and response times don't reveal which usernames are real.
const DUMMY_HASH = "$2b$12$ESG/vWhPIZfTaFauPOQCBOTIEVR0VFraq/HbCZM64eYH8vZnHEV6S";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return matches && hash !== undefined;
}
