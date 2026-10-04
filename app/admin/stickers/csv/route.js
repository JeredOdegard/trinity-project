import { listBags, siteUrl } from "@/lib/bags";

export async function GET(req) {
  const sp = new URL(req.url).searchParams;
  const from = Math.max(1, Number(sp.get("from")) || 1);
  const to = Math.max(from, Number(sp.get("to")) || from);
  const [bags, base] = await Promise.all([listBags(from, to), siteUrl()]);
  const csv = ["bag_no,code,url,used", ...bags.map((b) => `${b.bag_no},${b.code},${base}/t/${b.code},${b.used}`)].join("\n");
  return new Response(csv + "\n", {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="trinity-stickers-${from}-${to}.csv"`,
    },
  });
}
