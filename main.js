// ============ 2. BASIC SET-UP ============
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc98a78);
scene.fog = new THREE.Fog(0xc98a78, 30, 150);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 400);
camera.rotation.order = 'YXZ';
// Evening sky: a big ball around you, painted purple on top and orange at the horizon
const skyCanvas = document.createElement('canvas'); skyCanvas.width = 4; skyCanvas.height = 256;
const sg = skyCanvas.getContext('2d'), grad = sg.createLinearGradient(0, 0, 0, 256);
[[0, '#27325f'], [0.3, '#5d5596'], [0.48, '#e8946a'], [0.52, '#e8946a'], [1, '#b8705e']].forEach(([p, c]) => grad.addColorStop(p, c));
sg.fillStyle = grad; sg.fillRect(0, 0, 4, 256);
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16),
  new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(skyCanvas), side: THREE.BackSide, fog: false, depthWrite: false }));
sky.renderOrder = -1; scene.add(sky);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.prepend(renderer.domElement);
renderer.shadowMap.enabled = true;   // blocks now cast shadows, so nothing looks like it floats
renderer.autoClear = false;          // we draw the world first, then the hand on top
scene.add(new THREE.AmbientLight(0x8088c0, 0.6));   // cool evening light from the sky
const sunLight = new THREE.DirectionalLight(0xffb878, 0.95);   // warm low sun
sunLight.shadow.bias = -0.0008;
sunLight.position.set(45, 50, 95);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
Object.assign(sunLight.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 200 });
scene.add(sunLight);

// Your hand lives in its own tiny scene, so it never goes inside walls
const handScene = new THREE.Scene();
handScene.add(new THREE.AmbientLight(0xffffff, 0.8));
const handSun = new THREE.DirectionalLight(0xffffff, 0.6); handSun.position.set(1, 2, 1); handScene.add(handSun);
const handCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 10);
const hand = new THREE.Group();
const fist = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.35), new THREE.MeshLambertMaterial({ color: 0xc58c5c }));
fist.position.z = -0.1;
const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.5), new THREE.MeshLambertMaterial({ color: 0x1fa6a6 }));
sleeve.position.z = 0.3;
hand.add(fist, sleeve); handScene.add(hand);

// Tools you can hold: a pickaxe and an axe
const wood = new THREE.MeshLambertMaterial({ color: 0x8a6232 }), iron = new THREE.MeshLambertMaterial({ color: 0xb8c4c8 });
const part = (w, h, d, m, x, y, z) => { const p = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); p.position.set(x, y, z); return p; };
const tools = { pick: new THREE.Group(), axe: new THREE.Group(), shovel: new THREE.Group() };
for (const k in tools) {
  tools[k].add(part(0.05, 0.5, 0.05, wood, 0, 0.25, 0));     // the stick
  tools[k].position.set(0, 0.05, -0.25); tools[k].rotation.x = -0.4; hand.add(tools[k]);
}
tools.pick.add(part(0.36, 0.06, 0.06, iron, 0, 0.5, 0), part(0.06, 0.12, 0.06, iron, -0.18, 0.45, 0), part(0.06, 0.12, 0.06, iron, 0.18, 0.45, 0));
tools.axe.add(part(0.2, 0.18, 0.05, iron, 0.1, 0.45, 0));
tools.shovel.add(part(0.14, 0.24, 0.04, iron, 0, 0.55, 0));
function setTool(t) {
  tool = t; tools.pick.visible = t === 'pick'; tools.axe.visible = t === 'axe'; tools.shovel.visible = t === 'shovel';
  document.querySelectorAll('.slot[data-t]').forEach(s => s.style.outline = s.dataset.t === t ? '3px solid #fff' : '');
}

