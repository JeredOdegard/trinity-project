// Pure geometry shared by server and client: same id -> same leaf, every render.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function leafPos(id) {
  const r = rng(Math.imul(id, 2654435761));
  let x, y;
  do {
    x = r() * 2 - 1;
    y = r() * 2 - 1;
  } while (x * x + y * y > 1);
  return { x: 150 + x * 118, y: 118 + y * 84, rot: r() * 120 - 60, s: 0.8 + r() * 0.4 };
}

export function beans(level) {
  const r = rng(level * 7919);
  return Array.from({ length: level * 14 }, () => ({
    x: 8 + r() * 284,
    delay: r() * 4,
    dur: (4.8 - level * 0.4) * (0.8 + r() * 0.4),
  }));
}
