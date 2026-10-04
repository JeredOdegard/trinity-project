import Link from "next/link";
import QRCode from "qrcode";
import { listBags, siteUrl } from "@/lib/bags";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";
const MAX_SHEET = 500;
const no = (n) => String(n).padStart(4, "0");

export default async function PrintSheet({ searchParams }) {
  const sp = await searchParams;
  const from = Math.max(1, Number(sp.from) || 1);
  const to = Math.min(Number(sp.to) || from, from + MAX_SHEET - 1);
  const [bags, base] = await Promise.all([listBags(from, to), siteUrl()]);
  const stickers = await Promise.all(
    bags.map(async (b) => ({
      ...b,
      svg: await QRCode.toString(`${base}/t/${b.code}`, {
        type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#3a2a1d", light: "#0000" },
      }),
    })),
  );
  return (
    <>
      <div className="no-print">
        <h1 className="h">Stickers {no(from)} to {no(to)}</h1>
        <p className="p">{bags.length} stickers{bags.some((b) => b.used) ? `, ${bags.filter((b) => b.used).length} already used` : ""}. Links point to {base}.</p>
        <div className="inline-form">
          <PrintButton />
          <Link className="btn ghost" href={`/admin/stickers/csv?from=${from}&to=${to}`} prefetch={false}>Download CSV for a printer</Link>
        </div>
      </div>
      <div className="sheet">
        {stickers.map((s) => (
          <div key={s.code} className={`sticker${s.used ? " used" : ""}`}>
            <span className="s-mark">GRACE</span>
            <div className="s-qr" dangerouslySetInnerHTML={{ __html: s.svg }} />
            <span className="s-cta">Scan to leave a word for a stranger</span>
            <span className="s-no">The Trinity Project · No. {no(s.bag_no)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