// ============ 3. TEXTURES (tiny 16x16 pixel pictures) ============
function mk(c) {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function pixelTex(rgb, spread, lines) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = (Math.random() - 0.5) * spread;
    let k = 1;
    if (lines === 'h' && y % 4 === 3) k = 0.8;   // plank lines
    if (lines === 'v' && x % 4 === 0) k = 0.85;  // log bark
    g.fillStyle = `rgb(${rgb.map(v => Math.max(0, Math.min(255, (v + d) * k)) | 0)})`;
    g.fillRect(x, y, 1, 1);
  }
  return mk(c);
}
function shelfTex() {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  g.fillStyle = '#8a6a3a'; g.fillRect(0, 0, 16, 16);
  const cols = ['#8b2d2d', '#2d5f8b', '#3d7a3d', '#c9a227', '#5b3a8b', '#d8d8d8'];
  [1, 8].forEach(y => {            // two rows of books, each book 2-3 pixels wide
    for (let x = 0; x < 16;) {
      const w = 2 + Math.floor(Math.random() * 2), h = 4 + Math.floor(Math.random() * 3);
      g.fillStyle = cols[Math.floor(Math.random() * cols.length)];
      g.fillRect(x, y + 6 - h, w, h);
      g.fillStyle = '#00000050'; g.fillRect(x + w - 1, y + 6 - h, 1, h);   // dark edge between books
      x += w;
    }
  });
  g.fillStyle = '#5a4020'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 7, 16, 1); g.fillRect(0, 14, 16, 2);   // shelf boards
  return mk(c);
}
function noise(g, rgb, spread) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    g.fillStyle = `rgb(${rgb.map(v => (v + (Math.random() - 0.5) * spread) | 0)})`; g.fillRect(x, y, 1, 1);
  }
}
function doorTex() {   // 16 x 48 pixels: one door leaf
  const c = document.createElement('canvas'); c.width = 16; c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = '#8a6232'; g.fillRect(0, 0, 16, 48);
  g.fillStyle = '#5e3f1b'; g.fillRect(0, 0, 16, 1); g.fillRect(0, 47, 16, 1); g.fillRect(0, 0, 1, 48); g.fillRect(15, 0, 1, 48);
  [4, 26].forEach(y => { g.fillStyle = '#5e3f1b'; g.fillRect(3, y, 10, 18); g.fillStyle = '#a77d45'; g.fillRect(4, y + 1, 8, 16); });
  g.fillStyle = '#bfe6ff'; g.fillRect(5, 6, 6, 6);    // small glass
  g.fillStyle = '#d8d8d8'; g.fillRect(13, 24, 2, 2);   // handle
  return mk(c);
}
function chestTex() {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  noise(g, [160, 112, 48], 16);
  g.fillStyle = '#3a240c';
  g.fillRect(0, 0, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(0, 0, 1, 16); g.fillRect(15, 0, 1, 16);   // dark outline
  g.fillStyle = '#00000030'; g.fillRect(1, 7, 14, 1);
  return mk(c);
}
function tableTex() {   // crafting table
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  noise(g, [168, 124, 67], 14);
  g.fillStyle = '#5a3d18'; g.fillRect(0, 0, 16, 2); g.fillRect(0, 14, 16, 2);
  g.fillStyle = '#c9c9c9'; g.fillRect(3, 4, 6, 3);      // saw
  g.fillStyle = '#7a5a2e'; g.fillRect(10, 4, 2, 8);     // hammer handle
  return mk(c);
}
function furnaceTex() {   // front of the furnace
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  noise(g, [125, 125, 125], 40);
  g.fillStyle = '#2a2a2a'; g.fillRect(3, 4, 10, 9);
  g.fillStyle = '#ff8a1e'; g.fillRect(5, 9, 6, 3);
  return mk(c);
}
function torchTex() {   // 2 x 10 pixels: bright flame on top, wooden stick below
  const c = document.createElement('canvas'); c.width = 2; c.height = 10;
  const g = c.getContext('2d');
  g.fillStyle = '#ffe066'; g.fillRect(0, 0, 2, 2);
  g.fillStyle = '#ffa82e'; g.fillRect(0, 2, 2, 2);
  g.fillStyle = '#7a5a2a'; g.fillRect(0, 4, 2, 6);
  g.fillStyle = '#4a3418'; g.fillRect(1, 4, 1, 6);
  return mk(c);
}
function leavesTex() {   // leaves with small holes, so you can see through them
  const t = pixelTex([55, 125, 40], 70), g = t.image.getContext('2d');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (Math.random() < 0.22) g.clearRect(x, y, 1, 1);
  return t;
}
const T = {
  grass: pixelTex([95, 160, 60], 40), dirt: pixelTex([134, 96, 67], 30),
  planks: pixelTex([188, 152, 98], 20, 'h'), spruce: pixelTex([104, 78, 47], 18, 'h'),
  floor: pixelTex([140, 105, 65], 16, 'h'), log: pixelTex([102, 81, 50], 25, 'v'),
  leaves: leavesTex(), carpet: pixelTex([170, 30, 30], 15), shelf: shelfTex(),
  cobble: pixelTex([125, 125, 125], 60), door: doorTex(), chest: chestTex(), table: tableTex(), furnace: furnaceTex(), torch: torchTex(),
  plaster: pixelTex([232, 222, 200], 10), roof: pixelTex([138, 72, 52], 24, 'h'),
  stone: pixelTex([112, 112, 118], 36), snow: pixelTex([240, 242, 248], 10), water: pixelTex([40, 80, 190], 34), sand: pixelTex([218, 205, 150], 14), brick: pixelTex([150, 70, 60], 30, 'h')
};

// ============ 4. BUILDING HELPERS ============
const solids = [];  // flat rectangles the player cannot walk through
function solid(x1, x2, z1, z2) { solids.push({ x1, x2, z1, z2 }); }

// box: x,z = centre, y = bottom. "mat" is a texture name, a colour number, or a material
function box(x, y, z, w, h, d, mat, rx, ry) {
  const texName = typeof mat === 'string' ? mat : null;   // remembered, so the block can be broken into small cubes later
  if (typeof mat === 'string') {
    const flat = h < 0.3;
    mat = texMat(mat, rx || (flat ? w : Math.max(w, d)), ry || (flat ? d : h));
  } else if (typeof mat === 'number') mat = new THREE.MeshLambertMaterial({ color: mat });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = m.receiveShadow = true;
  m.userData = { part: true, tex: texName };
  scene.add(m);
  return m;
}
function texMat(name, rx, ry) {   // a block material from a pixel texture
  const t = T[name].clone(); t.needsUpdate = true; t.repeat.set(rx, ry);
  return new THREE.MeshLambertMaterial({ map: t, transparent: name === 'leaves', alphaTest: name === 'leaves' ? 0.5 : 0 });   // leaves have holes
}
const cut = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
function wrapLine(t, n) {   // cut a long line into short lines, between words
  const out = []; let cur = '';
  t.split(' ').forEach(w => { if ((cur + ' ' + w).trim().length > n) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
  if (cur) out.push(cur);
  return out;
}

// Draws a wooden sign picture on a canvas
function makeCanvas(w, h, title, lines, hint) {
  const k = w / 512, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#b8945a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#6b4f2a'; g.lineWidth = 10 * k; g.strokeRect(5 * k, 5 * k, w - 10 * k, h - 10 * k);
  g.fillStyle = '#2b1a08'; g.font = `bold ${40 * k}px "Courier New",monospace`;
  g.fillText(cut(title, 18), 28 * k, 66 * k);
  g.font = `${26 * k}px "Courier New",monospace`;
  lines.forEach((t, i) => g.fillText(cut(t, 27), 28 * k, (114 + i * 36) * k));
  if (hint) { g.font = `${20 * k}px "Courier New",monospace`; g.fillStyle = '#5a3d18'; g.fillText(hint, 28 * k, h - 24 * k); }
  return c;
}
function drawHead(cv, x, y, s) {   // small pixel face
  const g = cv.getContext('2d');
  const map = ['hhhhhhhh', 'hhhhhhhh', 'hssssssh', 'ssssssss', 'swbssbws', 'sssnnsss', 'sssmmsss', 'ssssssss'];
  const col = { h: '#3b2314', s: '#c58c5c', w: '#fff', b: '#3b4bd0', n: '#a8683f', m: '#7a3b2a' };
  map.forEach((row, j) => [...row].forEach((ch, i) => { g.fillStyle = col[ch]; g.fillRect(x + i * s, y + j * s, s, s); }));
}

// A sign on a wall. ry = which way it faces. meta = what happens when clicked
function sign(x, y, z, w, h, ry, cv, meta) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, h + 0.3, 0.1), new THREE.MeshLambertMaterial({ color: 0x4a3520 })));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv) }));
  p.position.z = 0.06; p.userData = meta || {}; g.add(p);
}
function label(text, x, y, z) {   // floating name tag
  const c = document.createElement('canvas'); c.width = 512; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#000a'; g.fillRect(0, 0, 512, 96);
  g.fillStyle = '#fff'; g.font = 'bold 40px "Courier New",monospace'; g.textAlign = 'center';
  g.fillText(cut(text, 22), 256, 64);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), fog: false }));
  s.scale.set(2.2, 0.42, 1); s.position.set(x, y, z); scene.add(s);
}

