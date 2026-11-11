/* =========================================================================
   IMeTech: Ventairo VAI-ONE in 3D (luchtkwaliteitsmeter, eigen product)
   Model: echte CAD (SolidWorks-behuizing, EasyEDA-print met Gerber-textuur, WS2812B-ring),
   omgezet naar /models/vai-one.glb. De LED-ring draait de echte firmware-logica na
   (updateLEDs() uit de Ventairo-firmware): statuskleur, zachte overgang en een ademende golf.
   Modi (data-mode op het element):
     explode  scrollgestuurd openen: behuizing, elektronica (print draait om), firmware
     device   dicht product dat met de muis meedraait, met firmware-bediening
     pcb      alleen de print, componentenzijde boven, met labels
   Wordt pas geladen als het element bijna in beeld is (home.js / site-v3.js).
   ========================================================================= */
import * as THREE from '/vendor/three.module.min.js';
import { RoomEnvironment } from '/vendor/RoomEnvironment.js';
import { GLTFLoader } from '/vendor/GLTFLoader.js';
import { EffectComposer } from '/vendor/pp/EffectComposer.js';
import { RenderPass } from '/vendor/pp/RenderPass.js';
import { UnrealBloomPass } from '/vendor/pp/UnrealBloomPass.js';
import { OutputPass } from '/vendor/pp/OutputPass.js';

var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
var lerp = function (a, b, t) { return a + (b - a) * t; };
var EN = (document.documentElement.lang || '').slice(0, 2) === 'en';
var T = function (nl, en) { return EN ? en : nl; };

/* ---------- firmware: zelfde kleuren en drempels als config.h / main.cpp ---------- */
var STATUS = {
  excellent: { rgb: [0x00, 0xff, 0x00], nl: 'Uitstekend', en: 'Excellent' },
  good:      { rgb: [0x9b, 0xff, 0x00], nl: 'Goed', en: 'Good' },
  moderate:  { rgb: [0xff, 0xa0, 0x00], nl: 'Matig', en: 'Moderate' },
  poor:      { rgb: [0xff, 0x00, 0x00], nl: 'Slecht', en: 'Poor' }
};
var HEX = { excellent: '0x00FF00', good: '0x9BFF00', moderate: '0xFFA000', poor: '0xFF0000' };
function statusFor(co2) { return co2 <= 600 ? 'excellent' : co2 <= 1000 ? 'good' : co2 <= 1500 ? 'moderate' : 'poor'; }
function cubicwave8(x) { x = x & 255; var t = (x & 0x80 ? 255 - x : x) * 2 / 255; return 255 * (3 * t * t - 2 * t * t * t); }

/* ---------- ankerpunten (mm, assenstelsel van de samenstelling) ---------- */
var CABLES = {
  ring: { from: [[24.44, 52.9, -35.08], [26.35, 52.9, -33.47], [28.27, 52.9, -31.87], [30.18, 52.9, -30.26]], gf: 'pcb',
          to: [[24.68, 65.0, -35.33], [26.43, 65.0, -33.58], [28.18, 65.0, -31.83], [29.93, 65.0, -30.08]], gt: 'ring', colors: [0xd23b3b, 0x2b9a4b, 0xf2f2f2, 0x1d1f23] },
  logo: { from: [[42.31, 52.9, -5.09], [41.87, 52.9, -7.55], [41.44, 52.9, -10.02]], gf: 'pcb',
          to: [[-2.5, 90.8, 9.0], [0.0, 90.8, 9.0], [2.5, 90.8, 9.0]], gt: 'top', via: [[30, 63, -4, 'ring'], [12, 86, 6, 'top']], colors: [0xd23b3b, 0xf2f2f2, 0x1d1f23] },
  usb:  { from: [[-4.96, 30.7, -9.4], [-2.96, 30.7, -9.4], [-0.96, 30.7, -9.4], [1.04, 30.7, -9.4], [3.04, 30.7, -9.4], [5.04, 30.7, -9.4]], gf: 'pcb',
          to: [[-5.0, 23.07, -35.9], [-3.0, 23.07, -35.9], [-1.0, 23.07, -35.9], [1.0, 23.07, -35.9], [3.0, 23.07, -35.9], [5.0, 23.07, -35.9]], gt: 'base',
          via: [[0, 26, -22, 'pcb']], colors: [0x1d1f23, 0x2b9a4b, 0xf2f2f2, 0xe8c33a, 0x2f6fd0, 0xd23b3b] },
  ant:  { from: [[-6.0, 36.6, -30.0]], gf: 'pcb', to: [[10.0, 54.5, -48.1]], gt: 'base', via: [[0.0, 41.0, -43.5, 'pcb']], colors: [0x2a2c30], r: 0.56 }
};
var PCB_PIVOT = 40.8;
var LABELS = [
  { g: 'top', at: [30, 96, -30], stage: 1, t: T('Geborsteld aluminium', 'Brushed aluminium'), s: T('Top met uitgesneden logo', 'Top with cut-out logo') },
  { g: 'diff', at: [48, 71, 8], stage: 1, t: T('Opaal diffuser-ring', 'Opal diffuser ring'), s: T('licht rondom door de gleuf', 'light through the slot') },
  { g: 'base', at: [-50, 30, 14], stage: 1, t: T('Glanzend wit', 'Gloss white'), s: T('ventilatie langs de sensoren', 'airflow past the sensors') },
  { g: 'pcb', at: [0, 36.9, -22], stage: 2, t: 'ESP32-S3', s: 'WROOM-1U · Wi-Fi' },
  { g: 'pcb', at: [-17.0, 39.2, 35.9], stage: 2, t: 'ENS160', s: 'VOC · eCO₂' },
  { g: 'pcb', at: [17.0, 39.4, 35.7], stage: 2, t: 'SHT40', s: T('temperatuur · RV', 'temperature · RH') },
  { g: 'pcb', at: [7.7, 39.0, 0], stage: 2, t: 'CH224K', s: 'USB-C Power Delivery' },
  { g: 'pcb', at: [-6, 37.4, -30.1], stage: 2, t: 'U.FL', s: T('externe antenne', 'external antenna') },
  { g: 'diff', at: [-49.5, 71.4, 6], stage: 3, t: T('35 × WS2812B → diffuser', '35 × WS2812B → diffuser'), s: T('ademgolf rondom de gleuf', 'breathing wave around the slot') },
  { g: 'top', at: [0, 96.5, 0], stage: 3, t: T('Logo-LED', 'Logo LED'), s: T('volgt de ringkleur', 'follows the ring colour') }
];

