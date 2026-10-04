// Cocoa beans that fall and pile up on the ground (sandpile on a heightfield).
import * as THREE from "three";
import { GOALS } from "@/lib/goals";

// Index = goal level (0 = no goal reached yet, so no beans).
const PILE = [0, 220, 650, 1600, 3200];
const RATE = [0, 4, 12, 30, 60]; // beans per second
const MAX_FALLING = 500;
const N = 44; // heightfield cells per side
const BEAN_H = 0.075;
const SLOPE = 0.1;
// Beans gather toward the trunk so the pile becomes a mound, not a carpet.
const spot = (radius, reach) => {
  const a = Math.random() * Math.PI * 2;
  const r = radius * reach * Math.pow(Math.random(), 1.6);
  return [Math.cos(a) * r, Math.sin(a) * r];
};

export function createBeans(scene, { radius, top }) {
  const geo = new THREE.SphereGeometry(1, 12, 8);
  geo.scale(0.1, 0.055, 0.065);
  const mat = new THREE.MeshStandardMaterial({ color: "#5b3524", roughness: 0.45 });
  const max = PILE[GOALS.length] + MAX_FALLING;
  const mesh = new THREE.InstancedMesh(geo, mat, max);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.count = 0;
  mesh.frustumCulled = false;
  const tint = new THREE.Color();
  for (let i = 0; i < max; i++) mesh.setColorAt(i, tint.setHSL(0.05 + Math.random() * 0.03, 0.45, 0.17 + Math.random() * 0.1));
  scene.add(mesh);

  const cell = (radius * 2) / N;
  let h = new Float32Array(N * N);
  let piled = 0;
  let target = 0;
  let rate = 0;
  let acc = 0;
  const falling = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();

  const idx = (i, j) => j * N + i;
  const inside = (i, j) => i >= 0 && j >= 0 && i < N && j < N && ((i + 0.5) * cell - radius) ** 2 + ((j + 0.5) * cell - radius) ** 2 < radius * radius;

  function land(x, z) {
    let i = Math.floor((x + radius) / cell);
    let j = Math.floor((z + radius) / cell);
    if (!inside(i, j)) return false;
    // Roll downhill until the slope is gentle enough to rest.
    for (let step = 0; step < 40; step++) {
      let best = null;
      let drop = SLOPE;
      for (let di = -1; di <= 1; di++)
        for (let dj = -1; dj <= 1; dj++) {
          if (!di && !dj) continue;
          const ni = i + di, nj = j + dj;
          if (!inside(ni, nj)) continue;
          const d = h[idx(i, j)] - h[idx(ni, nj)];
          if (d > drop) { drop = d; best = [ni, nj]; }
        }
      if (!best) break;
      [i, j] = best;
    }
    const y = h[idx(i, j)];
    h[idx(i, j)] += BEAN_H * 0.6;
    p.set((i + Math.random()) * cell - radius, y + BEAN_H * 0.5, (j + Math.random()) * cell - radius);
    q.setFromEuler(e.set((Math.random() - 0.5) * 0.6, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6));
    mesh.setMatrixAt(piled++, m.compose(p, q, s));
    return true;
  }

  function spawn() {
    const [x, z] = Math.random() < 0.08 ? spot(radius * 1.1, 1) : spot(radius, 0.8);
    falling.push({
      x, z, y: top + Math.random() * 2, vy: -1 - Math.random(),
      rx: Math.random() * 6, ry: Math.random() * 6, spin: 2 + Math.random() * 4,
    });
  }

  function reset() {
    h = new Float32Array(N * N);
    piled = 0;
    falling.length = 0;
  }

  return {
    mesh,
    setLevel(level) {
      const t = PILE[Math.min(level, PILE.length - 1)];
      if (t < piled) reset();
      target = t;
      rate = RATE[Math.min(level, RATE.length - 1)];
      // Arrive with most of the pile already there; the rain tops it up.
      let guard = 0;
      while (piled < target * 0.7 && guard++ < target * 3) {
        land(...spot(radius, 0.8));
      }
      if (!target) falling.length = 0;
      mesh.instanceMatrix.needsUpdate = true;
    },
    update(dt) {
      acc += rate * dt;
      while (acc >= 1) {
        acc -= 1;
        if (falling.length < MAX_FALLING) spawn();
      }
      for (let k = falling.length - 1; k >= 0; k--) {
        const b = falling[k];
        b.vy = Math.max(b.vy - 9.8 * dt * 0.6, -6);
        b.y += b.vy * dt;
        b.rx += b.spin * dt;
        b.ry += b.spin * 0.7 * dt;
        const i = Math.floor((b.x + radius) / cell);
        const j = Math.floor((b.z + radius) / cell);
        const floor = inside(i, j) ? h[idx(i, j)] : -8;
        if (b.y <= floor) {
          if (floor > -8 && piled < target) land(b.x, b.z);
          falling.splice(k, 1);
        }
      }
      falling.forEach((b, k) => {
        q.setFromEuler(e.set(b.rx, b.ry, 0));
        mesh.setMatrixAt(piled + k, m.compose(p.set(b.x, b.y, b.z), q, s));
      });
      mesh.count = piled + falling.length;
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      mesh.dispose();
    },
  };
}