// ============ 5. THE WORLD ============
// ============ TERRAIN: whole-block heights, like Minecraft ============
const SEA = -1;   // water level. Land lower than this fills with water
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const smooth = t => t * t * (3 - 2 * t);
const clamp01 = v => Math.max(0, Math.min(1, v));
function vnoise(x, z) {   // soft random bumps
  const ix = Math.floor(x), iz = Math.floor(z), fx = smooth(x - ix), fz = smooth(z - iz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}
const fbm = (x, z) => vnoise(x / 24, z / 24) * 0.6 + vnoise(x / 11, z / 11) * 0.3 + vnoise(x / 5, z / 5) * 0.1;

function calc(x, z) {   // how high is the ground at this spot?
  // 1. flat ground around the house; hills grow slowly as you walk away
  const dx = Math.max(0, Math.abs(x) - 14), dz = z < -12 ? -12 - z : Math.max(0, z - 26);
  const flat = 1 - smooth(clamp01(Math.hypot(dx, dz) / 16));
  let h = (fbm(x, z) - 0.45) * 12 * (1 - flat);
  // 2. mountains far behind the house and far to the sides
  const m = Math.max(clamp01((-z - 45) / 45), 0.7 * clamp01((Math.abs(x) - 55) / 35));
  h += m * m * (18 + 90 * vnoise(x / 18 + 9, z / 18 + 4) * vnoise(x / 40 + 3, z / 40 + 7));
  // 3. the lake: wobbly outline. Some shores drop like cliffs, some slope gently
  const lz = (z - 48) * 1.15, a = Math.atan2(lz, x);
  const R = 21 + 3 * Math.sin(3 * a + 1) + 2.5 * Math.sin(5 * a + 2) + 3 * (fbm(x * 1.5, z * 1.5) - 0.5);
  const t = Math.hypot(x, lz) / R, steep = 0.5 + 1.3 * (0.5 + 0.5 * Math.sin(2 * a + 0.5));
  if (t < 1) h -= Math.pow(1 - t, steep) * 9 + (1 - t) * 1.5;
  // 4. the edges of the world sink into the sea
  const edge = Math.max(smooth(clamp01((Math.abs(x) - 72) / 14)), smooth(clamp01((z - 74) / 10)), smooth(clamp01((-z - 126) / 12)));
  return Math.round(h * (1 - edge) - 6 * edge);
}

// work out every column once and keep the heights in a list
const GX = 90, GZ0 = -140, GZ1 = 86, GW = 2 * GX + 1, GD = GZ1 - GZ0 + 1;
const HM = new Int16Array(GW * GD);
for (let ix = -GX; ix <= GX; ix++) for (let iz = GZ0; iz <= GZ1; iz++) HM[(ix + GX) * GD + iz - GZ0] = calc(ix, iz);
function H(x, z) {   // ground height at any position
  const ix = Math.round(x) + GX, iz = Math.round(z) - GZ0;
  return ix < 0 || iz < 0 || ix >= GW || iz >= GD ? -6 : HM[ix * GD + iz];
}

// block looks: grass has green on top and a green edge on the sides
const sideCv = document.createElement('canvas'); sideCv.width = sideCv.height = 16;
{
  const g = sideCv.getContext('2d'); g.drawImage(T.dirt.image, 0, 0);
  for (let x = 0; x < 16; x++) { const gh = 3 + (x * 7) % 3; g.drawImage(T.grass.image, x, 0, 1, gh, x, 0, 1, gh); }
}
const M = map => new THREE.MeshLambertMaterial({ map });
const sideM = M(mk(sideCv)), dirtM = M(T.dirt);
const mats = { grass: [sideM, sideM, M(T.grass), dirtM, sideM, sideM], dirt: dirtM, sand: M(T.sand), stone: M(T.stone), snow: M(T.snow) };

// pick a block type for every block we can see
const DUG = new Uint8Array(GW * GD);   // how many blocks were dug out of each column
function lowest(ix, iz) { return Math.min(H(ix + 1, iz), H(ix - 1, iz), H(ix, iz + 1), H(ix, iz - 1)); }
function topOf(ix, iz) {   // which block is on top of this column?
  const dug = DUG[(ix + GX) * GD + iz - GZ0], h = H(ix, iz) + dug, low = lowest(ix, iz);
  const nat = h > 45 ? 'snow' : (h > 22 || (h - low >= 3 && h > 6)) ? 'stone' : (h <= SEA + 1 && low < SEA) ? 'sand' : 'grass';
  if (!dug) return nat;
  return nat === 'grass' ? (dug <= 3 ? 'dirt' : 'stone') : nat === 'sand' ? 'sand' : 'stone';
}
// The land is cut into 32 x 32 pieces, so digging only has to rebuild one piece
const CH = 32, chunks = {}, cubeGeo = new THREE.BoxGeometry(1, 1, 1);
function buildChunk(cx, cz) {
  (chunks[cx + ',' + cz] || []).forEach(im => { scene.remove(im); im.dispose(); });
  const lists = { grass: [], dirt: [], sand: [], stone: [], snow: [] };
  const x0 = -GX + cx * CH, z0 = GZ0 + cz * CH;
for (let ix = x0; ix < Math.min(x0 + CH, GX + 1); ix++) for (let iz = z0; iz < Math.min(z0 + CH, GZ1 + 1); iz++) {
  const h = H(ix, iz), low = lowest(ix, iz), top = topOf(ix, iz);
  for (let j = h; j > Math.max(Math.min(low, h - 1), h - 5); j--) {   // only blocks whose sides can be seen
    const kind = j === h ? top : top === 'grass' ? (h - j <= 3 ? 'dirt' : 'stone') : top === 'sand' ? 'sand' : 'stone';
    lists[kind].push(ix, j - 0.5, iz);
  }
}
  const made = [];
  for (const k in lists) {   // one InstancedMesh per block type = thousands of blocks, very cheap to draw
    const arr = lists[k], n = arr.length / 3;
    if (!n) continue;
    const im = new THREE.InstancedMesh(cubeGeo, mats[k], n), m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { m4.setPosition(arr[3 * i], arr[3 * i + 1], arr[3 * i + 2]); im.setMatrixAt(i, m4); }
    im.frustumCulled = false; im.receiveShadow = true; im.raycast = () => {};
    scene.add(im); made.push(im);
  }
  chunks[cx + ',' + cz] = made;
}
for (let cx = 0; cx * CH < GW; cx++) for (let cz = 0; cz * CH < GD; cz++) buildChunk(cx, cz);

// Dig out the top block of one column (the shovel and the pickaxe use this)
function dig(ix, iz) {
  if (ix < -GX || ix > GX || iz < GZ0 || iz > GZ1) return;
  const i = (ix + GX) * GD + iz - GZ0;
  if (HM[i] <= -6) return;   // do not dig forever
  HM[i]--; DUG[i]++;
  const key = ix + ',' + iz;   // plants on this column lose their ground, so hide them
  (plantMap[key] || []).forEach(({ im, i: k }) => { im.setMatrixAt(k, new THREE.Matrix4().makeScale(0, 0, 0)); im.instanceMatrix.needsUpdate = true; });
  plantMap[key] = [];
  const todo = new Set();    // the piece we dug in, and its neighbours, need a new look
  [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => todo.add(Math.floor((ix + a + GX) / CH) + ',' + Math.floor((iz + b - GZ0) / CH)));
  todo.forEach(key => { const [cx, cz] = key.split(',').map(Number); if (chunks[key]) buildChunk(cx, cz); });
}

// water: one big see-through sheet. It only shows where the ground is lower than the water level
const waterMat = texMat('water', 800, 800); waterMat.transparent = true; waterMat.opacity = 0.78;
const water = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), waterMat);
water.rotation.x = -Math.PI / 2; water.position.y = SEA - 0.125; water.raycast = () => {}; scene.add(water);          // ground
box(0, 0, 15, 2, 0.06, 16, 'dirt');                     // path to the door

let seed = 7; const rand = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
// A tree = 4 separate logs + leaves. Cut every log and the leaves vanish
function tree(x, z) {
  const t = { logs: [], leaves: [], solid: { x1: x - 0.5, x2: x + 0.5, z1: z - 0.5, z2: z + 0.5 } };
  for (let k = 0; k < 4; k++) {
    const log = box(x, H(x, z) + k, z, 1, 1, 1, 'log', 1, 1);
    log.userData = { tree: t, kind: 'log' }; t.logs.push(log);
  }
  [box(x, H(x, z) + 3, z, 5, 2, 5, 'leaves'), box(x, H(x, z) + 5, z, 3, 2, 3, 'leaves')].forEach(l => { l.userData = { tree: t }; t.leaves.push(l); });
  solids.push(t.solid);
}
// small stone piles you can mine with the pickaxe
function rock(x, y, z) {
  const m = box(x, y, z, 1, 1, 1, 'cobble', 1, 1);
  m.userData = { rock: true, solid: { x1: x - 0.5, x2: x + 0.5, z1: z - 0.5, z2: z + 0.5 } };
  solids.push(m.userData.solid);
}
[[10, 14], [-12, 16], [14, -5], [-15, -8], [18, 8], [-18, 2]].forEach(([x, z]) => { const y = H(x, z); rock(x, y, z); rock(x + 1, y, z); if ((x + z) % 2) rock(x, y + 1, z); });
for (let i = 0; i < 70; i++) {
  const x = (rand() - 0.5) * 100, z = (rand() - 0.5) * 100;
  if ((Math.abs(x) < 13 && z > -12 && z < 28) || (z > 24 && Math.abs(x) < 30)) continue;   // keep house area and pond clear
  const tx = Math.round(x), tz = Math.round(z), th = H(tx, tz);
  if (th < 1 || th > 12) continue;   // trees only grow on dry ground that is not too high
  tree(tx, tz);
}