export async function init(root) {
  var mode = root.dataset.mode || 'explode';
  var holder = root.querySelector('.xp-canvas'), canvas = holder.querySelector('canvas');
  var rows = Array.prototype.slice.call(root.querySelectorAll('.xp-row'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = innerWidth < 900;

  /* ---------- overlays: labels, firmware-paneel ---------- */
  var ui = document.createElement('div'); ui.className = 'xp-ui'; holder.appendChild(ui);
  var labelEls = LABELS.map(function (l) {
    if (mode === 'pcb' && l.g !== 'pcb') return null;
    if (mode === 'device' && l.stage !== 3) return null;
    if (mode === 'shell' && l.stage !== 1) return null;
    var el = document.createElement('div'); el.className = 'xp-label';
    el.innerHTML = '<i></i><em></em><span><b>' + l.t + '</b><small>' + l.s + '</small></span>';
    ui.appendChild(el); return el;
  });
  var fw = document.createElement('div'); fw.className = 'xp-fw';
  fw.innerHTML =
    '<div class="xp-fw-head"><span class="xp-dot"></span><b data-st></b><span class="mono" data-co2></span></div>' +
    '<pre class="xp-code mono" aria-hidden="true"></pre>' +
    '<div class="xp-chips" role="group" aria-label="' + T('Probeer een luchtkwaliteit', 'Try an air quality') + '">' +
    Object.keys(STATUS).map(function (k) { return '<button type="button" data-k="' + k + '"><i style="background:rgb(' + STATUS[k].rgb.join(',') + ')"></i>' + STATUS[k][EN ? 'en' : 'nl'] + '</button>'; }).join('') +
    '</div><p class="xp-tip">' + (fine ? T('Tip: kom met de muis dicht bij het apparaat en je adem laat de CO₂ stijgen.', 'Tip: move your mouse close to the device and your breath raises the CO₂.') : T('Tip: tik op het apparaat om erop te ademen.', 'Tip: tap the device to breathe on it.')) + '</p>';
  ui.appendChild(fw);
  var fwLink = document.createElement('div'); fwLink.className = 'xp-fwlink'; fwLink.innerHTML = '<i></i>'; ui.insertBefore(fwLink, fw);
  var fwHead = document.createElement('span'); fwHead.className = 'xp-fw-mcu mono'; fw.querySelector('.xp-fw-head').insertBefore(fwHead, fw.querySelector('[data-st]'));
  var fwSt = fw.querySelector('[data-st]'), fwCo2 = fw.querySelector('[data-co2]'), fwCode = fw.querySelector('.xp-code');
  var override = null, overrideUntil = 0;
  fw.querySelectorAll('button').forEach(function (b) {
    b.addEventListener('click', function () { override = b.dataset.k; overrideUntil = performance.now() + 9000; kick(); });
  });

  /* ---------- renderer en licht ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.35 : 2)); // telefoon: minder pixels, dan houdt hij 60 fps vol tijdens scrollen
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = small ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  var scene = new THREE.Scene();
  scene.background = studioTexture();
  var pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.6;
  var key = new THREE.DirectionalLight(0xffffff, 1.45); key.position.set(90, 260, 140); key.castShadow = true;
  key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; key.shadow.radius = 6;
  var sc = key.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 10; sc.far = 600;
  scene.add(key, key.target);
  var rim = new THREE.DirectionalLight(0x8fd3ff, 1.2); rim.position.set(-180, 90, -160); scene.add(rim);
  var ringLight = new THREE.PointLight(0x37c6ff, 0, 160, 1.4); scene.add(ringLight);
  var camera = new THREE.PerspectiveCamera(28, 1, 1, 4000);
  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.42, 0.28, 3.2);
  composer.addPass(bloom); composer.addPass(new OutputPass());
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.ShadowMaterial({ opacity: 0.5 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  var floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false }));
  floorGlow.rotation.x = -Math.PI / 2; floorGlow.position.y = 0.2; scene.add(floorGlow);

  /* ---------- model ---------- */
  var gltf = await loadModel(new GLTFLoader());
  var texLoader = new THREE.TextureLoader();
  var aniso = renderer.capabilities.getMaxAnisotropy();
  function pcbTex(url) { var t = texLoader.load(url); t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; }
  var brushed = brushedTexture();
  var product = new THREE.Group(); scene.add(product);
  var groups = { base: new THREE.Group(), pcb: new THREE.Group(), ring: new THREE.Group(), diff: new THREE.Group(), top: new THREE.Group() };
  var pcbFlip = new THREE.Group(); pcbFlip.position.y = PCB_PIVOT; groups.pcb.add(pcbFlip);
  Object.keys(groups).forEach(function (k) { product.add(groups[k]); });
  var ledLensGeo = null, ledLensMatrix = null, logoMats = [], diffRing = null, logoDiff = null, hiMats = [[], []];
  var meshes = [];
  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(function (o) { if (o.isMesh) meshes.push(o); });
  meshes.forEach(function (o) {
    var parts = (o.name || '').split('|'), g = groups[parts[0]] ? parts[0] : 'base', mname = parts[1] || '';
    o.geometry.computeVertexNormals();
    var m = o.material;
    if (mname === 'pcb_top' || mname === 'pcb_bottom') {
      m.map = pcbTex(mname === 'pcb_top' ? TEX.top : TEX.bot);
      m.color.set(0xc8c8c8); m.roughness = 0.82; m.metalness = 0.0; m.envMapIntensity = 0.06; m.userData.board = true; // verzadigd groen, geen vale omgevingsreflectie
    }
    if (mname === 'enclosure') {
      m = new THREE.MeshPhysicalMaterial({ color: 0xe6e7e4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, emissive: new THREE.Color(0x229dd8), emissiveIntensity: 0 });
      hiMats[0].push(m);
    } else if (mname === 'enclosure_top') {
      cylUV(o.geometry);
      m = new THREE.MeshPhysicalMaterial({ color: 0xa9aeb5, metalness: 0.9, roughness: 0.62, roughnessMap: brushed, anisotropy: 0.35, emissive: new THREE.Color(0x229dd8), emissiveIntensity: 0 });
      hiMats[0].push(m);
    } else if (mname === 'diffuser_ring') {
      cylUV(o.geometry, true);
      m = new THREE.MeshPhysicalMaterial({ color: 0x9aa1a8, roughness: 0.6, sheen: 0.3, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0 });
      diffRing = m;
    } else if (mname === 'diffuser') {
      m = new THREE.MeshStandardMaterial({ color: 0x30363d, roughness: 0.9, emissive: new THREE.Color(0x37c6ff), emissiveIntensity: 0 }); logoDiff = m;
    } else if (mname === 'led_lens') { ledLensGeo = o.geometry; ledLensMatrix = o.matrixWorld.clone(); o.visible = false; }
    else if (mname === 'led_lens_logo') { m = m.clone(); m.emissive = new THREE.Color(0x37c6ff); logoMats.push(m); }
    else if (g === 'pcb' || g === 'ring') { m = m.clone(); if (!m.userData.board) { m.roughness = Math.max(m.roughness, 0.68); m.metalness = Math.min(m.metalness, 0.35); m.envMapIntensity = 0.6; } /* geen glinstering op kleine onderdelen */ m.emissive = new THREE.Color(0x229dd8); m.emissiveIntensity = 0; hiMats[1].push(m); }
    o.material = m; o.castShadow = true; o.receiveShadow = g !== 'pcb' && g !== 'ring'; // geen schaduwflikkering op de bewegende print
    var wm = o.matrixWorld.clone();
    o.removeFromParent();
    if (g === 'pcb') { wm.premultiply(new THREE.Matrix4().makeTranslation(0, -PCB_PIVOT, 0)); pcbFlip.add(o); } else groups[g].add(o);
    wm.decompose(o.position, o.quaternion, o.scale);
  });

  /* ---------- ring-LEDs ---------- */
  var ledCenters = [];
  if (ledLensGeo) {
    var pa = ledLensGeo.attributes.position, v3 = new THREE.Vector3();
    for (var i = 0; i < pa.count; i++) {
      v3.fromBufferAttribute(pa, i).applyMatrix4(ledLensMatrix);
      var c = null;
      for (var j = 0; j < ledCenters.length; j++) if (Math.hypot(ledCenters[j].x - v3.x, ledCenters[j].z - v3.z) < 2.6) { c = ledCenters[j]; break; }
      if (!c) { c = { x: v3.x, y: v3.y, z: v3.z, n: 0 }; ledCenters.push(c); }
      c.x = (c.x * c.n + v3.x) / (c.n + 1); c.y = Math.max(c.y, v3.y); c.z = (c.z * c.n + v3.z) / (c.n + 1); c.n++;
    }
    ledCenters.forEach(function (c) { c.a = Math.atan2(c.z, c.x); });
    ledCenters.sort(function (a, b) { return a.a - b.a; });
  }
  var NL = Math.max(1, ledCenters.length);
  var leds = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.8, 1.8, 0.25, 16), new THREE.MeshBasicMaterial({ toneMapped: false }), NL);
  var halo = new THREE.InstancedMesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), NL);
  var dummy = new THREE.Object3D(), tmpC = new THREE.Color();
  ledCenters.forEach(function (c, i) {
    dummy.position.set(c.x, c.y + 0.1, c.z); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); leds.setMatrixAt(i, dummy.matrix);
    dummy.position.y += 0.5; dummy.rotation.set(-Math.PI / 2, 0, 0); dummy.updateMatrix(); halo.setMatrixAt(i, dummy.matrix);
    leds.setColorAt(i, tmpC.set(0)); halo.setColorAt(i, tmpC.set(0));
  });
  leds.count = halo.count = ledCenters.length;
  groups.ring.add(leds, halo);
  // gloed in de diffuser-ring: 1D-textuur rond de omtrek die de golf volgt
  var waveData = new Uint8Array(128 * 4), waveTex = new THREE.DataTexture(waveData, 128, 1);
  waveTex.colorSpace = THREE.SRGBColorSpace; waveTex.wrapS = THREE.RepeatWrapping; waveTex.magFilter = THREE.LinearFilter; waveTex.needsUpdate = true;
  if (diffRing) { diffRing.emissiveMap = waveTex; diffRing.needsUpdate = true; }
  // lichtval: een zachte gekleurde rand vlak buiten de gleuf (volgt de golf) en een halo boven het logo
  var slotGlow = new THREE.Mesh(new THREE.CylinderGeometry(51.4, 51.4, 16, 128, 1, true),
    new THREE.MeshBasicMaterial({ map: waveTex, alphaMap: bandTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.FrontSide }));
  slotGlow.geometry.translate(0, 71.5, 0); slotGlow.rotation.y = Math.PI / 2; groups.diff.parent.add(slotGlow);
  var logoGlow = new THREE.Mesh(new THREE.PlaneGeometry(46, 46), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  logoGlow.rotation.x = -Math.PI / 2; logoGlow.position.y = 98.4; groups.top.add(logoGlow);

  /* ---------- luchtstroom: binnen door de sleuven onderin, langs de sensoren, eruit door het logo ---------- */
  var NA = small ? 90 : 160, air = new Float32Array(NA * 3), airSeed = [];
  for (var ai = 0; ai < NA; ai++) airSeed.push({ t: Math.random(), a: Math.random() * Math.PI * 2, y: 10 + Math.random() * 20, s: 0.6 + Math.random() * 0.8 });
  var airGeo = new THREE.BufferGeometry(); airGeo.setAttribute('position', new THREE.BufferAttribute(air, 3));
  var airA = new Float32Array(NA); airGeo.setAttribute('alpha', new THREE.BufferAttribute(airA, 1));
  var airMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uOp: { value: 0 }, uSize: { value: (small ? 26 : 34) * renderer.getPixelRatio() } },
    vertexShader: 'attribute float alpha; varying float vA; uniform float uSize; void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * 60.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; uniform float uOp; void main(){ float d = length(gl_PointCoord - 0.5); float f = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(0.72, 0.9, 1.0, f * vA * uOp); }' });
  var airPts = new THREE.Points(airGeo, airMat); airPts.frustumCulled = false; scene.add(airPts);
  function airflow(now, dt, op) {
    airMat.uniforms.uOp.value = op; airPts.visible = op > 0.01; if (!airPts.visible) return;
    for (var i = 0; i < NA; i++) {
      var q = airSeed[i]; q.t = (q.t + dt * 0.00011 * q.s) % 1;
      var t = q.t, x, y, z, al = 0;
      if (t < 0.42) { // naar binnen, naar een ventilatiesleuf
        var k = t / 0.42, rr = lerp(74, 50, k); x = Math.cos(q.a) * rr; z = Math.sin(q.a) * rr; y = q.y + Math.sin(k * 3 + q.a) * 0.8;
        al = Math.sin(k * Math.PI) * 0.9;
      } else if (t < 0.7) { x = 0; y = -999; z = 0; } // binnen: niet te zien
      else { // omhoog uit het logo, waaiert iets uit
        var k2 = (t - 0.7) / 0.3, rr2 = lerp(4, 22, k2) * (0.4 + 0.6 * ((q.a * 7) % 1)); x = Math.cos(q.a * 3) * rr2; z = Math.sin(q.a * 3) * rr2; y = 99 + k2 * 55;
        al = Math.sin(k2 * Math.PI) * 0.8;
      }
      air[i * 3] = x; air[i * 3 + 1] = y; air[i * 3 + 2] = z; airA[i] = al;
    }
    airGeo.attributes.position.needsUpdate = true; airGeo.attributes.alpha.needsUpdate = true;
  }

  /* ---------- datapulsen: sensoren -> ESP32 -> LED-ring (alleen in de open firmware-stap) ---------- */
  var NP = 24, pPos = new Float32Array(NP * 3), pAl = new Float32Array(NP), pCol = new Float32Array(NP * 3);
  var pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('alpha', new THREE.BufferAttribute(pAl, 1)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
  var pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, uniforms: { uSize: { value: 60 * renderer.getPixelRatio() } },
    vertexShader: 'attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float uSize; void main(){ vA = alpha; vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = uSize * 60.0 / -mv.z; gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); float f = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC * (1.0 + 2.0 * smoothstep(0.25, 0.0, d)), f * vA); }' });
  var pPts = new THREE.Points(pGeo, pMat); pPts.frustumCulled = false; pPts.renderOrder = 5; scene.add(pPts);
  var pv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], P_SENS = [[-17.0, 39.2, 35.9], [17.0, 39.4, 35.7]], P_MCU = [0, 36.9, -22];
  function onPcb(a, out) { return out.set(a[0], a[1] - PCB_PIVOT - 1.5, a[2]).applyMatrix4(pcbFlip.matrixWorld); }
  function pulses(now, dt, op) {
    pPts.visible = op > 0.01; if (!pPts.visible) return;
    var mcu = onPcb(P_MCU, pv[0]);
    var ringPt = pv[1].set(-30, 68.4, -33).applyMatrix4(groups.ring.matrixWorld);
    for (var i = 0; i < NP; i++) {
      var t = ((now / 1600) + i / NP * 3) % 1, a, b, c, col;
      if (i % 3 === 2) { // ESP32 -> ring (statuskleur)
        a = mcu; b = ringPt; c = pv[2].copy(a).lerp(b, 0.5); c.y += 30; col = aq;
      } else {            // sensor -> ESP32
        a = onPcb(P_SENS[i % 3], pv[3]); b = mcu; c = pv[2].copy(a).lerp(b, 0.5); c.y += 6; col = tmpC.set(0x8fe3ff);
      }
      var u = 1 - t, x = u * u * a.x + 2 * u * t * c.x + t * t * b.x, y = u * u * a.y + 2 * u * t * c.y + t * t * b.y, z = u * u * a.z + 2 * u * t * c.z + t * t * b.z;
      pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pAl[i] = op * Math.sin(t * Math.PI);
      pCol[i * 3] = col.r; pCol[i * 3 + 1] = col.g; pCol[i * 3 + 2] = col.b;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.alpha.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  /* ---------- kabels ---------- */
  var cableMeshes = [];
  Object.keys(CABLES).forEach(function (k) {
    var c = CABLES[k];
    c.from.forEach(function (f, i) {
      var mesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: c.colors[i % c.colors.length], roughness: 0.45, transparent: true }));
      mesh.castShadow = true; product.add(mesh); cableMeshes.push({ c: c, i: i, mesh: mesh });
    });
  });
  var V = THREE.Vector3;
  function off(g) { return groups[g].position.y; }
  function updateCables(alpha) {
    cableMeshes.forEach(function (cm) {
      cm.mesh.visible = alpha > 0.01; cm.mesh.material.opacity = alpha;
      if (!cm.mesh.visible) return;
      var c = cm.c, i = cm.i, f = c.from[i], t = c.to[i], n = c.from.length, spread = (i - (n - 1) / 2) * 0.9;
      var a = new V(f[0], f[1] + off(c.gf), f[2]), b = new V(t[0], t[1] + off(c.gt), t[2]);
      var up = f[1] > 45 ? 1 : -1;
      var pts = [a, a.clone().add(new V(0, 4 * up, 0))];
      (c.via || []).forEach(function (v) { pts.push(new V(v[0] + spread, v[1] + off(v[3]), v[2])); });
      pts.push(b.clone().add(new V(0, c.gt === 'base' ? 5 : -4, 0)), b);
      var key = pts.map(function (q) { return q.x.toFixed(2) + ',' + q.y.toFixed(2) + ',' + q.z.toFixed(2); }).join(';');
      if (key === cm.key) return; cm.key = key;
      var tg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 40, c.r || 0.48, 6, false), g = cm.mesh.geometry;
      if (g.attributes.position && g.attributes.position.count === tg.attributes.position.count) {
        g.attributes.position.array.set(tg.attributes.position.array); g.attributes.position.needsUpdate = true;
        g.attributes.normal.array.set(tg.attributes.normal.array); g.attributes.normal.needsUpdate = true;
        g.computeBoundingSphere(); tg.dispose();
      } else { g.dispose(); cm.mesh.geometry = tg; }
    });
  }

  /* ---------- overlay in WebGL: stipjes, aansluitlijnen en firmwarelijn worden in hetzelfde beeld als het model
     getekend. Als HTML liepen ze op telefoons bij doorschieten net een beeld voor of achter en leken ze te trillen. ---------- */
  var ovScene = new THREE.Scene(), ovCam = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  var CYAN = new THREE.Color(0x6cc8f2), glowTex = radialTexture();
  var dotGeo = new THREE.CircleGeometry(1, 24), lineGeo = new THREE.PlaneGeometry(1, 1); lineGeo.translate(0.5, 0, 0);
  function ovMat(add) { return new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false, map: add ? glowTex : null, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending }); }
  var ovLabels = labelEls.map(function (el) {
    if (!el) return null;
    var g = new THREE.Group(), line = new THREE.Mesh(lineGeo, ovMat()), glow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), ovMat(true)),
        halo = new THREE.Mesh(dotGeo, ovMat()), dot = new THREE.Mesh(dotGeo, ovMat());
    halo.scale.setScalar(8); dot.scale.setScalar(4);
    line.renderOrder = 0; glow.renderOrder = 1; halo.renderOrder = 2; dot.renderOrder = 3;
    g.add(line, glow, halo, dot); g.visible = false; ovScene.add(g);
    return { g: g, line: line, parts: [[line, 0.65], [glow, 0.6], [halo, 0.22], [dot, 1]] };
  });
  var fwMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uLen: { value: 1 }, uT: { value: 0 }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uLen, uT, uA; varying vec2 vUv;\n' +
      'void main() {\n' +
      '  float x = vUv.x * uLen, dist = abs(vUv.y - 0.5) * 16.0;\n' +                       // px vanaf de hartlijn
      '  float base = mix(0.9, 0.25, vUv.x);\n' +                                             // sterk bij de chip, zwak bij het paneel
      '  float d = mod(x - uT * 28.9, 26.0), dash = step(10.0, d) * step(d, 16.0);\n' +       // datapakketjes die naar het paneel lopen
      '  float core = 1.0 - smoothstep(1.0, 1.9, dist), glow = exp(-dist * dist / 14.0) * 0.55;\n' +
      '  vec3 col = mix(vec3(0.424, 0.784, 0.949), vec3(1.0), dash * core * 0.95);\n' +
      '  float a = max(base, dash * 0.95) * core + glow * base;\n' +
      '  gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uA);\n' +
      '}'
  });
  var fwMesh = new THREE.Mesh(lineGeo, fwMat); fwMesh.visible = false; fwMesh.renderOrder = -1; ovScene.add(fwMesh);

  /* ---------- formaat ---------- */
  var W = 1, H = 1, look = new V(0, 50, 0);
  function fit() { W = holder.clientWidth || 1; H = holder.clientHeight || 1; renderer.setSize(W, H, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); ovCam.right = W; ovCam.bottom = -H; ovCam.updateProjectionMatrix(); }
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(function () { fit(); kick(); }).observe(holder);

  /* ---------- interactie: muis draait mee, dichtbij het apparaat "adem" je erop ---------- */
  var pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9, py: -9, inside: false }, hover = -1, glowHi = [0, 0, 0];
  holder.addEventListener('pointermove', function (e) {
    var r = holder.getBoundingClientRect();
    pointer.px = (e.clientX - r.left) / r.width; pointer.py = (e.clientY - r.top) / r.height; pointer.inside = true;
    if (fine && !reduce) { pointer.tx = pointer.px - 0.5; pointer.ty = pointer.py - 0.5; }
  });
  holder.addEventListener('pointerleave', function () { pointer.tx = 0; pointer.ty = 0; pointer.inside = false; });
  var breathBoost = 0;
  holder.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' && !e.target.closest('button')) breathBoost = Math.min(900, breathBoost + 420); });
  rows.forEach(function (row, i) {
    var on = function () { hover = i; root.classList.add('is-hovering'); }, out = function () { hover = -1; root.classList.remove('is-hovering'); };
    row.addEventListener('pointerenter', on); row.addEventListener('pointerleave', out); row.addEventListener('focus', on); row.addEventListener('blur', out);
  });

  /* ---------- firmware-toestand ---------- */
  var fwState = { disp: [0, 200, 200], phase: 0, speed: 12, minB: 70, density: 1, status: 'good', since: 0, co2: 640 };
  var lastTime = performance.now(), lastUI = 0;
  function firmware(now, dt) {
    // gesimuleerde ruimte: CO2 loopt rustig op en af; adem van de bezoeker telt mee
    var base = 560 + 420 * (0.5 + 0.5 * Math.sin(now / 9000)) + 160 * Math.sin(now / 3100);
    var near = pointer.inside && fine ? Math.hypot(pointer.px - 0.5, (pointer.py - 0.5) * 0.8) : 9;
    if (near < 0.22) breathBoost = Math.min(1100, breathBoost + dt * 0.55); else breathBoost = Math.max(0, breathBoost - dt * 0.12);
    var co2 = base + breathBoost;
    if (override && now < overrideUntil) co2 = { excellent: 480, good: 820, moderate: 1300, poor: 1750 }[override];
    else override = null;
    fwState.co2 += (co2 - fwState.co2) * Math.min(1, dt / 600);
    var st = statusFor(fwState.co2);
    if (st !== fwState.status && now - fwState.since > 1500) { fwState.status = st; fwState.since = now; } // korte verblijftijd (firmware: 15 s)
    var tgt = STATUS[fwState.status].rgb, k = 1 - Math.pow(1 - 6 / 255, dt / 50);   // nblend(.., LED_FADE_STEP) per 50 ms
    for (var c = 0; c < 3; c++) fwState.disp[c] += (tgt[c] - fwState.disp[c]) * k;
    fwState.phase = (fwState.phase + 0.2125 * fwState.speed * dt / 50) % 256;      // ledWavePhase += 0.2125f * speed
  }
  function ledLevel(i, n) { // cubicwave8(beat + i * pixelPhaseStep) -> map(.., minBright, 255)
    var w = cubicwave8(Math.floor(fwState.phase + i * (255 / n) * fwState.density));
    return (fwState.minB + (255 - fwState.minB) * w / 255) / 255;
  }

  /* ---------- animatie ---------- */
  var forced = parseFloat(new URLSearchParams(location.search).get('xp')); // alleen voor testen: ?xp=0.5
  var p = mode !== 'explode' ? 0 : reduce ? 1 : (forced >= 0 ? forced : 0), visible = true, running = false, lastKey = '';
  function target() {
    if (mode !== 'explode') return 0;
    if (reduce) return 1;
    if (forced >= 0) return forced;
    // vaste schermhoogte (hoogte van het sticky vlak, 100svh): de adresbalk op telefoons laat innerHeight verspringen
    var stage = root.querySelector('.xp-stage'), vh = (stage && stage.offsetHeight) || innerHeight;
    var r = root.getBoundingClientRect(), span = r.height - vh;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 1;
  }
  var proj = new V(), aq = new THREE.Color(), lin = new THREE.Color(), cam = { init: false, dist: 0, ly: 0, sx: 0, elev: 0 };
  var onlyPcbMode = mode === 'pcb';
  function apply(now, dt) {
    var onlyPcb = onlyPcbMode;
    var e0 = 1, e1, e2, flip, e3, fwd = 0, fwOpen = 0, fwSeen = 0;
    if (mode === 'explode') {
      e0 = ease(seg(p, 0, 0.08));                 // van bovenaf (logo) naar 3D
      var r = seg(p, 0.79, 0.97);                 // direct na de firmware weer in elkaar, in omgekeerde volgorde
      e1 = ease(seg(p, 0.08, 0.2)) * (1 - ease(seg(r, 0.78, 1)));
      e2 = ease(seg(p, 0.19, 0.3)) * (1 - ease(seg(r, 0.56, 0.84)));
      fwd = ease(seg(p, 0.28, 0.36)) * (1 - ease(seg(r, 0.32, 0.6)));
      flip = ease(seg(p, 0.34, 0.44)) * (1 - ease(seg(r, 0, 0.36)));
      fwSeen = ease(seg(p, 0.56, 0.6));          // vanaf de firmware geen print-labels meer
      fwOpen = fwSeen * (1 - ease(seg(p, 0.77, 0.81))); // firmware terwijl alles open ligt
      e3 = ease(seg(p, 0.95, 0.99));              // dicht product licht op
    }
    else if (mode === 'pcb') { e1 = 1; e2 = 1; flip = 1; e3 = 0; fwd = 0; }
    else if (mode === 'shell') { e1 = 0.55 + 0.05 * Math.sin(now / 2400); e2 = 0; flip = 0; e3 = 0; }
    else { e1 = 0; e2 = 0; flip = 0; e3 = 1; }
    var float = reduce ? 0 : Math.sin(now / 1700) * 0.7;
    groups.top.position.y = 104 * e1 + float * 1.2;
    groups.ring.position.y = 72 * e2 + float * 0.8;
    groups.diff.position.y = 30 * e1 + 58 * e2 + float * 1.0;
    groups.pcb.position.y = 44 * e2 + float * 0.4;
    // print omdraaien en naar de kijker kantelen, zodat de componentenzijde in beeld komt
    var camYaw = -0.55 + (mode === 'explode' ? p * 1.0 : (reduce ? 0 : now / 9000)) + pointer.x * 0.7;
    // omdraaien om de kijkrichting (dan staat de opdruk rechtop), daarna naar de kijker kantelen
    var axis = new V(Math.cos(camYaw), 0, -Math.sin(camYaw)), toCam = new V(Math.sin(camYaw), 0, Math.cos(camYaw));
    var qFlip = new THREE.Quaternion().setFromAxisAngle(toCam, Math.PI * flip);
    var qTilt = new THREE.Quaternion().setFromAxisAngle(axis, (onlyPcbMode ? 0.55 : 0.95) * flip);
    pcbFlip.quaternion.copy(qTilt.multiply(qFlip));
    var fwdMm = 108 * fwd; // eerst vrij van de stapel naar voren, dan pas omdraaien
    groups.pcb.position.y += 34 * fwd;
    groups.pcb.position.x = Math.sin(camYaw) * fwdMm; groups.pcb.position.z = Math.cos(camYaw) * fwdMm;
    groups.base.visible = groups.ring.visible = groups.top.visible = groups.diff.visible = !onlyPcb;
    floorGlow.visible = !onlyPcb;
    updateCables(onlyPcb ? 0 : clamp(1 - fwd * 3, 0, 1));

    airflow(now, dt, onlyPcb ? 0 : 0.55 * (1 - Math.max(e1, e2)) * (mode === 'shell' ? 0 : 1));
    // firmware -> LEDs, diffuser-ring, logo
    firmware(now, dt);
    var d = fwState.disp; aq.setRGB(d[0] / 255, d[1] / 255, d[2] / 255, THREE.SRGBColorSpace);
    var sum = 0;
    for (var i = 0; i < ledCenters.length; i++) {
      var lv = ledLevel(i, ledCenters.length); sum += lv;
      leds.setColorAt(i, lin.copy(aq).multiplyScalar(lv * 9.0)); halo.setColorAt(i, tmpC.copy(aq).multiplyScalar(lv * 0.35));
    }
    if (ledCenters.length) { leds.instanceColor.needsUpdate = true; halo.instanceColor.needsUpdate = true; }
    var mean = sum / Math.max(1, ledCenters.length);
    for (var u = 0; u < 128; u++) { // golf rond de omtrek in de diffuser-ring, in fase met de LEDs
      var lv2 = ledLevel((u / 128) * ledCenters.length, ledCenters.length);
      waveData[u * 4] = d[0] * lv2; waveData[u * 4 + 1] = d[1] * lv2; waveData[u * 4 + 2] = d[2] * lv2; waveData[u * 4 + 3] = 255;
    }
    waveTex.needsUpdate = true;
    // de diffuser geeft alleen licht als de LED-ring er vlak onder zit
    var gapMm = Math.abs((groups.diff.position.y + 68.4) - (groups.ring.position.y + 68.1));
    if (diffRing) var prox = clamp(1 - gapMm / 9, 0, 1); diffRing.emissiveIntensity = 1.7 * prox;
    slotGlow.visible = !onlyPcb; slotGlow.material.opacity = 0.5 * prox; slotGlow.position.y = groups.diff.position.y; logoGlow.material.color.copy(aq); logoGlow.material.opacity = 0.55 * mean * (1 - 0.6 * e1);
    if (logoDiff) { logoDiff.emissive.copy(aq); logoDiff.emissiveIntensity = 2.4 * mean; }
    logoMats.forEach(function (m) { m.emissive.copy(aq); m.emissiveIntensity = 3.0 * mean; });
    ringLight.color.copy(aq); ringLight.intensity = 260 * mean * (0.35 + 0.65 * e2); ringLight.position.set(0, 72 + groups.ring.position.y, 0);
    floorGlow.material.color.copy(aq); floorGlow.material.opacity = 0.08 * mean;

    // camera
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    var auto = mode === 'explode' || reduce ? 0 : now / 9000;
    var yaw = camYaw;
    var elev = (onlyPcb ? 0.62 : mode === 'device' ? 0.5 : lerp(1.45, lerp(0.36, 0.5, e2) + 0.16 * e3, e0)) + pointer.y * 0.18 * e0;
    var stackTop = 98 + Math.max(groups.top.position.y, groups.pcb.position.y + 40 * flip), stackBot = -3;
    var spanH = onlyPcb ? 86 : mode === 'device' ? 150 : mode === 'shell' ? 168 : lerp(150, (stackTop - stackBot) * 1.06 + 8, e0);
    var t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var dist = Math.max(spanH * 0.55 / t, (onlyPcb ? 112 : 128) * 0.62 / (t * camera.aspect)) + fwd * 70 + fwOpen * (W < 620 ? 60 : 16);
    if (W < 620) dist *= lerp(1.22, 1, e0); // smal scherm: in het beginbeeld ruim marge rond de Top
    var ly = onlyPcb ? 84 : mode === 'device' ? 50 : mode === 'shell' ? 78 : lerp(98, (stackTop + stackBot) / 2, e0);
    // met het firmware-paneel ernaast schuift het product iets opzij (breed) of omhoog (smal)
    var fwSpace = (mode === 'explode' ? fwOpen : mode === 'device' ? 1 : 0), narrow = W < 620;
    var sideX = narrow ? 0 : 34 * fwSpace, sideY = narrow ? (mode === 'device' ? -12 : -46) * fwSpace : 0;
    // camera volgt gedempt: zoomen gaat altijd vloeiend, ook als je snel scrolt
    var k = cam.init ? 1 - Math.exp(-dt / 420) : 1; cam.init = true;
    cam.dist += (dist - cam.dist) * k; cam.ly += (ly + sideY - cam.ly) * k; cam.sx += (sideX - cam.sx) * k; cam.elev += (elev - cam.elev) * k;
    dist = cam.dist; elev = cam.elev;
    look.set(Math.cos(camYaw) * cam.sx, cam.ly, -Math.sin(camYaw) * cam.sx);
    holder.classList.toggle('is-narrow', narrow);
    camera.position.set(look.x + Math.sin(yaw) * Math.cos(elev) * dist, look.y + Math.sin(elev) * dist, look.z + Math.cos(yaw) * Math.cos(elev) * dist);
    camera.lookAt(look);
    key.target.position.copy(look); key.target.updateMatrixWorld();

    // labels projecteren
    var stageVis = onlyPcb ? [0, 0, 1, 0] : mode === 'device' ? [0, 0, 0, 1] : mode === 'shell' ? [0, 1, 0, 0] : [0, clamp(e1 * 2 - 0.6, 0, 1) * (1 - e2) * (1 - fwSeen), clamp(flip * 2 - 1, 0, 1) * (1 - e3) * (1 - fwSeen), 0];
    product.updateMatrixWorld(true);
    var live = [];
    LABELS.forEach(function (l, i) {
      var el = labelEls[i]; if (!el) return;
      var a = stageVis[l.stage] || 0;
      if (a < 0.02) { el.style.opacity = 0; el._ty = null; if (ovLabels[i]) ovLabels[i].g.visible = false; return; }
      proj.set(l.at[0], l.at[1], l.at[2]);
      if (l.g === 'pcb') { proj.y -= PCB_PIVOT; proj.applyMatrix4(pcbFlip.matrixWorld); }
      else proj.applyMatrix4(groups[l.g].matrixWorld);
      proj.project(camera);
      live.push({ el: el, ov: ovLabels[i], a: a, x: (proj.x * 0.5 + 0.5) * W, y: (-proj.y * 0.5 + 0.5) * H });
    });
    if (live.length) {
      var cx = live.reduce(function (s, q) { return s + q.x; }, 0) / live.length;
      var reach = live.reduce(function (m, q) { return Math.max(m, Math.abs(q.x - cx)); }, 0) + (small ? 18 : 34);
      [-1, 1].forEach(function (side) {
        var col = live.filter(function (q) { return (q.x < cx) === (side < 0); }).sort(function (u, v) { return u.y - v.y; });
        var gap = small ? 30 : 50, last = -1e9;
        col.forEach(function (q) { q.ty = Math.max(q.y, last + gap); last = q.ty; });
        var over = last - (H - 20); if (over > 0) col.forEach(function (q) { q.ty -= over; });
        col.forEach(function (q) {
          // de kolomplek beweegt gedempt mee, zodat labels niet verspringen als de volgorde of het scherm verandert
          var k2 = q.el._ty == null ? 1 : 1 - Math.exp(-dt / 140); q.el._ty = q.el._ty == null ? q.ty : q.el._ty + (q.ty - q.el._ty) * k2; q.ty = q.el._ty;
          var bw = (q.bw = q.bw || q.el.lastChild.offsetWidth || 140) + 18;
          var tx = side > 0 ? Math.min(cx + reach, W - bw) : Math.max(cx - reach, bw), dx = tx - q.x, dy = q.ty - q.y;
          q.el.style.opacity = q.a.toFixed(3);
          q.el.style.transform = 'translate(' + q.x.toFixed(1) + 'px,' + q.y.toFixed(1) + 'px)';
          q.el.style.setProperty('--dx', dx.toFixed(1) + 'px'); q.el.style.setProperty('--dy', dy.toFixed(1) + 'px');
          q.el.style.setProperty('--len', Math.hypot(dx, dy).toFixed(1) + 'px'); q.el.style.setProperty('--ang', Math.atan2(dy, dx).toFixed(3) + 'rad');
          q.el.classList.toggle('is-left', side < 0);
          if (q.ov) {
            q.ov.g.visible = true; q.ov.g.position.set(q.x, -q.y, 0);
            q.ov.line.scale.set(Math.max(0.001, Math.hypot(dx, dy)), 1, 1); q.ov.line.rotation.z = -Math.atan2(dy, dx);
            q.ov.parts.forEach(function (pt) { pt[0].material.opacity = pt[1] * q.a; });
          }
        });
      });
    }
    var fwA = mode === 'explode' ? fwOpen : mode === 'device' ? 1 : 0; // firmware alleen als het product open ligt
    // firmware verbonden met de microcontroller: lijn van paneel naar de ESP32-S3 en datapulsen
    pulses(now, dt, fwOpen);
    if (fwOpen > 0.02) {
      proj.set(0, 36.9 - PCB_PIVOT, -22).applyMatrix4(pcbFlip.matrixWorld).project(camera);
      var mx = (proj.x * 0.5 + 0.5) * W, my = (-proj.y * 0.5 + 0.5) * H;
      var nar = holder.classList.contains('is-narrow');
      var px2 = nar ? fw.offsetLeft + fw.offsetWidth * 0.5 : fw.offsetLeft, py2 = nar ? fw.offsetTop : fw.offsetTop + 26;
      var ddx = px2 - mx, ddy = py2 - my;
      var flen = Math.hypot(ddx, ddy);
      fwMesh.visible = true; fwMesh.position.set(mx, -my, 0); fwMesh.rotation.z = -Math.atan2(ddy, ddx); fwMesh.scale.set(Math.max(0.001, flen), 16, 1);
      fwMat.uniforms.uLen.value = flen; fwMat.uniforms.uT.value = now / 1000; fwMat.uniforms.uA.value = fwOpen;
    } else fwMesh.visible = false;
    fwHead.textContent = fwOpen > 0.5 ? 'ESP32-S3 · ' : '';
    fw.style.opacity = fwA.toFixed(3); fw.style.pointerEvents = fwA > 0.5 ? 'auto' : 'none';
    if (fwA > 0.02 && now - lastUI > 250) {
      lastUI = now; var stn = STATUS[fwState.status];
      fwSt.textContent = stn[EN ? 'en' : 'nl']; fwCo2.textContent = Math.round(fwState.co2 / 5) * 5 + ' ppm eCO₂';
      fw.style.setProperty('--aq', 'rgb(' + d.map(Math.round).join(',') + ')');
      fwCode.innerHTML =
        '<span class="c">// updateLEDs() · Ventairo firmware</span>\n' +
        'status = <span class="s">"' + fwState.status + '"</span>;\n' +
        'target = <span class="n">' + HEX[fwState.status] + '</span>;\n' +
        'nblend(displayed, target, <span class="n">LED_FADE_STEP</span>);\n' +
        'phase += <span class="n">0.2125f</span> * <span class="n">12</span>;  <span class="c">// ' + Math.round(fwState.phase) + '/255</span>\n' +
        'leds[i].nscale8(map(cubicwave8(beat + i*<span class="n">7</span>), <span class="n">0</span>, <span class="n">255</span>, <span class="n">70</span>, <span class="n">255</span>));';
      fw.querySelectorAll('button').forEach(function (b) { b.classList.toggle('is-on', b.dataset.k === fwState.status); });
    }

    // legenda + hover
    var states = [e1 > 0.5, e2 > 0.5, fwSeen > 0.5], k = states.join();
    if (k !== lastKey) { lastKey = k; rows.forEach(function (r, i) { r.classList.toggle('is-on', states[i]); }); root.classList.toggle('is-open', p > 0.03); }
    for (var h = 0; h < 3; h++) glowHi[h] += ((hover === h ? 1 : 0) - glowHi[h]) * 0.15;
    hiMats[0].forEach(function (m) { m.emissiveIntensity = glowHi[0] * 0.1; });
    hiMats[1].forEach(function (m) { m.emissiveIntensity = glowHi[1] * 0.16; });
  }
  var minFrame = small ? 15.5 : 0; // telefoons met 90/120 Hz: vaste 60 fps, gelijkmatiger dan steeds een beeld missen
  function frame(now) {
    if (now - lastTime < minFrame) { requestAnimationFrame(frame); return; }
    var dt = Math.min(64, now - lastTime); lastTime = now;
    var tp = target(); p += (tp - p) * (reduce ? 1 : 1 - Math.pow(0.9, dt / 16.7));
    apply(now, dt); composer.render();
    renderer.autoClear = false; renderer.render(ovScene, ovCam); renderer.autoClear = true;
    if (visible) requestAnimationFrame(frame); else running = false; // de LEDs lopen altijd door zolang het in beeld is
  }
  function kick() { if (!running && visible) { running = true; lastTime = performance.now(); requestAnimationFrame(frame); } }
  new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) kick(); }, { rootMargin: '10% 0px' }).observe(root);
  if (forced >= 0) window.__vai = { diffRing: diffRing, logoDiff: logoDiff, fw: fwState, groups: groups, leds: ledCenters, scene: scene, renderer: renderer };
  root.classList.add('is-ready');
  kick();
}

