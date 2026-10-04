import { MAX_RAIN_LEVEL } from "@/lib/constants";

const WORDS = ["", "a drizzle", "a shower", "a steady rain", "a downpour", "a cocoa storm"];

export default function RainNote({ status }) {
  const { count, level, next, prev } = status;
  const pct = next ? Math.round(((count - prev) / (next - prev)) * 100) : 100;
  let text;
  if (level === 0) text = `${count} of ${next} leaves until it rains cocoa`;
  else if (level === MAX_RAIN_LEVEL) text = `${count} leaves. It's ${WORDS[level]}.`;
  else text = `It's raining cocoa: ${WORDS[level]}. ${next - count} more leaves to make it heavier.`;
  return (
    <>
      <div className="meter"><div className="fill" style={{ width: `${pct}%` }} /></div>
      <p className="foot">{text}</p>
    </>
  );
}
