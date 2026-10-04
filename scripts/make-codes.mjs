// Usage: npm run codes -- <count>
// Creates <count> new bag codes and writes print-ready QR SVGs + codes.csv to ./qr
import { mkdirSync, writeFileSync, appendFileSync, existsSync } from "node:fs";
import { randomInt } from "node:crypto";
import postgres from "postgres";
import QRCode from "qrcode";

const count = Number(process.argv[2]);
const site = (process.env.SITE_URL || "").replace(/\/$/, "");
if (!count || !site) {
  console.error("Usage: npm run codes -- <count>   (needs SITE_URL and DATABASE_URL)");
  process.exit(1);
}

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz"; // no 0/o/1/l/i
const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const sql = postgres(process.env.DATABASE_URL);
mkdirSync("qr", { recursive: true });
if (!existsSync("qr/codes.csv")) writeFileSync("qr/codes.csv", "bag_no,code,url\n");

for (let i = 0; i < count; i++) {
  const [bag] = await sql`insert into bags (code) values (${newCode()}) returning code, bag_no`;
  const url = `${site}/t/${bag.code}`;
  const no = String(bag.bag_no).padStart(4, "0");
  writeFileSync(`qr/${no}-${bag.code}.svg`, await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" }));
  appendFileSync("qr/codes.csv", `${bag.bag_no},${bag.code},${url}\n`);
}
console.log(`Created ${count} codes in ./qr`);
await sql.end();
