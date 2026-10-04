// The Trinity tree: trunk splits into three limbs, each crowned with foliage clumps.
// Leaves (one per message) sit on the clump surfaces; the canopy grows with the leaf count.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "@/lib/rng";

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const COLORS = {
  trunk: "#6b4a33",
  clump: "#56733f",
  leaves: ["#7f9b63", "#a3b87f", "#5d7a4a", "#8fae6a", "#b7c78e"],
  mine: "#c0703a",
  highlight: "#e2b65b",
  ground: "#e6dac4",
};

// Tree fits this box (world units) at any viewport aspect.
export const FRAME = { w: 7.6, h: 8.2, target: V(0, 3.2, 0) };
export const PILE = { radius: 3.2, top: 7.5 };
export const LEAF_SIZE = 0.24;

// 0.5 at no leaves, 1.0 at 10k.
const growth = (n) => 0.5 + 0.5 * Math.min(1, Math.log10(n + 10) / 4);

function taperedTube(curve, r0, r1, tubular, radial) {
  const geo = new THREE.TubeGeometry(curve, tubular, 1, radial, false);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i <= tubular; i++) {
    curve.getPointAt(i / tubular, c);
    const r = r0 + (r1 - r0) * (i / tubular);
    for (let j = 0; j <= radial; j++) {
      const k = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  return geo;
}

// Trunk, three limbs, two or three branches per limb. Returns the branch tips.
function branches(r) {
  const geos = [];
  const tips = [];
  function grow(start, dir, len, rad, depth) {
    const end = start.clone().addScaledVector(dir, len);
    const bend = V(r() - 0.5, r() * 0.2, r() - 0.5).multiplyScalar(len * 0.35);
    const curve = new THREE.QuadraticBezierCurve3(start, start.clone().lerp(end, 0.5).add(bend), end);
    geos.push(taperedTube(curve, rad, rad * 0.7, depth === 2 ? 16 : 8, 10));
    if (depth < 2) tips.push({ c: end, r: depth === 0 ? 0.95 : 1.15 });
    if (depth === 0) return;
    const n = depth === 2 ? 3 : r() < 0.35 ? 3 : 2;
    const az0 = r() * Math.PI * 2;
    for (let k = 0; k < n; k++) {
      const az = az0 + (k / n) * Math.PI * 2 + (r() - 0.5) * 0.6;
      const tilt = 0.75 * (0.7 + r() * 0.6);
      const nd = dir.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(V(Math.cos(az), 0, Math.sin(az)), Math.sin(tilt));
      nd.y += 0.18;
      grow(end, nd.normalize(), len * 0.78 * (0.85 + r() * 0.3), rad * 0.62, depth - 1);
    }
  }
  grow(V(0, -0.2, 0), V(0, 1, 0), 2.3, 0.3, 2);
  return { geometry: mergeGeometries(geos), tips };
}

function clumpGeometry(radius, r) {
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const bumps = new Map(); // same bump for vertices shared between faces, so no cracks
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const key = v.toArray().map((n) => n.toFixed(3)).join();
    if (!bumps.has(key)) bumps.set(key, 0.88 + r() * 0.24);
    v.multiplyScalar(radius * bumps.get(key));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildCanopy() {
  const r = rng(11);
  const { geometry, tips } = branches(r);
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: COLORS.trunk, roughness: 0.9 }));
  trunk.castShadow = true;
  group.add(trunk);

  const blobs = [...tips, { c: V(0, 4.6, 0), r: 1.35 }];
  const clumpMat = new THREE.MeshStandardMaterial({ color: COLORS.clump, roughness: 0.95, flatShading: true });
  const clumps = blobs.map((b) => {
    const m = new THREE.Mesh(clumpGeometry(b.r, r), clumpMat);
    m.position.copy(b.c);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  });
  const total = blobs.reduce((s, b) => s + b.r * b.r, 0);

  return {
    group,
    grow(n) {
      clumps.forEach((m) => m.scale.setScalar(growth(n) * 0.92));
    },
    // Where leaf `id` sits when the tree has `n` leaves. Same id, same spot.
    slot(id, n) {
      const lr = rng(Math.imul(id, 2654435761) ^ 0x9e37);
      let pick = lr() * total;
      const b = blobs.find((x) => (pick -= x.r * x.r) <= 0) ?? blobs[0];
      const d = V(0, 0, 0);
      do d.set(lr() * 2 - 1, lr() * 2 - 1, lr() * 2 - 1);
      while (d.lengthSq() > 1 || d.lengthSq() < 0.05);
      d.normalize();
      const p = b.c.clone().addScaledVector(d, growth(n) * b.r * 1.03);
      return { p, d, r: lr };
    },
  };
}
