// modules/ui-3d.js
// Self-contained Three.js 3D car viewer.
// Usage: const viewer = await createCarViewer(containerEl); viewer.load(glbUrl); viewer.setColor('#ff0000');

import * as THREE from 'three';
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Constants ────────────────────────────────────────────────────────────────

const SKIP_MAT = /black|glass|window|chrome|tire|tyre|rubber|interior|brown|leather|seat|carpet|floor|badge|logo|lamp|light|redglass|licenseplate/i;

// GLB-specific overrides keyed by substring of the URL
const MODEL_OVERRIDES = {
  seltos: { exposure: 2.2, key: 4.0, fill: 2.5, rim: 1.5, under: 0.8, rotX: -Math.PI / 2 },
  Seltos: { exposure: 2.2, key: 4.0, fill: 2.5, rim: 1.5, under: 0.8, rotX: -Math.PI / 2 },
};

// targetFill overrides: correct for GLBs that are in different unit scales
// Creta maxDim ~4.32 is the reference. Grand Vitara maxDim ~8.74 needs a bigger targetFill.
const TARGET_FILL_OVERRIDES = [
  { match: (u) => u.includes('vitara') || u.includes('Vitara'), fill: 1.8 * (8.74 / 4.32) },
];

const DEFAULT_EXPOSURE = 1.2;
const DEFAULT_LIGHTS   = { key: 2.5, fill: 1.0, rim: 0.8, under: 0.3 };

// ── Factory ──────────────────────────────────────────────────────────────────

