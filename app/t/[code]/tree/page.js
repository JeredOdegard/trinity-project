import Link from "next/link";
import { notFound } from "next/navigation";
import Brand from "@/components/Brand";
import GoalBar from "@/components/GoalBar";
import TreeScene from "@/components/TreeScene";
import { getBag, getLeafIds, getRandomMessages } from "@/lib/trinity";

// Dev only: ?leaves=5000 pads the tree with sample leaves to preview any goal.
function previewIds(ids, n) {
  const out = ids.slice(0, n);
  let next = Math.max(0, ...ids) + 1;
  while (out.length < n) out.push(next++);
  return out;
}

export default async function TreePage({ params, searchParams }) {
  const { code } = await params;
  const { leaves } = await searchParams;
  const bag = await getBag(code);
  if (!bag?.message_id) notFound();
  const [realIds, featured] = await Promise.all([getLeafIds(), getRandomMessages(bag.message_id, 6)]);
  const leafIds = process.env.NODE_ENV !== "production" && leaves ? previewIds(realIds, Number(leaves)) : realIds;
  return (
    <>
      <Brand />
      <p className="label">The tree · {leafIds.length.toLocaleString("en-US")} {leafIds.length === 1 ? "leaf" : "leaves"}</p>
      <TreeScene leafIds={leafIds} mineId={bag.message_id} mineBody={bag.body} code={code} interactive
                 featured={featured.map(({ id, body }) => ({ id, body }))} />
      <GoalBar count={leafIds.length} />
      <Link href={`/t/${code}`} className="btn ghost">Back to my match</Link>
    </>
  );
}
