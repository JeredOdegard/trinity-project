import { listMessages, stats } from "@/lib/trinity";
import { toggleHidden } from "./actions";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const [rows, s] = await Promise.all([listMessages(), stats()]);
  return (
    <>
      <h1 className="h">Trinity admin</h1>
      <p className="p">{s.bags} bags · {s.planted} planted · {s.hidden} hidden</p>
      <ul>
        {rows.map((m) => (
          <li key={m.id} className={m.hidden ? "hidden" : ""}>
            <div>
              <p>{m.body}</p>
              <small>#{m.id} · {m.bag_no ? `bag ${m.bag_no}` : "seed"} · {m.created_at.toLocaleString()}</small>
            </div>
            <form action={toggleHidden.bind(null, m.id, !m.hidden)}>
              <button className="btn ghost">{m.hidden ? "Show" : "Hide"}</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
