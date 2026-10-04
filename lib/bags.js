import { randomInt } from "node:crypto";
import { headers } from "next/headers";
import { sql } from "./db";

export const MAX_BATCH = 2000;
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // no 0/o/1/l/i: easy to read if typed
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

// Base URL printed into QR codes. Set SITE_URL in production so codes never point at a preview URL.
export async function siteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

export async function createBags(n) {
  const rows = Array.from({ length: n }, () => ({ code: newCode() }));
  const made = await sql`insert into bags ${sql(rows, "code")} returning bag_no`;
  const nos = made.map((r) => r.bag_no);
  return { from: Math.min(...nos), to: Math.max(...nos) };
}

export async function listBags(from, to) {
  return sql`select b.bag_no, b.code, m.id is not null as used
             from bags b left join messages m on m.code = b.code
             where b.bag_no between ${from} and ${to} order by b.bag_no`;
}

export async function bagCounts() {
  const [c] = await sql`select count(*)::int as total, coalesce(max(bag_no), 0)::int as last,
                          (select count(*)::int from messages where code is not null) as used
                        from bags`;
  return c;
}
