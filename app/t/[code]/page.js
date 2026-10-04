import Link from "next/link";
import { notFound } from "next/navigation";
import Brand from "@/components/Brand";
import TreeScene from "@/components/TreeScene";
import GoalBar from "@/components/GoalBar";
import WriteForm from "./WriteForm";
import { getBag, getMatch, getLeafIds, countLeaves } from "@/lib/trinity";

const bagNo = (n) => `bag no. ${String(n).padStart(4, "0")}`;

export default async function BagPage({ params }) {
  const { code } = await params;
  const bag = await getBag(code);
  if (!bag) notFound();

  if (!bag.message_id) {
    const count = await countLeaves();
    return (
      <>
        <Brand />
        <p className="tag">Bag no. {String(bag.bag_no).padStart(4, "0")}</p>
        <h1 className="h">Leave a word for a stranger.</h1>
        <p className="p">Write something kind. You'll be matched with the last person who opened a bag, and your words become a leaf on the tree.</p>
        <WriteForm code={code} />
        <p className="foot">{count} {count === 1 ? "leaf" : "leaves"} so far</p>
      </>
    );
  }

  const [match, leafIds] = await Promise.all([getMatch(bag.message_id), getLeafIds()]);
  return (
    <>
      <Brand />
      <p className="label">Someone left this for you</p>
      <blockquote className="card match">
        {match?.body ?? "May this cup be a small mercy in your day."}
        <cite>{match?.bag_no ? bagNo(match.bag_no) : "Grace"}</cite>
      </blockquote>
      <Link href={`/t/${code}/tree`} className="mini" aria-label="See the whole tree">
        <TreeScene leafIds={leafIds} mineId={bag.message_id} className="scene mini" />
      </Link>
      <p className="label">Your leaf</p>
      <div className="card mine-card">{bag.body}</div>
      <GoalBar count={leafIds.length} />
      <Link href={`/t/${code}/tree`} className="btn ghost">See the whole tree</Link>
    </>
  );
}