// ---- plants: two flat pictures crossed like an X, just like the real game ----
const px = (g, col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
function plantTex(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  draw(c.getContext('2d')); return mk(c);
}
const flowerTex = (petal, middle) => plantTex(g => {
  px(g, '#3f8a2a', 7, 7, 2, 9); px(g, '#3f8a2a', 4, 10, 3, 1); px(g, '#3f8a2a', 9, 12, 3, 1);   // stem and leaves
  px(g, petal, 5, 2, 6, 5); px(g, petal, 6, 1, 4, 7); px(g, middle, 7, 3, 2, 2);
});
const grassTex = plantTex(g => {
  [1, 3, 5, 7, 9, 11, 13].forEach((x, i) => px(g, i % 2 ? '#4f9a3a' : '#3f8a2a', x, 16 - (5 + (i * 5) % 7), 2, 5 + (i * 5) % 7));
});
const plantMap = {};   // which plants stand on which column, so digging can remove them
function plants(tex, n, size) {
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const spots = [];
  while (spots.length < n) {
    const x = (rand() - 0.5) * 80, z = rand() * 74 - 40;
    if ((Math.abs(x) < 9.5 && Math.abs(z) < 8.5) || (Math.abs(x) < 1.6 && z > 7) || H(x, z) < 0 || H(x, z) > 14) continue;   // not in the house, on the path, in water or on mountains
    spots.push([x, z]);
  }
  [Math.PI / 4, -Math.PI / 4].forEach(angle => {
    const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(size, size), mat, n), d = new THREE.Object3D();
    spots.forEach(([x, z], i) => { d.position.set(x, H(x, z) + size / 2, z); d.rotation.y = angle; d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    const key = Math.round(x) + ',' + Math.round(z); (plantMap[key] = plantMap[key] || []).push({ im, i });
  });
    im.frustumCulled = false; im.raycast = () => {};   // plants never block your aim
    scene.add(im);
  });
}
plants(grassTex, 400, 0.9);
plants(flowerTex('#d82e2e', '#7a1010'), 40, 0.7);   // poppies
plants(flowerTex('#f2d43a', '#c89a10'), 40, 0.7);   // dandelions
plants(flowerTex('#4f7fe8', '#e8f0ff'), 30, 0.7);   // blue flowers

const clouds = [];
for (let i = 0; i < 8; i++) {
  const c = new THREE.Mesh(new THREE.BoxGeometry(8 + rand() * 8, 2, 5 + rand() * 5), new THREE.MeshBasicMaterial({ color: 0xf2b9a3, fog: false }));
  c.position.set((rand() - 0.5) * 140, 35, (rand() - 0.5) * 140); scene.add(c); clouds.push(c);
}
const sunBlock = new THREE.Mesh(new THREE.BoxGeometry(16, 16, 1), new THREE.MeshBasicMaterial({ color: 0xfff3a0, fog: false }));
sunBlock.position.set(85, 95, 180); sunBlock.lookAt(0, 0, 0); scene.add(sunBlock);

// Welcome sign near the path
box(3.2, 0, 11.95, 0.2, 1.2, 0.2, 'log', 1, 1);
sign(3.2, 1.9, 12.05, 2.4, 1.5, 0, makeCanvas(512, 320, 'WELCOME!', ['Come into ' + DATA.name + "'s", 'house. Click the', 'door to open it.']));

// ---- windows, doors and footsteps ----
const glass = new THREE.MeshLambertMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.35 });
const doorMeta = { type: 'door', label: 'Open or close the door' };
let doorOpen = false, doorT = 0, swing = 0, walkT = 0, audio = null;

// A wall with window holes. alongX = the wall runs left to right. windows = where the window centres are
function wall(cx, cz, len, alongX, windows) {
  const W = 2, y1 = 1.6, y2 = 3.6;   // each window is 2 wide, from height 1.6 to 3.6
  const put = (off, y, l, h, tex) => alongX ? box(cx + off, y, cz, l, h, 0.5, tex) : box(cx, y, cz + off, 0.5, h, l, tex);
  put(0, 0, len, 1, 'cobble');          // stone bottom row
  put(0, 1, len, y1 - 1, 'plaster');
  put(0, y2, len, 5 - y2, 'plaster');   // plaster above the windows
  const e = [-len / 2];                 // the wall pieces between the windows
  windows.forEach(o => e.push(o - W / 2, o + W / 2));
  e.push(len / 2);
  for (let i = 0; i < e.length; i += 2) put((e[i] + e[i + 1]) / 2, y1, e[i + 1] - e[i], y2 - y1, 'plaster');
  windows.forEach(o => {                // glass and a wooden cross
    const gx = alongX ? cx + o : cx, gz = alongX ? cz : cz + o;
    box(gx, y1, gz, alongX ? W : 0.08, y2 - y1, alongX ? 0.08 : W, glass).castShadow = false;
    box(gx, (y1 + y2) / 2 - 0.05, gz, alongX ? W : 0.16, 0.1, alongX ? 0.16 : W, 'spruce');
    box(gx, y1, gz, alongX ? 0.1 : 0.16, y2 - y1, alongX ? 0.16 : 0.1, 'spruce');
  });
}

// One door leaf that turns around its hinge. dir = 1: the leaf reaches right of the hinge
function makeDoor(hingeX, dir) {
  const g = new THREE.Group(); g.position.set(hingeX, 0, 7); scene.add(g);
  const m = box(0, 0, 0, 1, 3, 0.15, 'door', dir, 1);
  scene.remove(m); m.position.set(dir * 0.5, 1.5, 0); m.userData = doorMeta; g.add(m);
  return g;
}
function toggleDoor() {
  const inDoorway = Math.abs(pos.x) < 1.6 && pos.z > 6.4 && pos.z < 7.6;
  if (doorOpen && inDoorway) return;   // never close the door on yourself
  doorOpen = !doorOpen;
}

// Footstep sound: a short soft noise. Deeper sound on the wooden floor
function step() {
  if (!audio) return;
  const n = audio.sampleRate * 0.09 | 0, b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
  const inside = Math.abs(pos.x) < 7.75 && Math.abs(pos.z) < 6.75;
  s.buffer = b; f.type = 'lowpass'; f.frequency.value = inside ? 1100 : 600; g.gain.value = 0.3;
  s.connect(f); f.connect(g); g.connect(audio.destination); s.start();
}

