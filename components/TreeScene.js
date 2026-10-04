"use client";
import { useEffect, useRef, useState } from "react";
import { goalStatus } from "@/lib/goals";

// Interactive: drag to turn, tap a leaf to read it, and a random message lights up every few seconds.
// Compact (not interactive): slowly turning preview.
export default function TreeScene({ leafIds, mineId, interactive = false, featured = [], code, className = "scene" }) {
  const el = useRef(null);
  const scene = useRef(null);
  const [open, setOpen] = useState(null);
  const level = goalStatus(leafIds.length).level;

  useEffect(() => {
    let alive = true;
    import("@/lib/tree3d/scene").then(({ createScene }) => {
      if (!alive) return;
      scene.current = createScene(el.current, {
        interactive,
        onPick: async (id, isMine) => {
          if (isMine) return setOpen({ mine: true });
          const known = featured.find((f) => f.id === id);
          if (known) return setOpen(known);
          const res = await fetch(`/api/leaf/${id}?code=${code}`);
          if (res.ok) setOpen(await res.json());
        },
      });
      scene.current.setLeaves(leafIds, mineId);
      scene.current.setLevel(level);
    });
    return () => {
      alive = false;
      scene.current?.dispose();
      scene.current = null;
    };
    // The scene is built once; the effect below pushes data changes into it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.setLeaves(leafIds, mineId);
    scene.current?.setLevel(level);
  }, [leafIds, mineId, level]);

  useEffect(() => {
    if (!interactive || !featured.length) return;
    let i = 0;
    const show = () => {
      const f = featured[i++ % featured.length];
      scene.current?.highlight(f.id);
      // Don't replace a leaf the visitor tapped themselves.
      setOpen((o) => (o && !o.featured ? o : { ...f, featured: true }));
    };
    const first = setTimeout(show, 1200);
    const every = setInterval(show, 6000);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [interactive, featured]);

  return (
    <>
      <div className={className} ref={el} />
      {interactive && (
        <div className="reader" aria-live="polite">
          {open?.mine ? (
            <p className="hint">That's your leaf.</p>
          ) : open ? (
            <blockquote className="card">{open.body}</blockquote>
          ) : (
            <p className="hint">Tap any leaf to read it. Drag to turn the tree.</p>
          )}
        </div>
      )}
    </>
  );
}
