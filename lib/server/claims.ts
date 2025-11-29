import { promises as fs } from "node:fs";
import path from "node:path";

export const CLAIMS_PATH = path.join(process.cwd(), "data", "listing-claims.json");

export interface ListingClaim {
  name?: string;
  primaryCategory?: string;
  location?: string;
  address?: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  instagramPosts?: string[];
}

export async function readClaims(): Promise<Record<string, ListingClaim>> {
  try {
    const raw = await fs.readFile(CLAIMS_PATH, "utf8");
    return JSON.parse(raw) as Record<string, ListingClaim>;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function writeClaims(claims: Record<string, ListingClaim>): Promise<void> {
  await fs.mkdir(path.dirname(CLAIMS_PATH), { recursive: true });
  await fs.writeFile(CLAIMS_PATH, JSON.stringify(claims, null, 2), "utf8");
}