// ============ 6. THE HOUSE (16 wide, 14 deep, 5 high) ============
box(0, 0, 0, 15.5, 0.1, 13.5, 'floor');                                  // floor
wall(0, -7, 16.5, true, []); solid(-8.25, 8.25, -7.25, -6.75); // back wall
wall(-8, 0, 14, false, [-5.2]);   solid(-8.25, -7.75, -7, 7);       // left wall
wall(8, 0, 14, false, [-5.2]);    solid(7.75, 8.25, -7, 7);         // right wall
wall(-4.625, 7, 7.25, true, [-1.725]); solid(-8.25, -1, 6.75, 7.25); // front wall, left of door
wall(4.625, 7, 7.25, true, [0.375]);  solid(1, 8.25, 6.75, 7.25);   // front wall, right of door
box(0, 3, 7, 2, 2, 0.5, 'log');
const doorLeaves = [makeDoor(-1, 1), makeDoor(1, -1)];                                      // above the door
[[-8, -7], [8, -7], [-8, 7], [8, 7]].forEach(([x, z]) => box(x, 0, z, 1, 5, 1, 'spruce', 1, 5)); // corner logs
for (let i = 0; i < 4; i++) {   // gable roof: the steps get narrower going up. The long side stays 18 wide
  box(0, 5 + i, 0, 18, 1, 16 - 4 * i, 'roof');
  [-8, 8].forEach(x => box(x, 5 + i, 0, 0.5, 1, 14 - 4 * i, 'plaster'));        // cream triangle on each end
  [-9.15, 9.15].forEach(x => box(x, 5 + i, 0, 0.3, 1, 16 - 4 * i, 'stone'));   // grey stone edge on each end
}
box(5.5, 5, -2.5, 1.4, 5.5, 1.4, 'brick'); box(5.5, 10.5, -2.5, 1.8, 0.3, 1.8, 'stone');   // brick chimney
box(0, 4.9, 0, 15.5, 0.1, 13.5, 'spruce');   // wooden ceiling inside
// dark timber beams under the roof, window flower boxes, and a stone step at the door
box(0, 4.55, -7, 16.5, 0.45, 0.7, 'spruce'); box(0, 4.55, 7, 16.5, 0.45, 0.7, 'spruce');
box(-8, 4.55, 0, 0.7, 0.45, 14, 'spruce'); box(8, 4.55, 0, 0.7, 0.45, 14, 'spruce');
[-6.35, 5].forEach(wx => {
  box(wx, 1.1, 7.45, 2.2, 0.3, 0.45, 'spruce'); box(wx, 1.4, 7.45, 2, 0.2, 0.3, 0x2f7a2a);
  for (let i = 0; i < 5; i++) box(wx - 0.8 + i * 0.4, 1.6, 7.45, 0.22, 0.22, 0.22, i % 2 ? 0xd82e2e : 0xf2d43a);
});
box(0, 0, 8.2, 4, 0.2, 1.6, 'cobble');
// timber frame: dark beams around the door and along the walls
[-1.25, 1.25].forEach(x => box(x, 0, 7.15, 0.5, 5, 0.6, 'spruce'));
box(0, 3.6, 7.15, 16.5, 0.3, 0.6, 'spruce'); box(0, 3.6, -7.15, 16.5, 0.3, 0.6, 'spruce');
box(-8.15, 3.6, 0, 0.6, 0.3, 14, 'spruce'); box(8.15, 3.6, 0, 0.6, 0.3, 14, 'spruce');
// porch: two posts and a small roof over the door, with flower pots
[-2.6, 2.6].forEach(x => box(x, 0, 9.3, 0.4, 3.4, 0.4, 'spruce'));
box(0, 3.4, 8.4, 6.4, 0.4, 2.8, 'spruce'); box(0, 3.8, 8.4, 5.2, 0.4, 2.2, 'roof'); box(0, 4.2, 8.4, 3.6, 0.4, 1.6, 'roof');
[-1.8, 1.8].forEach(x => { box(x, 0.2, 8.3, 0.45, 0.4, 0.45, 0xb5603a); box(x, 0.6, 8.3, 0.35, 0.3, 0.35, 0xd82e2e); });

// Vines: green plants that hang on walls. The picture has holes, so you can see the wall behind
const vineTex = plantTex(g => {
  for (let x = 0; x < 16; x++) {
    const len = 5 + Math.floor(hash(x, 3) * 11);   // each column hangs down a different length
    for (let y = 0; y < len; y++) if (hash(x, y + 9) > 0.3) px(g, ['#2f6b24', '#3f8a2a', '#4f9a3a'][(x + y) % 3], x, y, 1, 1);
  }
});
function vine(cx, cy, cz, w, h, ry) {   // a flat see-through picture just in front of a wall
  const t = vineTex.clone(); t.needsUpdate = true; t.repeat.set(w, h);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }));
  p.position.set(cx, cy, cz); p.rotation.y = ry; p.raycast = () => {}; scene.add(p);   // raycast off: vines never block your aim
}
[[-7.7, 3.1, 7.3, 1.2, 3.8, 0], [-4.2, 3.6, 7.3, 1, 2.8, 0], [-1.6, 3.4, 7.3, 0.6, 3.2, 0], [1.6, 3.4, 7.3, 0.6, 3.2, 0], [7.6, 3.1, 7.3, 1.2, 3.8, 0],
 [8.3, 3.2, -3, 2, 3.6, Math.PI / 2], [8.3, 3.2, 3.5, 1.4, 3.6, Math.PI / 2], [-8.3, 3.2, 1, 2, 3.6, Math.PI / 2],
 [2, 3.2, -7.3, 2, 3.6, 0], [-5, 3.2, -7.3, 1.4, 3.6, 0]].forEach(v => vine(...v));

// Lanterns on the front wall (the two by the door give light)
const lanternTex = plantTex(g => { px(g, '#2b2b2b', 0, 0, 16, 16); px(g, '#ffcf5a', 3, 3, 10, 10); px(g, '#fff0a0', 5, 5, 6, 6); });
function lantern(x, y, z, light) {
  box(x, y, z, 0.35, 0.45, 0.35, new THREE.MeshBasicMaterial({ map: lanternTex }));
  if (light) { const l = new THREE.PointLight(0xffa840, 1.1, 10); l.position.set(x, y + 0.2, z + 0.3); scene.add(l); }
}
lantern(-1.8, 2.6, 7.5, true); lantern(1.8, 2.6, 7.5, true); lantern(-4.2, 3.2, 7.5); lantern(6.9, 3.2, 7.5);

// lights
[[-4, -3], [4, -3], [-4, 3], [4, 3]].forEach(([x, z]) => { lantern(x, 4.0, z); box(x, 4.45, z, 0.05, 0.45, 0.05, 0x333333); });   // lanterns hanging on a chain
[-4, 4].forEach(x => { const l = new THREE.PointLight(0xffe2a0, 1.0, 16); l.position.set(x, 3.5, 0); scene.add(l); });

// red rug
box(0, 0.1, -1, 11, 0.03, 3.4, 'carpet');

// bookshelves on the back wall
[-5.5, 5.5].forEach(x => {   // wooden top and sides, books on the front
  const side = texMat('shelf', 0.7, 3), top = texMat('planks', 3, 0.7), front = texMat('shelf', 3, 3);
  box(x, 0.1, -6.4, 3, 3, 0.7, [side, side, top, top, front, front]);
  solid(x - 1.5, x + 1.5, -6.75, -6.05);
});

// bed (right of the door)
box(5, 0.1, 5.3, 3, 0.4, 2, 'planks');
box(4.7, 0.5, 5.3, 2.4, 0.25, 1.9, 0xe9e9e9);
box(4.3, 0.5, 5.3, 1.5, 0.28, 1.95, 0xb02e26);
box(6.1, 0.55, 5.3, 0.7, 0.2, 1.2, 0xffffff);
solid(3.5, 6.5, 4.3, 6.3);

