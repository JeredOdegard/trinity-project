import { bagCounts, siteUrl, MAX_BATCH } from "@/lib/bags";
import MakeForm from "./MakeForm";

export const dynamic = "force-dynamic";

export default async function Stickers() {
  const [c, base] = await Promise.all([bagCounts(), siteUrl()]);
  return (
    <>
      <h1 className="h">QR stickers</h1>
      <p className="p">{c.total} codes made · {c.used} used. Each sticker gets its own private link, like <code>{base}/t/x7k2m9ab</code>.</p>
      {!process.env.SITE_URL && (
        <p className="error">SITE_URL isn't set, so codes will point at {base}. Set it to the final domain before printing.</p>
      )}
      <MakeForm max={MAX_BATCH} />
      {c.last > 0 && (
        <form action="/admin/stickers/print" className="inline-form">
          <label>From no. <input type="number" name="from" min="1" max={c.last} defaultValue={Math.max(1, c.last - 99)} /></label>
          <label>to <input type="number" name="to" min="1" max={c.last} defaultValue={c.last} /></label>
          <button className="btn ghost">Open sheet</button>
        </form>
      )}
    </>
  );
}
