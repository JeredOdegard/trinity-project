// The 3D tree scene: canopy, one leaf per message, cocoa beans once goals are reached.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildCanopy, COLORS, FRAME, PILE, LEAF_SIZE } from "./canopy";
import { createBeans } from "./beans";

const MAX_LEAVES = 12000;
const Z = new THREE.Vector3(0, 0, 1);

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

// interactive: drag to turn, tap a leaf to read it (onPick). Otherwise it just slowly turns.
export function createScene(el, { interactive = false, onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, FRAME.target.y + 1.2, 14);

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

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 64),
    new THREE.MeshStandardMaterial({ map: groundTexture(COLORS.ground), transparent: true, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Leaves: one instance per message.
  const leafGeo = leafGeometry(LEAF_SIZE);
  const leafMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.65 });
  const leaves = new THREE.InstancedMesh(leafGeo, leafMat, MAX_LEAVES);
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
  let mineId = null;
  let lit = null;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const tw = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const color = new THREE.Color();

  function place(id, n, scale = 1) {
    const { p, d, r } = tree.slot(id, n);
    q.setFromUnitVectors(Z, d);
    q.multiply(tw.setFromAxisAngle(Z, r() * Math.PI * 2));
    q.multiply(tw.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.6));
    sc.setScalar((0.8 + r() * 0.45) * scale);
    return { m: m.compose(p.addScaledVector(d, 0.02), q, sc), r };
  }

  function setLeaves(nextIds, nextMine) {
    ids = nextIds.filter((id) => id !== nextMine).slice(0, MAX_LEAVES);
    mineId = nextIds.includes(nextMine) ? nextMine : null;
    const n = nextIds.length;
    tree.grow(n);
    ids.forEach((id, i) => {
      const { m: mat, r } = place(id, n);
      leaves.setMatrixAt(i, mat);
      leaves.setColorAt(i, color.set(COLORS.leaves[Math.floor(r() * COLORS.leaves.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06));
    });
    leaves.count = ids.length;
    leaves.instanceMatrix.needsUpdate = true;
    if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
    leaves.computeBoundingSphere();
    mine.visible = mineId != null;
    if (mine.visible) {
      const { m: mat } = place(mineId, n);
      mat.decompose(mine.position, mine.quaternion, mine.scale);
    }
    lit = null;
  }

  function highlight(id) {
    if (lit != null && lit < leaves.count) {
      const { m: mat, r } = place(ids[lit], ids.length + (mineId ? 1 : 0));
      leaves.setMatrixAt(lit, mat);
      leaves.setColorAt(lit, color.set(COLORS.leaves[Math.floor(r() * COLORS.leaves.length)]).offsetHSL(0, 0, (r() - 0.5) * 0.06));
    }
    lit = ids.indexOf(id);
    if (lit < 0) return (lit = null);
    const { m: mat } = place(id, ids.length + (mineId ? 1 : 0), 2.2);
    leaves.setMatrixAt(lit, mat);
    leaves.setColorAt(lit, color.set(COLORS.highlight));
    leaves.instanceMatrix.needsUpdate = true;
    leaves.instanceColor.needsUpdate = true;
  }

  // Camera framing: fit FRAME into the viewport at any aspect ratio.
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(FRAME.target);
  Object.assign(controls, {
    enableZoom: false, enablePan: false, enableRotate: interactive, enableDamping: true,
    autoRotate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches, autoRotateSpeed: 0.5,
    minPolarAngle: Math.PI * 0.3, maxPolarAngle: Math.PI * 0.52,
  });

  function resize() {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(FRAME.h / 2 / t, FRAME.w / 2 / (t * aspect)) + 2;
    const dir = camera.position.clone().sub(controls.target).normalize();
    camera.position.copy(controls.target).addScaledVector(dir, dist);
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  // Tap (not drag) to read a leaf.
  const ray = new THREE.Raycaster();
  let down = null;
  const onDown = (e) => (down = [e.clientX, e.clientY]);
  const onUp = (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const b = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), camera);
    const [hit] = ray.intersectObjects([leaves, mine], false);
    if (!hit) return;
    if (hit.object === mine) onPick(mineId, true);
    else onPick(ids[hit.instanceId], false);
  };
  if (interactive) {
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);
  }

  const clock = new THREE.Clock();
  let raf;
  (function loop() {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    tree.group.rotation.z = Math.sin(t * 0.6) * 0.008;
    tree.group.rotation.x = Math.sin(t * 0.43) * 0.006;
    mine.material.emissiveIntensity = 0.25 + Math.sin(t * 2.4) * 0.2;
    beans.update(dt);
    controls.update();
    renderer.render(scene, camera);
  })();

  return {
    setLeaves,
    setLevel: beans.setLevel,
    highlight,
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
