"use client";
import { useEffect, useRef, useState } from "react";
import { goalStatus } from "@/lib/goals";

// Interactive: drag to turn, pinch to zoom, tap a leaf to read it; a random message lights up every few seconds.
// Compact (not interactive): a preview that faces the visitor's leaf, with a "Your leaf" marker on it.
export default function TreeScene({ leafIds, mineId, mineBody, interactive = false, featured = [], code, className = "scene" }) {
  const el = useRef(null);
  const marker = useRef(null);
  const scene = useRef(null);
  const [open, setOpen] = useState(null);
  const level = goalStatus(leafIds.length).level;

  useEffect(() => {
    let alive = true;
    import("@/lib/tree3d/scene").then(({ createScene }) => {
      if (!alive) return;
      scene.current = createScene(el.current, {
        interactive,
        marker: marker.current,
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
      <div className={className}>
        <div className="scene-canvas" ref={el} />
        <div className="leaf-marker" ref={marker} aria-hidden="true">
          <span className="ring" />
          <span className="tag">Your leaf</span>
        </div>
        {interactive && (
          <div className="scene-tools">
            <button type="button" onClick={() => scene.current?.focusMine()}>My leaf</button>
            <button type="button" onClick={() => scene.current?.resetView()}>Reset</button>
          </div>
        )}
      </div>
      {interactive && (
        <div className="reader" aria-live="polite">
          {open?.mine ? (
            <blockquote className="card mine-card">{mineBody}<cite>Your leaf</cite></blockquote>
          ) : open ? (
            <blockquote className="card">{open.body}</blockquote>
          ) : (
            <p className="hint">Tap a leaf to read it. Drag to turn, pinch to zoom.</p>
          )}
        </div>
      )}
    </>
  );
}