// crafting table and furnace in the front-left corner
box(-7, 0.1, 6, 1, 1, 1, 'table', 1, 1); solid(-7.5, -6.5, 5.5, 6.5);
const stone = () => texMat('cobble', 1, 1);
box(-5.8, 0.1, 6, 1, 1, 1, [stone(), stone(), stone(), stone(), stone(), texMat('furnace', 1, 1)]); solid(-6.3, -5.3, 5.5, 6.5);

// torches inside the house
function torch(x, y, z, light) {
  box(x, y, z, 0.125, 0.625, 0.125, new THREE.MeshBasicMaterial({ map: T.torch }));   // a real torch: thin stick, bright top
  if (light) { const l = new THREE.PointLight(0xffa840, 1.1, 10); l.position.set(x, y + 1, z); scene.add(l); }
}

torch(-3.5, 2.2, -6.55); torch(3.5, 2.2, -6.55);

// the tool chest: your pickaxe, axe and shovel are in here
{
  const meta = { type: 'toolchest', label: 'Tool chest' };
  [box(-3, 0.1, 6, 1.2, 0.7, 1.05, 'chest', 1, 1), box(-3, 0.8, 6, 1.2, 0.35, 1.05, 'chest', 1, 1),
   box(-3, 0.7, 5.45, 0.22, 0.3, 0.06, 0xcfcfcf), box(-3, 0.78, 5.415, 0.06, 0.1, 0.02, 0x222222)].forEach(m => m.userData = meta);
  label('Tools', -3, 1.5, 6); solid(-3.7, -2.3, 5.4, 6.6);
}

// ---- Walls show your info (click a sign to read more) ----
const PI = Math.PI;
sign(0, 2.9, -6.7, 6, 3.375, 0, (() => {                     // back wall: About
  const cv = makeCanvas(768, 432, DATA.name, [DATA.tagline, '', 'Welcome to my house!', 'Every wall tells part', 'of my story.'], 'Click to read more');
  drawHead(cv, 540, 90, 20); return cv;
})(), { type: 'about', label: 'About me' });

DATA.achievements.slice(0, 4).forEach((a, i) =>              // left wall: achievements shown as "advancements" (room for 4)
  sign(-7.7, 2.8, -2.65 + i * 2.6, 2.2, 1.375, PI / 2,
    makeCanvas(512, 320, a.title, [a.subtitle, a.detail, '', '★ Advancement Made!'], 'Click to open'),
    { type: 'exp', i, label: DATA.achievementsTitle + ': ' + a.title }));

sign(7.7, 2.9, -1.5, 4, 2.875, -PI / 2,                        // right wall: Skills
  makeCanvas(640, 460, 'Skills', DATA.skills.flatMap(g => wrapLine(g.group + ': ' + g.items.join(', '), 27)), 'Click to open'),
  { type: 'skills', label: 'Skills' });
sign(7.7, 2.8, 3.6, 3.2, 2, -PI / 2,                         // right wall: Contact
  makeCanvas(512, 320, 'Contact', [DATA.contact.email, 'GitHub', 'LinkedIn'], 'Click to open'),
  { type: 'contact', label: 'Contact' });
sign(-3.3, 2.8, 6.7, 3.2, 2, PI,                             // front wall: Education
  makeCanvas(512, 320, 'Education', DATA.education.map(e => e.degree), 'Click to open'),
  { type: 'edu', label: 'Education' });

// ---- Projects: one chest per project, with a floating gem ----
const gems = [], gemColors = [0x33e0d0, 0x3fd35a, 0xf0c030];
const shownProjects = DATA.projects.slice(0, 3);   // room for 3 chests. They are placed in the middle of the room
shownProjects.forEach((p, i) => {
  const x = (i - (shownProjects.length - 1) / 2) * 3.5, z = -1, meta = { type: 'project', i, label: 'Project: ' + p.name };
  [box(x, 0.1, z, 1.2, 0.7, 1.05, 'chest', 1, 1),     // chest body
   box(x, 0.8, z, 1.2, 0.35, 1.05, 'chest', 1, 1),    // lid
   box(x, 0.7, z + 0.55, 0.22, 0.3, 0.06, 0xcfcfcf),  // iron lock
   box(x, 0.78, z + 0.585, 0.06, 0.1, 0.02, 0x222222)] // keyhole
    .forEach(m => m.userData = meta);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshLambertMaterial({ color: gemColors[i], emissive: gemColors[i], emissiveIntensity: 0.6 }));
  gem.position.set(x, 1.9, z); gem.userData = meta; scene.add(gem); gems.push(gem);
  label(p.name, x, 2.5, z);
  solid(x - 0.8, x + 0.8, z - 0.6, z + 0.6);
});

// ============ 7. INFO WINDOWS ============
function toolIcon(t) {   // a 16 x 16 pixel picture of a tool
  const c = document.createElement('canvas'); c.width = c.height = 16;
  const g = c.getContext('2d');
  const dot = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let i = 0; i < 10; i++) { dot(2 + i, 13 - i, '#8a5a2a'); dot(3 + i, 13 - i, '#5a3a18'); }   // wooden stick
  if (t === 'pick') for (let i = 0; i < 9; i++) { dot(7 + i, i, '#d4dcdf'); dot(8 + i, i, '#d4dcdf'); dot(7 + i, i + 1, '#7e8a8e'); }
  const blob = rows => rows.forEach(([x, y, w]) => { for (let k = 0; k < w; k++) dot(x + k, y, k === w - 1 ? '#7e8a8e' : '#d4dcdf'); });   // rows of iron: x, y, width
  if (t === 'axe') blob([[8, 1, 5], [8, 2, 6], [9, 3, 6], [10, 4, 5], [11, 5, 3]]);
  if (t === 'shovel') blob([[11, 0, 3], [10, 1, 5], [10, 2, 5], [10, 3, 5], [11, 4, 3]]);
  return c.toDataURL();
}
const chips = a => a.map(t => `<span class="chip">${t}</span>`).join('');
const list = a => '<ul>' + a.map(t => `<li>${t}</li>`).join('') + '</ul>';
const PANELS = {
  toolchest: () => {   // a chest window with a grid of slots, like the real game
    const items = ['pick', 'axe', 'shovel'], names = { pick: 'Pickaxe', axe: 'Axe', shovel: 'Shovel' };
    const slots = Array.from({ length: 27 }, (_, i) => {
      const t = items[i];
      return t && !owned[t]
        ? `<div class="cell" onclick="takeTool('${t}')"><img src="${toolIcon(t)}"><span class="tip2">${names[t]}</span></div>`
        : '<div class="cell"></div>';
    }).join('');
    return `<h2>Tool chest</h2><div class="grid">${slots}</div>`;
  },
  about: () => `<h2>${DATA.name}</h2><div class="sub">${DATA.tagline}</div><p>${DATA.about}</p>`,
  skills: () => '<h2>Skills</h2>' + DATA.skills.map(g => `<h3>${g.group}</h3>${chips(g.items)}`).join(''),
  exp: i => `<h2>${DATA.achievementsTitle}</h2>` + (i == null ? DATA.achievements : [DATA.achievements[i]]).map(a =>
    `<h3>${a.title}</h3><div class="sub">${a.subtitle} · ${a.detail}</div>${list(a.points)}`).join('<hr>'),
  project: i => '<h2>Projects</h2>' + (i == null ? DATA.projects : [DATA.projects[i]]).map(p =>
    `<h3>${p.name}</h3><div>${chips(p.tech)}</div><p>${p.desc}</p>${list(p.points)}<a href="${p.link}" target="_blank" rel="noopener">Open project</a>`).join('<hr>'),
  edu: () => '<h2>Education</h2>' + DATA.education.map(e =>
    `<h3>${e.degree}</h3><div class="sub">${e.school} · ${e.period} · ${e.score}</div>`).join('<hr>'),
  contact: () => { const c = DATA.contact; return `<h2>Contact</h2><p>Email: <a href="mailto:${c.email}">${c.email}</a></p>${c.phone ? `<p>Phone: ${c.phone}</p>` : ''}
    <p>GitHub: <a href="${c.github}" target="_blank" rel="noopener">${c.github}</a></p>
    <p>LinkedIn: <a href="${c.linkedin}" target="_blank" rel="noopener">${c.linkedin}</a></p>`; }
};
const HOTBAR = [['about', 'About'], ['skills', 'Skills'], ['exp', DATA.achievementsShort], ['project', 'Projects'], ['contact', 'Contact']];
const $ = id => document.getElementById(id);
$('title').textContent = DATA.name + "'s Server";
document.title = DATA.name + "'s House";
$('badge').textContent = DATA.name.toLowerCase().replace(/ /g, '-') + '.smp | 1/1 players';
HOTBAR.forEach(([type, name], n) => {
  const s = document.createElement('div'); s.className = 'slot';
  s.innerHTML = `<b>${n + 1}</b>${name}`; s.onclick = () => openPanel(type, null);
  $('hotbar').appendChild(s);
});

