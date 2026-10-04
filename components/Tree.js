"use client";
import { useState } from "react";
import { leafPos, beans } from "@/lib/leaves";

const LEAF = "M0 -9 C6 -5 6 5 0 9 C-6 5 -6 -5 0 -9 Z";
const SLOTS = [
  { x: 6, y: 8 },
  { right: 294, y: 50 },
  { x: 6, y: 214 },
  { right: 294, y: 252 },
];
const excerpt = (s) => (s.length > 26 ? s.slice(0, 25).replace(/[\s.,;:!?]+$/, "") + "…" : s);

export default function Tree({ leafIds, mineId, rainLevel = 0, bubbles = [], code, interactive = false }) {
  const [open, setOpen] = useState(null);

  async function read(id) {
    if (!interactive || !id) return;
    if (id === mineId) return setOpen({ id, mine: true });
    const hit = bubbles.find((b) => b.id === id);
    if (hit) return setOpen(hit);
    const res = await fetch(`/api/leaf/${id}?code=${code}`);
    if (res.ok) setOpen(await res.json());
  }

  const onClick = (e) => read(Number(e.target.closest("[data-id]")?.dataset.id));
  const mine = mineId && leafIds.includes(mineId) ? leafPos(mineId) : null;

  return (
    <>
      <svg viewBox="0 0 300 340" className={`tree${interactive ? " interactive" : ""}`} role="img"
           aria-label={`Tree with ${leafIds.length} leaves`} onClick={onClick}>
        <ellipse className="ground" cx="150" cy="332" rx="120" ry="8" />
        <path className="trunk" d="M140 330 C142 280 138 240 146 190 C120 170 96 150 70 132 L74 126 C100 140 124 156 146 172 C146 150 140 120 128 92 L134 88 C148 116 154 146 154 170 C170 146 196 128 228 116 L231 123 C204 136 178 154 158 186 C160 236 158 284 162 330 Z" />
        {leafIds.map((id) => {
          if (id === mineId) return null;
          const p = leafPos(id);
          return (
            <g key={id} data-id={id} className={`l${id % 3}`} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(0)}) scale(${p.s.toFixed(2)})`}>
              <path className="leaf" d={LEAF} />
              <path className="vein" d="M0 -8 L0 8" />
            </g>
          );
        })}
        {mine && (
          <g data-id={mineId}>
            <circle className="ring" cx={mine.x} cy={mine.y} r="15" />
            <g transform={`translate(${mine.x.toFixed(1)} ${mine.y.toFixed(1)}) rotate(${mine.rot.toFixed(0)}) scale(1.3)`}>
              <path className="leaf mine" d={LEAF} />
              <path className="vein" d="M0 -8 L0 8" />
            </g>
          </g>
        )}
        {rainLevel > 0 && (
          <g className="rain" aria-hidden="true">
            {beans(rainLevel).map((b, i) => (
              <g key={i} transform={`translate(${b.x.toFixed(0)} 0)`}>
                <g className="bean" style={{ animationDelay: `-${b.delay.toFixed(2)}s`, animationDuration: `${b.dur.toFixed(2)}s` }}>
                  <ellipse rx="4.5" ry="7" />
                  <path d="M0 -6 C2 -2 -2 2 0 6" />
                </g>
              </g>
            ))}
          </g>
        )}
        {bubbles.slice(0, SLOTS.length).map((b, i) => {
          const p = leafPos(b.id);
          const text = excerpt(b.body);
          const w = text.length * 4.6 + 14;
          const slot = SLOTS[i];
          const x = slot.x ?? slot.right - w;
          return (
            <g key={b.id} data-id={b.id} className="bubble-g">
              <path className="tick" d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${(x + w / 2).toFixed(1)} ${slot.y + 9}`} />
              <rect className="bubble" x={x} y={slot.y} width={w} height="18" rx="9" />
              <text className="btext" x={x + 7} y={slot.y + 12.5}>{text}</text>
            </g>
          );
        })}
      </svg>
      {interactive && (
        <div className="reader" aria-live="polite">
          {open ? (
            open.mine ? <p className="hint">That's your leaf.</p> : (
              <blockquote className="card">
                {open.body}
                {open.name && <cite>{open.name}</cite>}
              </blockquote>
            )
          ) : (
            <p className="hint">Tap any leaf to read it.</p>
          )}
        </div>
      )}
    </>
  );
}