/* ---------- laden: model als gzip (1,3 MB i.p.v. 2,9 MB), uitgepakt in de browser ---------- */
var SMALL = typeof innerWidth === 'number' && innerWidth < 900;
var TEX = SMALL ? { top: '/models/vai-one-pcb-top-1k.webp?v=1', bot: '/models/vai-one-pcb-bot-1k.webp?v=1' }
                : { top: '/models/vai-one-pcb-top.webp?v=1', bot: '/models/vai-one-pcb-bot.webp?v=1' };
var GLB_GZ = '/models/vai-one.glb.gz?v=1', GLB = '/models/vai-one.glb?v=6';
async function loadModel(loader) {
  if (typeof DecompressionStream === 'function') {
    try {
      var gz = await (window.__vaiGz || fetch(GLB_GZ).then(function (r) { if (!r.ok) throw r.status; return r.arrayBuffer(); })); // vooraf opgehaald door de pagina
      var buf = await new Response(new Blob([gz]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
      return await loader.parseAsync(buf, '');
    } catch (e) { /* valt terug op het gewone bestand */ }
  }
  return loader.loadAsync(GLB);
}

/* ---------- hulpjes ---------- */
function cylUV(geo, ring) {
  // UV's voor geborsteld metaal: bovenvlak planair (strepen in één richting), zijkant langs de omtrek
  var pos = geo.attributes.position, nor = geo.attributes.normal, uv = new Float32Array(pos.count * 2);
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i) * 0.01, y = pos.getY(i) * 0.01, z = pos.getZ(i) * 0.01, ny = nor.getY(i);
    if (!ring && Math.abs(ny) > 0.7) { uv[i * 2] = x / 110 + 0.5; uv[i * 2 + 1] = z / 110 + 0.5; }
    else { uv[i * 2] = (Math.atan2(z, x) + Math.PI) / (Math.PI * 2) * (ring ? 1 : 3); uv[i * 2 + 1] = y / 30; }
  }
  // naad bij 180 graden: een hoekpunt precies op de naad krijgt de waarde van de rest van zijn driehoek
  var per = ring ? 1 : 3, idx = geo.index;
  if (idx) for (var f = 0; f < idx.count; f += 3) {
    var a = idx.getX(f), b = idx.getX(f + 1), c = idx.getX(f + 2), us = [uv[a * 2], uv[b * 2], uv[c * 2]];
    if (Math.max.apply(null, us) - Math.min.apply(null, us) > per * 0.5) {
      [a, b, c].forEach(function (q) { if (uv[q * 2] < per * 0.5) uv[q * 2] += per; });
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function brushedTexture() {
  var c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  var g = c.getContext('2d'); g.fillStyle = 'rgb(215,215,215)'; g.fillRect(0, 0, 1024, 512);
  for (var i = 0; i < 5200; i++) {
    var y = Math.random() * 512, v = 180 + Math.random() * 70, a = 0.25 + Math.random() * 0.5;
    g.fillStyle = 'rgba(' + [v, v, v].map(function (q) { return q.toFixed(0); }).join(',') + ',' + a.toFixed(2) + ')'; g.fillRect(0, y, 1024, 0.5 + Math.random() * 0.9);
  }
  var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); t.anisotropy = 8;
  return t;
}
function studioTexture() {
  var c = document.createElement('canvas'); c.width = 512; c.height = 512;
  var g = c.getContext('2d'), r = g.createRadialGradient(256, 215, 0, 256, 256, 380);
  r.addColorStop(0, '#16345c'); r.addColorStop(0.45, '#0a1c36'); r.addColorStop(1, '#050d1b');
  g.fillStyle = r; g.fillRect(0, 0, 512, 512);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function bandTexture() {
  var c = document.createElement('canvas'); c.width = 4; c.height = 128;
  var g = c.getContext('2d'), r = g.createLinearGradient(0, 0, 0, 128);
  r.addColorStop(0, '#000'); r.addColorStop(0.42, '#555'); r.addColorStop(0.5, '#fff'); r.addColorStop(0.58, '#555'); r.addColorStop(1, '#000');
  g.fillStyle = r; g.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c);
}
function radialTexture() {
  var c = document.createElement('canvas'); c.width = c.height = 128;
  var g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.42)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