// ============ 7b. TOOLS ============
let tool = null, aim = null, hintShown = false;   // at the start your hands are empty
const owned = {};                                 // the tools you took from the chest   // aim = whatever the crosshair points at
[['pick', 'Pickaxe'], ['axe', 'Axe'], ['shovel', 'Shovel']].forEach(([t, name], n) => {
  const s = document.createElement('div'); s.className = 'slot'; s.dataset.t = t; s.style.display = 'none';   // hidden until you take it
  s.innerHTML = `<b>${n + 6}</b>${name}`; s.onclick = () => setTool(t);
  $('hotbar').appendChild(s);
});
setTool(null);

let msgTimer;
function say(text) {
  const m = $('msg'); m.textContent = text; m.style.display = 'block';
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.style.display = 'none', 2200);
}
const inHome = p => Math.abs(p.x) < 9.5 && p.z > -8.5 && p.z < 8.5;

function takeTool(t) {   // the buttons in the tool chest window call this
  owned[t] = true;
  const slot = document.querySelector(`.slot[data-t="${t}"]`);
  slot.style.display = 'flex';
  slot.innerHTML = slot.querySelector('b').outerHTML + `<img class="ico" src="${toolIcon(t)}">`;   // show the tool picture in the hotbar
  setTool(t);
  openPanel('toolchest', null);   // show the window again, now with a tick
}

// Looking at the ground? Walk along the crosshair in small steps until we are inside the ground
function groundHit() {
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  for (let t = 0.3; t < 6; t += 0.05) {
    const x = camera.position.x + dir.x * t, y = camera.position.y + dir.y * t, z = camera.position.z + dir.z * t;
    if (y < H(x, z)) return { t, x: Math.round(x), z: Math.round(z) };
  }
  return null;
}
function digGround(gh) {
  if (inHome({ x: gh.x, z: gh.z }) || (Math.abs(gh.x) < 2 && gh.z > 7) || solids.some(s => gh.x >= s.x1 && gh.x <= s.x2 && gh.z >= s.z1 && gh.z <= s.z2)) return;   // not under my house, my path, a tree or a rock
  const kind = topOf(gh.x, gh.z), soft = kind === 'grass' || kind === 'dirt' || kind === 'sand';
  if ((tool === 'shovel' && soft) || (tool === 'pick' && !soft)) dig(gh.x, gh.z);
  else if (tool !== 'axe') say(soft ? 'Soft ground: use the shovel!' : 'Hard stone: use the pickaxe!');
}

// Breaking the house: a big wall piece is first cut into 1-block cubes, then one cube is removed.
// It warns you every time, and after 5 broken blocks the house rebuilds itself.
const brokenParts = [], cellMats = {};
let homeBroken = 0;
function splitPart(o) {
  const p = o.geometry.parameters, w = p.width, h = p.height, d = p.depth;
  const nx = Math.ceil(w - 0.01), ny = Math.ceil(h - 0.01), nz = Math.ceil(d - 0.01);
  const sx = w / nx, sy = h / ny, sz = d / nz, cells = [], tex = o.userData.tex;
  const mat = tex ? (cellMats[tex] = cellMats[tex] || texMat(tex, 1, 1)) : o.material;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    c.position.set(o.position.x - w / 2 + sx * (i + 0.5), o.position.y - h / 2 + sy * (j + 0.5), o.position.z - d / 2 + sz * (k + 0.5));
    c.castShadow = c.receiveShadow = true; c.userData = { part: true, cell: true };
    scene.add(c); cells.push(c);
  }
  scene.remove(o); brokenParts.push({ orig: o, cells });
  return cells;
}
function breakHome(o, p) {
  const cells = o.userData.cell ? [o] : splitPart(o);
  let best = cells[0], bd = 1e9;   // the cube we hit = the one closest to the hit point
  cells.forEach(c => { const dd = c.position.distanceTo(p); if (dd < bd) { bd = dd; best = c; } });
  scene.remove(best); homeBroken++;
  if (homeBroken > 5) {   // too much! put everything back
    brokenParts.forEach(b => { b.cells.forEach(c => scene.remove(c)); scene.add(b.orig); });
    brokenParts.length = 0; homeBroken = 0;
    say('OK, that is enough! I rebuilt my home.');
  } else say(`Hey! Please don't destroy my home! (${homeBroken}/5)`);
}

function useTool() {
  if (!tool) { say('Your hands are empty. Take tools from the chest in the house!'); return; }
  const gh = groundHit();
  if (gh && gh.t < (aim ? aim.distance : 99)) { digGround(gh); return; }   // the ground is the closest thing
  if (!aim) return;
  const o = aim.object, data = o.userData;
  if (tool === 'pick') {
    if (data.rock) { scene.remove(o); solids.splice(solids.indexOf(data.solid), 1); }   // mined!
    else if (data.part && inHome(aim.point)) breakHome(o, aim.point);
  } else if (tool === 'axe' && data.tree) {
    const t = data.tree, log = data.kind === 'log' ? o : t.logs[t.logs.length - 1];
    scene.remove(log); t.logs.splice(t.logs.indexOf(log), 1);
    if (!t.logs.length) {                                  // last log cut: leaves vanish on their own
      t.leaves.forEach(l => scene.remove(l));
      solids.splice(solids.indexOf(t.solid), 1);
    }
  }
}
function act() {   // the Use action: open things, or use the tool in your hand
  if (!playing) return;
  swing = 1;
  if (hover) { if (hover.type === 'door') toggleDoor(); else openPanel(hover.type, hover.i); return; }
  useTool();
}

// ============ 8. CONTROLS ============
const keys = {}, canvasEl = renderer.domElement;
let playing = false, panelOpen = false, moved = false, hover = null;
let yaw = 0, pitch = 0, py = 0, vy = 0;
const pos = { x: 0, z: 22 };   // start outside, looking at the house

