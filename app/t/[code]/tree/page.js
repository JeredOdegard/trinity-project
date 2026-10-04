import Link from "next/link";
import { notFound } from "next/navigation";
import Brand from "@/components/Brand";
import Tree from "@/components/Tree";
import RainNote from "@/components/RainNote";
import { getBag, getLeafIds, getRandomMessages, rainStatus } from "@/lib/trinity";

export default async function TreePage({ params }) {
  const { code } = await params;
  const bag = await getBag(code);
  if (!bag?.message_id) notFound();
  const [leafIds, bubbles] = await Promise.all([getLeafIds(), getRandomMessages(bag.message_id, 4)]);
  const status = rainStatus(leafIds.length);
  return (
    <>
      <Brand />
      <p className="label">The tree · {leafIds.length} {leafIds.length === 1 ? "leaf" : "leaves"}</p>
      <div className="big">
        <Tree leafIds={leafIds} mineId={bag.message_id} rainLevel={status.level}
              bubbles={bubbles.map(({ id, body, name }) => ({ id, body, name }))} code={code} interactive />
      </div>
      <RainNote status={status} />
      <Link href={`/t/${code}`} className="btn ghost">Back to my match</Link>
    </>
  );
}