export function createCarViewer(containerEl) {
  const canvas    = containerEl.querySelector('canvas.viewer-canvas');
  const loadingEl = containerEl.querySelector('.viewer-loading');
  const hintEl    = containerEl.querySelector('.viewer-hint');

  if (!canvas) throw new Error('ui-3d: container must contain <canvas class="viewer-canvas">');

  const W = containerEl.clientWidth  || 360;
  const H = containerEl.clientHeight || 280;

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);
  renderer.outputColorSpace   = THREE.SRGBColorSpace;
  renderer.toneMapping        = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = DEFAULT_EXPOSURE;
  renderer.shadowMap.enabled  = true;
  renderer.shadowMap.type     = THREE.PCFSoftShadowMap;

  // ── Scene ──
  const scene  = new THREE.Scene();
  scene.background = null;

  // ── Camera ──
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
  camera.position.set(0, 0.25, 1.9);

  // ── Lights ──
  const keyLight   = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTS.key);
  keyLight.position.set(3, 5, 3);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.near = 0.1;
  keyLight.shadow.camera.far  = 20;

  const fillLight  = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTS.fill);
  fillLight.position.set(-2, 3, 3);

  const rimLight   = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTS.rim);
  rimLight.position.set(0, 2, -4);

  const underLight = new THREE.DirectionalLight(0xffffff, DEFAULT_LIGHTS.under);
  underLight.position.set(0, -2, 2);

  scene.add(keyLight, fillLight, rimLight, underLight);
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // ── Shadow plane ──
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.ShadowMaterial({ opacity: 0.12 })
  );
  shadowPlane.rotation.x  = -Math.PI / 2;
  shadowPlane.position.y  = -0.001;
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);

  // ── Controls ──
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping    = true;
  controls.dampingFactor    = 0.06;
  controls.enablePan        = false;
  controls.minDistance      = 1.2;
  controls.maxDistance      = 4;
  controls.minPolarAngle    = Math.PI / 6;
  controls.maxPolarAngle    = Math.PI / 2.1;
  controls.autoRotate       = true;
  controls.autoRotateSpeed  = 1.8;
  controls.target.set(0, 0.3, 0);
  controls.update();

  let rotateTimer;
  controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(rotateTimer);
    if (hintEl) hintEl.classList.add('hidden');
  });
  controls.addEventListener('end', () => {
    clearTimeout(rotateTimer);
    rotateTimer = setTimeout(() => { controls.autoRotate = true; }, 1500);
  });

  // ── State ──
  let currentModel = null;
  let paintMeshes  = [];
  let currentColor = new THREE.Color(0xf0f0f0);

  // ── Render loop ──
  let _rafId;
  function animate() {
    _rafId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ── Resize ──
  const _resizeObs = new ResizeObserver(() => {
    const w = containerEl.clientWidth;
    const h = containerEl.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  _resizeObs.observe(containerEl);

  // ── Internal helpers ─────────────────────────────────────────────────────

  function _clearModel() {
    if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }
    paintMeshes = [];
  }

  function _applyLighting(url) {
    let override = null;
    for (const key of Object.keys(MODEL_OVERRIDES)) {
      if (url.includes(key)) { override = MODEL_OVERRIDES[key]; break; }
    }
    if (override) {
      renderer.toneMappingExposure = override.exposure;
      keyLight.intensity   = override.key;
      fillLight.intensity  = override.fill;
      rimLight.intensity   = override.rim;
      underLight.intensity = override.under;
    } else {
      renderer.toneMappingExposure = DEFAULT_EXPOSURE;
      keyLight.intensity   = DEFAULT_LIGHTS.key;
      fillLight.intensity  = DEFAULT_LIGHTS.fill;
      rimLight.intensity   = DEFAULT_LIGHTS.rim;
      underLight.intensity = DEFAULT_LIGHTS.under;
    }
    return override;
  }

  function _targetFill(url) {
    for (const rule of TARGET_FILL_OVERRIDES) {
      if (rule.match(url)) return rule.fill;
    }
    return 1.8;
  }

  function _detectPaint(model) {
    const matCount = {};
    const matRefs  = {};

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow    = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(m => {
        if (!m || !m.color) return;
        const name = (m.name || '').toLowerCase();
        if (name.includes('carpaint') || name.includes('car_paint') ||
            name.includes('body_paint') || name.includes('carosserie') ||
            name.includes('carcolor')) {
          matCount[m.name] = (matCount[m.name] || 0) + 99;
          matRefs[m.name]  = m;
          return;
        }
        if (SKIP_MAT.test(name)) return;
        const brightness = m.color.r + m.color.g + m.color.b;
        if (brightness < 0.15) return;
        matCount[m.name] = (matCount[m.name] || 0) + 1;
        matRefs[m.name]  = m;
      });
    });

    const best = Object.keys(matCount).sort((a, b) => matCount[b] - matCount[a])[0];
    let mat = best ? matRefs[best] : null;

    // Fallback: first mesh material
    if (!mat) {
      model.traverse(child => {
        if (mat || !child.isMesh) return;
        const m = Array.isArray(child.material) ? child.material[0] : child.material;
        if (m) mat = m;
      });
    }

    if (mat) {
      mat.metalness = 0.7;
      mat.roughness = 0.25;
      if (mat.map) { mat._originalMap = mat.map; mat.map = null; }
      mat.needsUpdate = true;
      paintMeshes.push({ material: mat, _isMaterialRef: true });
    }
  }

  function _buildFallbackCar() {
    const group = new THREE.Group();
    const mat   = new THREE.MeshStandardMaterial({ color: currentColor, roughness: 0.4, metalness: 0.3 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.9), mat.clone());
    body.position.y = 0.3;
    body.castShadow = true;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.86), mat.clone());
    cabin.position.set(-0.1, 0.71, 0);
    cabin.castShadow = true;

    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.1, metalness: 0.5, transparent: true, opacity: 0.85 });
    const fScreen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.78), glassMat);
    fScreen.position.set(0.46, 0.68, 0); fScreen.rotation.z = -0.35;
    const rScreen = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.35, 0.78), glassMat);
    rScreen.position.set(-0.65, 0.68, 0); rScreen.rotation.z = 0.35;

    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
    const rimMat   = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.8 });

    [[0.6,0,0.5],[0.6,0,-0.5],[-0.6,0,0.5],[-0.6,0,-0.5]].forEach(([x,y,z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI/2; w.position.set(x, y+0.09, z); w.castShadow = true;
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.19,8), rimMat);
      r.rotation.x = Math.PI/2; r.position.set(x, y+0.09, z);
      group.add(w, r);
    });

    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffee, emissiveIntensity: 0.6 });
    [[0.91,0.32,0.28],[0.91,0.32,-0.28]].forEach(([x,y,z]) => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.1,0.15), lightMat);
      hl.position.set(x,y,z); group.add(hl);
    });

    group.add(body, cabin, fScreen, rScreen);
    [body, cabin].forEach(m => paintMeshes.push({ material: m.material, _isMaterialRef: true }));

    group.scale.setScalar(0.85);
    scene.add(group);
    currentModel = group;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  const loader = new GLTFLoader();

  function load(url) {
    _clearModel();

    if (!url || url === '__hide__') return;

    if (url === '__fallback__') {
      _applyLighting('');
      _buildFallbackCar();
      setColor('#' + currentColor.getHexString());
      return;
    }

    if (loadingEl) loadingEl.style.display = 'flex';

    const encodedUrl = url.replace(/ /g, '%20');
    const override   = _applyLighting(encodedUrl);
    const fill       = _targetFill(encodedUrl);

    loader.load(
      encodedUrl,
      (gltf) => {
        const model = gltf.scene;
        currentModel = model;

        // Scale to normalised size
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.scale.setScalar(fill / maxDim);

        // Orientation fix
        if (override && override.rotX) model.rotation.x = override.rotX;

        // Centre on ground
        const postBox = new THREE.Box3().setFromObject(model);
        const center  = postBox.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -postBox.min.y + 0.02;

        // Fit shadow plane to car footprint
        model.updateWorldMatrix(true, true);
        const fb = new THREE.Box3().setFromObject(model);
        shadowPlane.scale.set(
          Math.min(fb.max.x - fb.min.x + 0.15, 5.5),
          Math.min(fb.max.z - fb.min.z + 0.15, 3.0),
          1
        );

        _detectPaint(model);
        setColor('#' + currentColor.getHexString());
        scene.add(model);

        if (loadingEl) loadingEl.style.display = 'none';
        if (hintEl) setTimeout(() => hintEl.classList.add('hidden'), 2500);
      },
      undefined,
      () => {
        if (loadingEl) loadingEl.innerHTML = `
          <div style="color:rgba(255,255,255,0.5);font-size:0.7rem;text-align:center;padding:1rem">
            Model unavailable.<br>Using placeholder.
          </div>`;
        _buildFallbackCar();
        setColor('#' + currentColor.getHexString());
        if (loadingEl) loadingEl.style.display = 'none';
      }
    );
  }

  function setColor(hex) {
    currentColor.set(hex);
    paintMeshes.forEach(entry => {
      if (entry._isMaterialRef) {
        entry.material.color.set(hex);
        entry.material.needsUpdate = true;
      }
    });
  }

  function destroy() {
    cancelAnimationFrame(_rafId);
    _resizeObs.disconnect();
    controls.dispose();
    renderer.dispose();
  }

  return { load, setColor, destroy };
}