function sync() {
  $('start').style.display = (!playing && !panelOpen) ? 'flex' : 'none';
  $('panel').style.display = panelOpen ? 'flex' : 'none';
  $('hotbar').style.display = $('cross').style.display = playing ? 'flex' : 'none';
  $('touch').style.display = isTouch && playing ? 'block' : 'none';
  if (!playing) $('tip').style.display = 'none';
}
function openPanel(type, i) {
  panelOpen = true; playing = false;
  if (document.exitPointerLock) document.exitPointerLock();
  $('pbody').innerHTML = PANELS[type](i);
  sync();
}
function closePanel() { panelOpen = false; sync(); }
$('close').onclick = closePanel;
$('start').onclick = () => { playing = true; sync(); audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  if (!hintShown) { hintShown = true; say('Tip: take your tools from the chest inside the house, left of the door'); } if (!isTouch && canvasEl.requestPointerLock) canvasEl.requestPointerLock(); };
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && playing) { playing = false; sync(); }
});

addEventListener('mousemove', e => {
  if (!playing) return;
  const locked = !!document.pointerLockElement;
  if (!locked && e.buttons !== 1) return;   // if pointer lock is blocked, drag to look instead
  if (!locked) moved = true;
  yaw -= e.movementX * 0.0022;
  pitch = Math.max(-1.5, Math.min(1.5, pitch - e.movementY * 0.0022));
});
canvasEl.addEventListener('mousedown', () => moved = false);
canvasEl.addEventListener('click', () => {
  if (!playing || moved) return;
  if (isTouch) return;   // on phones the USE button does this
  act();
});
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Escape') {
    if (panelOpen) closePanel();
    else if (playing && !document.pointerLockElement) { playing = false; sync(); }
  }
  const n = +e.key;
  if (playing && n >= 1 && n <= 5) openPanel(HOTBAR[n - 1][0], null);
  if (playing && n >= 6 && n <= 8) { const t = ['pick', 'axe', 'shovel'][n - 6]; if (owned[t]) setTool(t); }
});
addEventListener('keyup', e => keys[e.code] = false);
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
addEventListener('resize', () => {
  camera.aspect = handCam.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); handCam.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ---- Phone controls: arrow buttons, jump, USE, and drag the screen to look ----
const isTouch = matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');
document.querySelectorAll('.dp[data-k]').forEach(b => {
  const set = v => e => { e.preventDefault(); keys[b.dataset.k] = v; };
  b.addEventListener('touchstart', set(true), { passive: false });
  b.addEventListener('touchend', set(false)); b.addEventListener('touchcancel', set(false));
});
$('act').addEventListener('touchstart', e => { e.preventDefault(); act(); }, { passive: false });
let lookId = null, lx = 0, ly = 0;
canvasEl.addEventListener('touchstart', e => {
  if (lookId === null) { const t = e.changedTouches[0]; lookId = t.identifier; lx = t.clientX; ly = t.clientY; }
});
canvasEl.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) if (t.identifier === lookId) {
    yaw -= (t.clientX - lx) * 0.005;
    pitch = Math.max(-1.5, Math.min(1.5, pitch - (t.clientY - ly) * 0.005));
    lx = t.clientX; ly = t.clientY;
  }
});
canvasEl.addEventListener('touchend', e => { for (const t of e.changedTouches) if (t.identifier === lookId) lookId = null; });

// Water and cliffs stop you. A 1-block step makes you hop up on your own, like the real game
function canGo(x, z) {
  if (blocked(x, z) || H(x, z) < SEA - 1) return false;   // you can wade into water 1 block deep
  const up = H(x, z) - py;
  if (up > 1.05) return false;
  if (up > 0.05 && py <= H(pos.x, pos.z) + 0.001) vy = 7;
  return true;
}

// Walls and furniture: can I stand here?
function blocked(x, z) {
  if (Math.abs(x) > 40 || z < -40 || z > 34) return true;   // the front limit moved from 25 to 34 so you can reach the lake
  const R = 0.3;
  if (!doorOpen && Math.abs(x) < 1 + R && z > 6.75 - R && z < 7.25 + R) return true;   // closed door
  return solids.some(s => x > s.x1 - R && x < s.x2 + R && z > s.z1 - R && z < s.z2 + R);
}

// ============ 9. GAME LOOP ============
const ray = new THREE.Raycaster(); ray.far = 6;
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.05); last = now;
  if (playing) {
    const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
    const sp = (keys.ShiftLeft ? 7 : 4.2) * dt * (H(pos.x, pos.z) < SEA ? 0.6 : 1);   // slower in water
    const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * r) * sp;
    const dz = (-Math.cos(yaw) * f - Math.sin(yaw) * r) * sp;
    if (canGo(pos.x + dx, pos.z)) pos.x += dx;   // x and z checked separately so you slide along walls
    if (canGo(pos.x, pos.z + dz)) pos.z += dz;
    const gy = H(pos.x, pos.z);   // height of the ground under you
    if (keys.Space && py <= gy + 0.001) vy = 7;
    py += vy * dt; vy -= 22 * dt;
    if (py <= gy && vy <= 0) { py = gy; vy = 0; }
    if ((f || r) && py <= gy + 0.001) {                      // walking: the view bobs and feet make a sound
      const before = Math.floor(walkT / PI);
      walkT += (keys.ShiftLeft ? 12 : 8.5) * dt;
      if (Math.floor(walkT / PI) !== before) step();
    } else walkT += (Math.round(walkT / PI) * PI - walkT) * Math.min(1, dt * 8);   // settle back to still

    ray.setFromCamera({ x: 0, y: 0 }, camera);       // what is the crosshair pointing at?
    const hit = ray.intersectObjects(scene.children, true)[0];
    aim = hit || null;
    hover = hit && hit.object.userData.type ? hit.object.userData : null;
    const o = aim && aim.object.userData;
    const tipText = hover ? (hover.type === 'door' ? 'Click: ' : 'Click to open: ') + hover.label
      : tool === 'axe' && o && o.tree ? 'Click to chop' : tool === 'pick' && o && o.rock ? 'Click to mine' : '';
    $('tip').style.display = tipText ? 'block' : 'none';
    $('tip').textContent = tipText;
  }
  camera.position.set(pos.x, 1.7 + py + Math.abs(Math.sin(walkT)) * 0.07, pos.z);
  camera.rotation.set(pitch, yaw, Math.sin(walkT) * 0.008);
  // hand: moves while you walk, swings when you click
  swing = Math.max(0, swing - dt * 4);
  hand.visible = playing;
  hand.position.set(0.36 + Math.cos(walkT) * 0.015, -0.36 + Math.abs(Math.sin(walkT)) * 0.03, -0.5);
  hand.rotation.set(-Math.sin(swing * PI) * 0.9, 0.3, 0);
  // door opens and closes smoothly
  doorT += ((doorOpen ? 1 : 0) - doorT) * Math.min(1, dt * 6);
  doorLeaves[0].rotation.y = -doorT * PI / 2; doorLeaves[1].rotation.y = doorT * PI / 2;
  gems.forEach(g => { g.rotation.y = now / 1000; g.position.y = 1.9 + Math.sin(now / 400) * 0.12; });
  waterMat.map.offset.x = now / 60000;   // slow moving water
  sky.position.copy(camera.position);
  clouds.forEach(c => { c.position.x += dt * 1.5; if (c.position.x > 70) c.position.x = -70; });
  renderer.clear();
  renderer.render(scene, camera);
  renderer.clearDepth();
  renderer.render(handScene, handCam);
  requestAnimationFrame(tick);
}
sync();
requestAnimationFrame(tick);
