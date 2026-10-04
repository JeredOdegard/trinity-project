import { GOALS, RAIN_NAMES, goalStatus } from "@/lib/goals";

const fmt = (n) => n.toLocaleString("en-US");
const short = (n) => (n >= 1000 ? `${n / 1000}k` : String(n));

export default function GoalBar({ count }) {
  const { level, prev, next } = goalStatus(count);
  const pct = next ? ((count - prev) / (next - prev)) * 100 : 100;
  return (
    <section className="goal" aria-label="Leaf goal">
      <div className="goal-head">
        <span>{level === 0 ? "Next goal: cocoa rain" : `It's ${RAIN_NAMES[level]}`}</span>
        <span>{next ? `${fmt(count)} / ${fmt(next)}` : `${fmt(count)} leaves`}</span>
      </div>
      <div className="meter"><div className="fill" style={{ width: `${pct}%` }} /></div>
      <ol className="milestones">
        {GOALS.map((g, i) => (
          <li key={g} className={i < level ? "done" : i === level ? "now" : ""}>{short(g)}</li>
        ))}
      </ol>
    </section>
  );
}
