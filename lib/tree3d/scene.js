// The 3D tree scene: canopy, one leaf per message, cocoa beans once goals are reached.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildCanopy, COLORS, FRAME, PILE, LEAF_SIZE } from "./canopy";
import { createBeans } from "./beans";

const MAX_LEAVES = 12000;
const Z = new THREE.Vector3(0, 0, 1);
const TAP_RADIUS = 28; // px: a tap this close to a leaf counts as tapping it
// The match-page preview frames the canopy a little tighter than the full tree.
const COMPACT_FRAME = { w: 6.8, h: 7.4, target: new THREE.Vector3(0, 3.7, 0) };

function leafGeometry(size) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.38, 0.25, 0.32, 0.75, 0, 1);
  s.bezierCurveTo(-0.32, 0.75, -0.38, 0.25, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 6);
  geo.scale(size * 0.62, size, 1);
  return geo;
}

function groundTexture(color) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, color);
  grad.addColorStop(0.65, color);
  grad.addColorStop(1, `${color}00`); // same color, transparent: no dark rim
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// interactive: drag to turn, pinch to zoom, two-finger pan, tap a leaf to read it (onPick).
// Otherwise a still preview that faces the visitor's leaf and sways gently.
// marker: optional element kept pinned over the visitor's own leaf.
export function createScene(el, { interactive = false, onPick, marker } = {}) {
  const frame = interactive ? FRAME : COMPACT_FRAME;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight("#fff6e6", "#b9a27f", 1.4));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.4);
  sun.position.set(5, 11, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 10, bottom: -9, near: 1, far: 30 });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);

  const tree = buildCanopy();
  scene.add(tree.group);
  const solids = [...tree.group.children]; // trunk + clumps, for "is my leaf hidden?" checks

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 64),
    new THREE.MeshStandardMaterial({ map: groundTexture(COLORS.ground), transparent: true, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Leaves: one instance per message.
  const leaves = new THREE.InstancedMesh(leafGeometry(LEAF_SIZE), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.65 }), MAX_LEAVES);
  leaves.castShadow = true;
  leaves.count = 0;
  tree.group.add(leaves);
  const mine = new THREE.Mesh(leafGeometry(LEAF_SIZE * 1.9), new THREE.MeshStandardMaterial({
    color: COLORS.mine, emissive: COLORS.mine, emissiveIntensity: 0.25, side: THREE.DoubleSide,
  }));
  mine.castShadow = true;
  mine.visible = false;
  tree.group.add(mine);

  const beans = createBeans(scene, PILE);

  let ids = [];
  let spots = []; // local position of each leaf, for tap snapping
  let mineId = null;
  let lit = null;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const tw = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const color = new THREE.Color();
  const X = new THREE.Vector3(1, 0, 0);

  function place(id, n, scale = 1, lift = 0.02) {
    const { p, d, r } = tree.slot(id, n);
    q.setFromUnitVectors(Z, d);
    q.multiply(tw.setFromAxisAngle(Z, r() * Math.PI * 2));
    q.multiply(tw.setFromAxisAngle(X, -0.6));
    sc.setScalar((0.8 + r() * 0.45) * scale);
    p.addScaledVector(d, lift);
    return { m: m.compose(p, q, sc), p, r };
  }

  const leafColor = (r) => color.set(COLORS.leaves[Math.floor(r() * COLORS.leaves.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06);

  function setLeaves(nextIds, nextMine) {
    ids = nextIds.filter((id) => id !== nextMine).slice(0, MAX_LEAVES);
    mineId = nextIds.includes(nextMine) ? nextMine : null;
    const n = nextIds.length;
    tree.grow(n);
    spots = ids.map((id, i) => {
      const { m: mat, p, r } = place(id, n);
      leaves.setMatrixAt(i, mat);
      leaves.setColorAt(i, leafColor(r));
      return p;
    });
    leaves.count = ids.length;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.computeBoundingSphere();
    mine.visible = mineId != null;
    // The visitor's leaf sits a little proud of the canopy so it isn't buried in a clump.
    if (mine.visible) place(mineId, n, 1, 0.14).m.decompose(mine.position, mine.quaternion, mine.scale);
    lit = null;
    if (!interactive && mine.visible) faceMine();
  }

  function highlight(id) {
    const n = ids.length + (mineId ? 1 : 0);
    if (lit != null && lit < leaves.count) {
      const { m: mat, r } = place(ids[lit], n);
      leaves.setMatrixAt(lit, mat);
      leaves.setColorAt(lit, leafColor(r));
    }
    lit = ids.indexOf(id);
    if (lit < 0) return (lit = null);
    leaves.setMatrixAt(lit, place(id, n, 2.2).m);
    leaves.setColorAt(lit, color.set(COLORS.highlight));
    leaves.instanceMatrix.needsUpdate = true;
    leaves.instanceColor.needsUpdate = true;
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(frame.target);
  Object.assign(controls, {
    enabled: interactive, enableZoom: true, enablePan: true, screenSpacePanning: true, enableDamping: true,
    autoRotate: interactive && !still, autoRotateSpeed: 0.5,
    minPolarAngle: Math.PI * 0.15, maxPolarAngle: Math.PI * 0.53,
    touches: { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN },
  });
  controls.addEventListener("start", () => (controls.autoRotate = false));

  // Camera sits at `fit` distance so the whole frame shows at any aspect ratio.
  let fit = 14;
  let az = 0; // compact view: azimuth that faces the visitor's leaf
  let lastWidth = 0;
  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    fit = Math.max(frame.h / 2 / t, frame.w / 2 / (t * camera.aspect)) + 2;
    controls.minDistance = fit * 0.22;
    controls.maxDistance = fit * 1.15;
    // Mobile URL bars change the height while scrolling; only reframe when the width changes,
    // so a visitor's zoom survives scrolling.
    if (w !== lastWidth) {
      lastWidth = w;
      orbit(controls.target, fit, az, 0.12);
    }
    camera.updateProjectionMatrix();
  }

  function orbit(target, dist, azimuth, elevation) {
    camera.position.set(
      target.x + Math.sin(azimuth) * Math.cos(elevation) * dist,
      target.y + Math.sin(elevation) * dist,
      target.z + Math.cos(azimuth) * Math.cos(elevation) * dist,
    );
    camera.lookAt(target);
  }

  function faceMine() {
    az = Math.atan2(mine.position.x, mine.position.z);
    orbit(controls.target, fit, az, 0.12);
  }

  // Smooth camera moves for "My leaf" and "Reset".
  let tween = null;
  function flyTo(target, position) {
    controls.autoRotate = false;
    tween = { t: 0, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: target, toP: position };
  }

  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  // Tap (not drag or pinch) to read a leaf. Snaps to the nearest leaf within TAP_RADIUS px.
  const ray = new THREE.Raycaster();
  const v = new THREE.Vector3();
  const pointers = new Set();
  let tap = null;
  const onDown = (e) => {
    pointers.add(e.pointerId);
    tap = pointers.size === 1 ? [e.clientX, e.clientY] : null;
  };
  const onUp = (e) => {
    pointers.delete(e.pointerId);
    if (!tap || Math.hypot(e.clientX - tap[0], e.clientY - tap[1]) > 8) return;
    tap = null;
    const b = renderer.domElement.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    ray.setFromCamera(new THREE.Vector2((x / b.width) * 2 - 1, -(y / b.height) * 2 + 1), camera);
    const [hit] = ray.intersectObjects([leaves, mine], false);
    if (hit) return hit.object === mine ? onPick(mineId, true) : onPick(ids[hit.instanceId], false);
    let best = TAP_RADIUS;
    let pick = null;
    const consider = (local, id, isMine) => {
      v.copy(local).applyMatrix4(tree.group.matrixWorld).project(camera);
      if (v.z > 1) return;
      const d = Math.hypot(((v.x + 1) / 2) * b.width - x, ((1 - v.y) / 2) * b.height - y);
      if (d < best) [best, pick] = [d, [id, isMine]];
    };
    spots.forEach((p, i) => consider(p, ids[i], false));
    if (mine.visible) consider(mine.position, mineId, true);
    if (pick) onPick(...pick);
  };
  const onCancel = (e) => {
    pointers.delete(e.pointerId);
    tap = null;
  };
  if (interactive) {
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onCancel);
  }

  // Keep the marker pinned over the visitor's leaf; dim it when the canopy hides the leaf.
  const markerRay = new THREE.Raycaster();
  const mineWorld = new THREE.Vector3();
  function updateMarker() {
    if (!marker) return;
    if (!mine.visible) return void (marker.style.opacity = "0");
    mine.getWorldPosition(mineWorld);
    v.copy(mineWorld).project(camera);
    const x = ((v.x + 1) / 2) * el.clientWidth;
    const y = ((1 - v.y) / 2) * el.clientHeight;
    const dist = camera.position.distanceTo(mineWorld);
    markerRay.set(camera.position, mineWorld.clone().sub(camera.position).normalize());
    markerRay.far = dist - 0.5; // ignore the clump the leaf sits on
    const hidden = markerRay.intersectObjects(solids, false).length > 0;
    marker.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    marker.style.opacity = v.z > 1 ? "0" : hidden ? "0.45" : "1";
    marker.classList.toggle("below", y < 54); // flip the label under the leaf near the top edge
  }

  const clock = new THREE.Clock();
  let raf;
  (function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    tree.group.rotation.z = Math.sin(t * 0.6) * 0.008;
    tree.group.rotation.x = Math.sin(t * 0.43) * 0.006;
    mine.material.emissiveIntensity = 0.35 + Math.sin(t * 2.4) * 0.25;
    beans.update(dt);
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / 0.9);
      const k = 1 - Math.pow(1 - tween.t, 3);
      controls.target.lerpVectors(tween.fromT, tween.toT, k);
      camera.position.lerpVectors(tween.fromP, tween.toP, k);
      if (tween.t === 1) tween = null;
    }
    if (interactive) {
      // Keep panning near the tree.
      controls.target.clamp(new THREE.Vector3(-3.5, 0.3, -3.5), new THREE.Vector3(3.5, 6.5, 3.5));
      controls.update();
    } else if (!still) {
      orbit(controls.target, fit, az + Math.sin(t * 0.35) * 0.35, 0.12);
    }
    renderer.render(scene, camera);
    updateMarker();
  })();

  return {
    setLeaves,
    setLevel: beans.setLevel,
    highlight,
    focusMine() {
      if (!mine.visible) return;
      mine.getWorldPosition(mineWorld);
      const a = Math.atan2(mineWorld.x, mineWorld.z);
      const d = fit * 0.38;
      flyTo(mineWorld.clone(), new THREE.Vector3(mineWorld.x + Math.sin(a) * d * 0.97, mineWorld.y + d * 0.25, mineWorld.z + Math.cos(a) * d * 0.97));
    },
    resetView() {
      const a = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z);
      const T = frame.target.clone();
      flyTo(T, new THREE.Vector3(T.x + Math.sin(a) * fit * 0.99, T.y + fit * 0.12, T.z + Math.cos(a) * fit * 0.99));
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      beans.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        o.material?.map?.dispose();
        o.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
