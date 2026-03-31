import { compareSync, hashSync } from "bcryptjs";

// Hash password
export function hashPassword(plain: string): string {
  return hashSync(plain, 10);
}

// Bandingkan password
export function comparePassword(plain: string, hash: string): boolean {
  return compareSync(plain, hash);
}
