import bcrypt from "bcryptjs";
import crypto from "crypto";

// bcrypt only uses the first 72 bytes of what it hashes, so passwords are
// first reduced to a fixed-length SHA-256 digest (base64, so no zero bytes),
// letting every character of a long password count. Hashes made this way
// are marked with this prefix; unmarked ones are from before and hash the
// password directly.
const PREHASHED = "v2$";
const COST = 12;

const prehash = (password: string) =>
  crypto.createHash("sha256").update(password, "utf8").digest("base64");

export const hashPassword = async (password: string) =>
  PREHASHED + (await bcrypt.hash(prehash(password), COST));

// needsRehash: the password was right but its hash is the old kind
export const verifyPassword = async (
  password: string,
  storedHash: string,
): Promise<{ ok: boolean; needsRehash: boolean }> => {
  if (storedHash.startsWith(PREHASHED)) {
    const ok = await bcrypt.compare(
      prehash(password),
      storedHash.slice(PREHASHED.length),
    );
    return { ok, needsRehash: false };
  }
  const ok = await bcrypt.compare(password, storedHash);
  return { ok, needsRehash: ok };
};
