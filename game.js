/**
 * TACTICAL ZONE — Top-Down Shooter
 * Realistic-feel: mouse aim, recoil, spread, reload, cover tiles,
 * wave-based enemies with path-seek AI, blood/muzzle particles.
 */

'use strict';

/* ─── Canvas setup ─────────────────────────────────────────────────────────── */
const canvas = document.getElementById('game');
const ctx    = canvas.getContext('2d');
const W = canvas.width  = 800;
const H = canvas.height = 560;

/* ─── DOM refs ──────────────────────────────────────────────────────────────── */
const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const btnBeginner  = document.getElementById('btn-beginner');
const btnSkilled   = document.getElementById('btn-skilled');
const overlayRes   = document.getElementById('overlay-result');
const overlaySub   = document.getElementById('overlay-sub');
const healthFill   = document.getElementById('health-bar-fill');
const ammoPips     = document.getElementById('ammo-pips');
const waveEl       = document.getElementById('wave-val');
const scoreEl      = document.getElementById('score-val');
const waveFlash    = document.getElementById('wave-flash');
const killfeed        = document.getElementById('killfeed');
const eventBanner      = document.getElementById('event-banner');
const eventBannerTitle = document.getElementById('event-banner-title');
const eventBannerDesc  = document.getElementById('event-banner-desc');
const eventLabelEl     = document.getElementById('event-label');
const eventValEl       = document.getElementById('event-val');
const eventHudSection  = document.getElementById('event-hud-section');

/* ─── Constants ────────────────────────────────────────────────────────────── */
const PLAYER_SPEED   = 180;  // px/s
const PLAYER_HP      = 100;
const PLAYER_R       = 14;   // radius
const BULLET_SPEED   = 560;  // px/s
const BULLET_R       = 3;
const MAG_SIZE       = 12;
const RELOAD_TIME    = 1.8;  // seconds
const FIRE_RATE      = 0.13; // seconds between shots
const RECOIL_AMOUNT  = 0.06; // radians max random spread added per shot
const SPREAD_BASE    = 0.025;
const ENEMY_R        = 13;
const MUZZLE_LIFE    = 0.07; // s
const PARTICLE_LIFE  = 0.55; // s
const FOOTSTEP_INT   = 0.32; // s between footstep sounds

/* ─── Extreme event definitions ─────────────────────────────────────────────── */
const EXTREME_EVENT_INTERVAL = 120; // 2 min between events
const EXTREME_EVENT_DURATION = 30;  // each lasts 30 s
const EXTREME_EVENT_TYPES = [
  { id: 'airstrike',    label: 'AIRSTRIKE!',    color: '#e63946', desc: 'Bombs rain from above!' },
  { id: 'earthquake',   label: 'EARTHQUAKE!',   color: '#f4a261', desc: 'The ground shakes violently!' },
  { id: 'emp',          label: 'EMP BLAST!',    color: '#66fcf1', desc: 'Enemies cannot fire!' },
  { id: 'berserk',      label: 'BERSERK!',      color: '#c77dff', desc: 'Enemies are enraged — 2x speed & fire rate!' },
  { id: 'supply_drop',  label: 'SUPPLY DROP!',  color: '#4ade80', desc: 'Full health & ammo + passive regen!' },
  { id: 'toxic_gas',    label: 'TOXIC GAS!',    color: '#a3e635', desc: 'Poison fills the air!' },
  { id: 'darkness',     label: 'LIGHTS OUT!',   color: '#aaaaaa', desc: 'Visibility reduced!' },
  { id: 'rapid_fire',   label: 'RAPID FIRE!',   color: '#ffd166', desc: 'Unlimited rapid fire for 30s!' },
  { id: 'bullet_storm', label: 'BULLET STORM!', color: '#ff6b6b', desc: 'Enemies fire 3x faster!' },
  { id: 'bloodlust',    label: 'BLOODLUST!',    color: '#b91c1c', desc: 'Kills restore your health!' },
];

/* ─── Difficulty ─────────────────────────────────────────────────────────────── */
let difficulty = 'beginner';

const DIFFICULTY = {
  beginner: {
    label:          'BEGINNER',
    speedMult:      0.55,    // slow movement
    hpMult:         0.65,    // low HP
    fireRateMult:   2.0,     // higher = less frequent shots
    bulletSpread:   0.18,    // wide spread (inaccurate)
    detectionRange: 190,     // short sight & fire range
    stateInterval:  [1.4, 3.2], // slow reactions
  },
  skilled: {
    label:          'SKILLED',
    speedMult:      1.35,    // fast movement
    hpMult:         1.5,     // high HP
    fireRateMult:   0.65,    // lower = more frequent shots
    bulletSpread:   0.04,    // tight spread (accurate)
    detectionRange: 340,     // long sight & fire range
    stateInterval:  [0.3, 0.9], // fast reactions
  },
};

/* ─── Tile / map ────────────────────────────────────────────────────────────── */
const TILE = 40;
const COLS = W / TILE; // 20
const ROWS = H / TILE; // 14

// 0 = floor, 1 = wall/cover
const MAP_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
  [1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
  [1,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function isSolid(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return true;
  return MAP_TEMPLATE[ty][tx] === 1;
}

/* ─── Helper math ───────────────────────────────────────────────────────────── */
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
function normalise(dx, dy) {
  const m = Math.hypot(dx, dy) || 1;
  return [dx / m, dy / m];
}
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function randInt(lo, hi) { return Math.floor(rand(lo, hi + 1)); }
// Circle vs AABB tile collision slide
function circleVsMap(x, y, r, nx, ny) {
  const tx = Math.floor(nx / TILE);
  const ty = Math.floor(ny / TILE);
  // Try x then y separately
  if (!isSolid(Math.floor(nx / TILE), Math.floor(y / TILE))) {
    x = nx;
  }
  if (!isSolid(Math.floor(x / TILE), Math.floor(ny / TILE))) {
    y = ny;
  }
  return [x, y];
}

/* ─── Particle pool ─────────────────────────────────────────────────────────── */
const particles = [];
function spawnParticles(x, y, color, count, speed, spread, sizeRange, lifetime) {
  for (let i = 0; i < count; i++) {
    const angle = spread * (Math.random() - 0.5) * 2 * Math.PI + (spread === 1 ? Math.random() * Math.PI * 2 : 0);
    const s = rand(speed * 0.4, speed);
    particles.push({
      x, y,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      r: rand(sizeRange[0], sizeRange[1]),
      color,
      life: lifetime,
      maxLife: lifetime,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.88;
    p.vy *= 0.88;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ─── Decals (bullet holes / blood stains) ──────────────────────────────────── */
const decals = [];
function spawnDecal(x, y, type) {
  if (decals.length > 120) decals.shift();
  decals.push({ x, y, type, alpha: 0.7 });
}
function drawDecals() {
  for (const d of decals) {
    ctx.globalAlpha = d.alpha;
    if (d.type === 'blood') {
      ctx.fillStyle = '#6b0f1a';
      ctx.beginPath();
      ctx.arc(d.x, d.y, rand(3, 6), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#c5c6c7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

/* ─── Muzzle flashes ─────────────────────────────────────────────────────────── */
const muzzleFlashes = [];
function spawnMuzzleFlash(x, y, angle) {
  muzzleFlashes.push({ x, y, angle, life: MUZZLE_LIFE });
}
function updateMuzzleFlashes(dt) {
  for (let i = muzzleFlashes.length - 1; i >= 0; i--) {
    muzzleFlashes[i].life -= dt;
    if (muzzleFlashes[i].life <= 0) muzzleFlashes.splice(i, 1);
  }
}
function drawMuzzleFlashes() {
  for (const m of muzzleFlashes) {
    const alpha = m.life / MUZZLE_LIFE;
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle);
    ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(8, 0, 1, 8, 0, 18);
    g.addColorStop(0, '#fff8c0');
    g.addColorStop(0.4, '#f4a261');
    g.addColorStop(1, 'rgba(244,162,97,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(8, 0, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

/* ─── Bullets ────────────────────────────────────────────────────────────────── */
const bullets = [];
function spawnBullet(x, y, angle, fromPlayer, customSpread) {
  const spreadAmt = fromPlayer ? SPREAD_BASE : (customSpread !== undefined ? customSpread : 0.08);
  const a = angle + rand(-spreadAmt, spreadAmt);
  bullets.push({
    x, y,
    vx: Math.cos(a) * BULLET_SPEED,
    vy: Math.sin(a) * BULLET_SPEED,
    fromPlayer,
    life: 1.4,
  });
  if (fromPlayer) spawnMuzzleFlash(x + Math.cos(angle) * (PLAYER_R + 4), y + Math.sin(angle) * (PLAYER_R + 4), angle);
}
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    // Wall hit
    if (isSolid(Math.floor(b.x / TILE), Math.floor(b.y / TILE))) {
      spawnParticles(b.x, b.y, '#c5c6c7', 3, 60, 0.4, [1, 2.5], 0.25);
      spawnDecal(b.x, b.y, 'hole');
      bullets.splice(i, 1);
      continue;
    }

    if (b.life <= 0) { bullets.splice(i, 1); continue; }
  }
}
function drawBullets() {
  ctx.fillStyle = '#ffd166';
  for (const b of bullets) {
    // Draw as short trail
    const tx = b.x - (b.vx / BULLET_SPEED) * 12;
    const ty = b.y - (b.vy / BULLET_SPEED) * 12;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

/* ─── Player ─────────────────────────────────────────────────────────────────── */
const player = {
  x: W / 2, y: H / 2,
  hp: PLAYER_HP,
  angle: 0,
  ammo: MAG_SIZE,
  reloading: false,
  reloadTimer: 0,
  fireCooldown: 0,
  score: 0,
  invincible: 0, // seconds of invincibility after hit
  bobTimer: 0,
  footstepTimer: 0,
  moving: false,
};

/* ─── Enemies ─────────────────────────────────────────────────────────────────── */
const enemies = [];
let wave = 0;
let waveEnemiesLeft = 0;
let betweenWaves = false;
let waveTimer = 0;

/* ─── Extreme event state ───────────────────────────────────────────────────── */
let extremeEventTimer = EXTREME_EVENT_INTERVAL;
let activeEvent       = null;  // event id string or null
let activeEventTimer  = 0;
let airstrikeTimer    = 0;
let toxicTimer        = 0;

const ENEMY_TYPES = {
  grunt: { hp: 28, speed: 72, color: '#e63946', fireRate: 1.8, dmg: 8,  score: 100, label: 'GRUNT' },
  heavy: { hp: 90, speed: 45, color: '#c77dff', fireRate: 2.5, dmg: 18, score: 350, label: 'HEAVY' },
  scout: { hp: 18, speed: 115, color: '#f4a261', fireRate: 1.2, dmg: 5,  score: 150, label: 'SCOUT' },
};

function spawnEnemy(type) {
  const def  = ENEMY_TYPES[type];
  const diff = DIFFICULTY[difficulty];
  const hp    = Math.round(def.hp * diff.hpMult);
  const speed = def.speed    * diff.speedMult;
  const fr    = def.fireRate * diff.fireRateMult;
  // Spawn along edges (outside player vision range)
  const side = randInt(0, 3);
  let x, y;
  switch (side) {
    case 0: x = rand(TILE * 1.5, W - TILE * 1.5); y = TILE * 1.5; break;
    case 1: x = rand(TILE * 1.5, W - TILE * 1.5); y = H - TILE * 1.5; break;
    case 2: x = TILE * 1.5; y = rand(TILE * 1.5, H - TILE * 1.5); break;
    default: x = W - TILE * 1.5; y = rand(TILE * 1.5, H - TILE * 1.5);
  }
  // Make sure not in wall
  if (isSolid(Math.floor(x / TILE), Math.floor(y / TILE))) {
    x = W / 2 + rand(-60, 60);
    y = H / 4;
  }
  enemies.push({
    ...def, type,
    x, y,
    hp, maxHp: hp,
    speed, fireRate: fr,
    spread: diff.bulletSpread,
    angle: 0,
    fireCooldown: rand(0.3, fr),
    hitFlash: 0,
    alertFlash: 0,
    stateTimer: rand(0, 1),
    state: 'patrol',
    strafeDir: Math.random() < 0.5 ? 1 : -1,
    strafeTimer: rand(0.5, 1.5),
  });
}

function startWave() {
  wave++;
  // 100 total bots across 5 waves: 10 + 15 + 20 + 25 + 30
  const WAVE_SIZES = [10, 15, 20, 25, 30];
  const count = WAVE_SIZES[Math.min(wave - 1, WAVE_SIZES.length - 1)];
  waveEnemiesLeft = count;
  betweenWaves = false;

  const types = ['grunt'];
  if (wave >= 2) types.push('scout');
  if (wave >= 3) types.push('heavy');

  for (let i = 0; i < count; i++) {
    const t = types[randInt(0, types.length - 1)];
    spawnEnemy(t);
  }
  showWaveFlash(`Wave ${wave}`);
  waveEl.textContent = wave;
}

function updateEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
    e.alertFlash = Math.max(0, e.alertFlash - dt * 2);

    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const d  = Math.hypot(dx, dy);
    e.angle  = Math.atan2(dy, dx);

    // State machine (difficulty-aware)
    const diff = DIFFICULTY[difficulty];
    e.stateTimer -= dt;
    if (e.stateTimer <= 0) {
      if (d < diff.detectionRange) {
        if (difficulty === 'beginner') {
          e.state = 'chase';  // beginners only chase
        } else {
          // skilled: chase, strafe, or flank
          const r = Math.random();
          e.state = r < 0.35 ? 'chase' : r < 0.65 ? 'strafe' : 'flank';
        }
      } else {
        e.state = 'patrol';
      }
      const [lo, hi] = diff.stateInterval;
      e.stateTimer = rand(lo, hi);
      e.strafeTimer = rand(0.4, 1.2);
    }

    // Movement
    const speedMult = activeEvent === 'berserk' ? 2 : 1;
    const eSpd = e.speed * speedMult;
    let mx = 0, my = 0;
    if (e.state === 'chase') {
      const [ndx, ndy] = normalise(dx, dy);
      mx = ndx * eSpd * dt;
      my = ndy * eSpd * dt;
    } else if (e.state === 'strafe') {
      // Perpendicular to player
      const perpX = -dy / (d || 1);
      const perpY =  dx / (d || 1);
      e.strafeTimer -= dt;
      if (e.strafeTimer <= 0) {
        e.strafeDir *= -1;
        e.strafeTimer = rand(0.4, 1.2);
      }
      mx = perpX * eSpd * dt * e.strafeDir;
      my = perpY * eSpd * dt * e.strafeDir;
      // Also close in a bit
      const [ndx, ndy] = normalise(dx, dy);
      if (d > 120) { mx += ndx * eSpd * 0.3 * dt; my += ndy * eSpd * 0.3 * dt; }
    } else if (e.state === 'flank') {
      // Skilled only: approach at an angle to outflank the player
      const flankAngle = e.angle + (Math.PI / 3) * e.strafeDir;
      e.strafeTimer -= dt;
      if (e.strafeTimer <= 0) {
        e.strafeDir *= -1;
        e.strafeTimer = rand(0.5, 1.5);
      }
      mx = Math.cos(flankAngle) * eSpd * dt;
      my = Math.sin(flankAngle) * eSpd * dt;
    } else {
      // Patrol: wander
      const wa = e.angle + Math.sin(e.stateTimer * 2.3) * 0.8;
      mx = Math.cos(wa) * eSpd * 0.4 * dt;
      my = Math.sin(wa) * eSpd * 0.4 * dt;
    }

    const [nx, ny] = circleVsMap(e.x, e.y, ENEMY_R, e.x + mx, e.y + my);
    e.x = nx; e.y = ny;

    // Shoot at player
    e.fireCooldown -= dt;
    if (activeEvent !== 'emp' && e.fireCooldown <= 0 && d < diff.detectionRange) {
      spawnBullet(e.x, e.y, e.angle, false, e.spread);
      const frMult = activeEvent === 'berserk' ? 0.5 : activeEvent === 'bullet_storm' ? 0.33 : 1;
      e.fireCooldown = e.fireRate * frMult + rand(-0.2, 0.3);
    }
  }
}

function drawEnemies() {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);

    // Shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(2, 4, ENEMY_R, ENEMY_R * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body
    const baseColor = e.hitFlash > 0 ? '#ffffff' : e.color;
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(0, 0, ENEMY_R, 0, Math.PI * 2);
    ctx.fill();

    // Darker centre
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, ENEMY_R * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Gun barrel direction
    ctx.strokeStyle = '#1f2833';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(e.angle) * (ENEMY_R + 8), Math.sin(e.angle) * (ENEMY_R + 8));
    ctx.stroke();

    // Health bar
    const barW = 28;
    const hpPct = e.hp / e.maxHp;
    ctx.fillStyle = '#1f2833';
    ctx.fillRect(-barW / 2, -ENEMY_R - 8, barW, 4);
    ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : hpPct > 0.25 ? '#ffd166' : '#e63946';
    ctx.fillRect(-barW / 2, -ENEMY_R - 8, barW * hpPct, 4);

    ctx.restore();
  }
}

/* ─── Input ──────────────────────────────────────────────────────────────────── */
const keys = {};
let mouseX = W / 2, mouseY = H / 2;
let mouseDown = false;

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase() === 'r' && !player.reloading && player.ammo < MAG_SIZE) startReload();
  e.preventDefault();
});
document.addEventListener('keyup',  e => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (W / r.width);
  mouseY = (e.clientY - r.top)  * (H / r.height);
});
canvas.addEventListener('mousedown', e => { if (e.button === 0) mouseDown = true; });
canvas.addEventListener('mouseup',   e => { if (e.button === 0) mouseDown = false; });
// Prevent right-click menu on canvas
canvas.addEventListener('contextmenu', e => e.preventDefault());

/* ─── Reload ─────────────────────────────────────────────────────────────────── */
function startReload() {
  if (player.reloading) return;
  player.reloading  = true;
  player.reloadTimer = RELOAD_TIME;
  updateAmmoUI();
}

/* ─── Shoot ──────────────────────────────────────────────────────────────────── */
function tryShoot() {
  const rapid = activeEvent === 'rapid_fire';
  if (!rapid && (player.fireCooldown > 0 || player.reloading)) return;
  if (!rapid && player.ammo <= 0) { startReload(); return; }
  const angle = Math.atan2(mouseY - player.y, mouseX - player.x);
  spawnBullet(player.x + Math.cos(angle) * (PLAYER_R + 2),
              player.y + Math.sin(angle) * (PLAYER_R + 2), angle, true);
  if (!rapid) {
    player.ammo--;
    player.fireCooldown = FIRE_RATE;
    updateAmmoUI();
  }
  // Screen shake
  addShake(1.5);
}

/* ─── Camera shake ───────────────────────────────────────────────────────────── */
let shakeAmt = 0;
function addShake(s) { shakeAmt = Math.min(shakeAmt + s, 10); }

/* ─── UI helpers ─────────────────────────────────────────────────────────────── */
function updateHealthUI() {
  const pct = Math.max(0, player.hp / PLAYER_HP);
  healthFill.style.width = (pct * 100) + '%';
  if (pct > 0.5) {
    healthFill.style.background = 'linear-gradient(90deg, #4ade80, #a3e635)';
  } else if (pct > 0.25) {
    healthFill.style.background = 'linear-gradient(90deg, #ffd166, #f4a261)';
  } else {
    healthFill.style.background = 'linear-gradient(90deg, #e63946, #ff6b6b)';
  }
}

function updateAmmoUI() {
  ammoPips.innerHTML = '';
  for (let i = 0; i < MAG_SIZE; i++) {
    const pip = document.createElement('div');
    pip.className = 'pip' + (i >= player.ammo ? ' empty' : '');
    ammoPips.appendChild(pip);
  }
}

function updateScoreUI() {
  scoreEl.textContent = player.score;
}

let waveFlashTimeout = null;
function showWaveFlash(text) {
  waveFlash.textContent = text;
  waveFlash.style.opacity = '1';
  if (waveFlashTimeout) clearTimeout(waveFlashTimeout);
  waveFlashTimeout = setTimeout(() => { waveFlash.style.opacity = '0'; }, 1600);
}

let killfeedId = 0;
function addKillfeed(label) {
  const el = document.createElement('div');
  el.className = 'kf-item';
  el.textContent = `${label} eliminated`;
  el.id = 'kf-' + (killfeedId++);
  killfeed.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 450);
  }, 1800);
}

/* ─── Extreme event logic ────────────────────────────────────────────────────── */
function showEventBanner(evDef) {
  eventBannerTitle.textContent = evDef.label;
  eventBannerTitle.style.color = evDef.color;
  eventBannerDesc.textContent  = evDef.desc;
  eventBanner.style.borderColor = evDef.color;
  eventBanner.classList.add('show');
  setTimeout(() => { eventBanner.classList.remove('show'); }, 2600);
}

function updateEventHUD() {
  if (activeEvent) {
    const evDef = EXTREME_EVENT_TYPES.find(e => e.id === activeEvent);
    eventLabelEl.textContent = evDef ? evDef.label : 'EVENT';
    eventLabelEl.style.color = evDef ? evDef.color : '#e63946';
    eventValEl.textContent   = Math.ceil(activeEventTimer) + 's';
    eventHudSection.classList.add('event-active');
  } else {
    eventLabelEl.textContent = 'NEXT EVENT';
    eventLabelEl.style.color = '';
    const mins = Math.floor(extremeEventTimer / 60);
    const secs = Math.floor(extremeEventTimer % 60);
    eventValEl.textContent   = `${mins}:${secs.toString().padStart(2, '0')}`;
    eventHudSection.classList.remove('event-active');
  }
}

function triggerExtremeEvent() {
  const evDef = EXTREME_EVENT_TYPES[randInt(0, EXTREME_EVENT_TYPES.length - 1)];
  activeEvent      = evDef.id;
  activeEventTimer = EXTREME_EVENT_DURATION;
  airstrikeTimer   = 0;
  toxicTimer       = 0;
  showEventBanner(evDef);
  // Instant effects
  if (activeEvent === 'supply_drop') {
    player.hp = PLAYER_HP;
    player.ammo = MAG_SIZE;
    player.reloading = false;
    updateHealthUI();
    updateAmmoUI();
  }
}

function updateExtremeEvents(dt) {
  if (!running) return;
  if (activeEvent) {
    activeEventTimer -= dt;
    switch (activeEvent) {
      case 'airstrike': {
        airstrikeTimer -= dt;
        if (airstrikeTimer <= 0) {
          airstrikeTimer = rand(0.25, 0.5);
          const ax = rand(TILE * 2, W - TILE * 2);
          const ay = rand(TILE * 2, H - TILE * 2);
          spawnParticles(ax, ay, '#f4a261', 18, 210, 1,    [3,  9], 0.75);
          spawnParticles(ax, ay, '#e63946', 10, 160, 0.7,  [2,  6], 0.55);
          spawnParticles(ax, ay, '#fff8c0',  5, 260, 0.45, [4, 10], 0.28);
          addShake(6);
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (dist(ax, ay, e.x, e.y) < 70) {
              e.hp -= randInt(20, 50);
              e.hitFlash = 1;
              if (e.hp <= 0) {
                player.score += e.score;
                updateScoreUI();
                spawnParticles(e.x, e.y, '#e63946', 18, 120, 1, [2, 5], 0.7);
                addKillfeed(ENEMY_TYPES[e.type].label);
                waveEnemiesLeft = Math.max(0, waveEnemiesLeft - 1);
                enemies.splice(i, 1);
              }
            }
          }
          if (player.invincible <= 0 && dist(ax, ay, player.x, player.y) < 70) {
            player.hp -= randInt(10, 25);
            player.invincible = 0.5;
            addShake(8);
            updateHealthUI();
            if (player.hp <= 0) { player.hp = 0; endGame(false); }
          }
        }
        break;
      }
      case 'earthquake': {
        addShake(rand(2, 5));
        if (Math.random() < 0.25) {
          spawnParticles(rand(0, W), rand(0, H), '#2a3545', 2, 45, 0.5, [1, 3], 0.35);
        }
        break;
      }
      case 'toxic_gas': {
        toxicTimer -= dt;
        if (toxicTimer <= 0) {
          toxicTimer = 0.5;
          if (player.invincible <= 0 &&
              !isSolid(Math.floor(player.x / TILE), Math.floor(player.y / TILE))) {
            player.hp -= 2;
            updateHealthUI();
            if (player.hp <= 0) { player.hp = 0; endGame(false); }
          }
          for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (!isSolid(Math.floor(e.x / TILE), Math.floor(e.y / TILE))) {
              e.hp -= 1;
              if (e.hp <= 0) {
                player.score += e.score;
                updateScoreUI();
                spawnParticles(e.x, e.y, '#a3e635', 10, 80, 1, [2, 4], 0.55);
                addKillfeed(ENEMY_TYPES[e.type].label);
                waveEnemiesLeft = Math.max(0, waveEnemiesLeft - 1);
                enemies.splice(i, 1);
              }
            }
          }
          spawnParticles(rand(0, W), rand(0, H), '#5fb515', 3, 25, 1, [3, 7], 1.4);
        }
        break;
      }
      case 'supply_drop': {
        player.hp = Math.min(PLAYER_HP, player.hp + 4 * dt);
        updateHealthUI();
        break;
      }
    }
    if (activeEventTimer <= 0) {
      activeEvent = null;
      extremeEventTimer = EXTREME_EVENT_INTERVAL;
      showWaveFlash('Event Over');
    }
  } else {
    extremeEventTimer -= dt;
    if (extremeEventTimer <= 0) triggerExtremeEvent();
  }
}

/* ─── Game state ─────────────────────────────────────────────────────────────── */
let running  = false;
let gameOver = false;
let lastTime = 0;

btnBeginner.addEventListener('click', () => {
  difficulty = 'beginner';
  startGame();
});
btnSkilled.addEventListener('click', () => {
  difficulty = 'skilled';
  startGame();
});

function startGame() {
  // Reset
  running  = true;
  gameOver = false;
  wave     = 0;
  betweenWaves = true;
  waveTimer    = 2.5; // first wave delay

  player.x = W / 2;
  player.y = H / 2;
  player.hp = PLAYER_HP;
  player.ammo = MAG_SIZE;
  player.reloading = false;
  player.reloadTimer = 0;
  player.fireCooldown = 0;
  player.score = 0;
  player.invincible = 0;

  enemies.length  = 0;
  bullets.length  = 0;
  particles.length = 0;
  muzzleFlashes.length = 0;
  decals.length   = 0;

  // Extreme events reset
  extremeEventTimer = EXTREME_EVENT_INTERVAL;
  activeEvent       = null;
  activeEventTimer  = 0;
  airstrikeTimer    = 0;
  toxicTimer        = 0;
  eventBanner.classList.remove('show');

  updateHealthUI();
  updateAmmoUI();
  updateScoreUI();
  updateEventHUD();
  waveEl.textContent = '-';
  killfeed.innerHTML = '';

  overlay.style.display = 'none';
  overlayRes.textContent = '';
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame(won) {
  running  = false;
  gameOver = true;
  overlay.style.display = 'flex';
  overlayTitle.textContent = won ? 'MISSION COMPLETE' : 'GAME OVER';
  const dLabel = DIFFICULTY[difficulty].label;
  overlaySub.textContent = won
    ? `All 100 bots eliminated! [${dLabel}] — Pick difficulty to play again`
    : `Survived ${wave} wave${wave !== 1 ? 's' : ''} [${dLabel}] — Pick difficulty to play again`;
  overlayRes.textContent = `Score: ${player.score}`;
}

/* ─── Collision: bullets vs entities ────────────────────────────────────────── */
function handleCollisions() {
  for (let bi = bullets.length - 1; bi >= 0; bi--) {
    const b = bullets[bi];

    if (b.fromPlayer) {
      // vs enemies
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (dist(b.x, b.y, e.x, e.y) < ENEMY_R + BULLET_R) {
          const dmg = randInt(8, 18);
          e.hp -= dmg;
          e.hitFlash = 1;
          spawnParticles(b.x, b.y, '#e63946', 5, 90, 0.3, [1.5, 3], PARTICLE_LIFE);
          spawnDecal(b.x, b.y, 'blood');
          bullets.splice(bi, 1);
          if (e.hp <= 0) {
            player.score += e.score;
            updateScoreUI();
            spawnParticles(e.x, e.y, '#e63946', 18, 120, 1, [2, 5], 0.7);
            addKillfeed(ENEMY_TYPES[e.type].label);
            if (activeEvent === 'bloodlust') {
              player.hp = Math.min(PLAYER_HP, player.hp + 15);
              updateHealthUI();
            }
            enemies.splice(ei, 1);
            waveEnemiesLeft = Math.max(0, waveEnemiesLeft - 1);
          }
          break;
        }
      }
    } else {
      // vs player
      if (player.invincible <= 0 && dist(b.x, b.y, player.x, player.y) < PLAYER_R + BULLET_R) {
        const src = enemies.find(() => true); // just use first as placeholder
        const dmg = src ? src.dmg : 10;
        player.hp -= dmg;
        player.invincible = 0.35;
        addShake(4);
        spawnParticles(b.x, b.y, '#e63946', 6, 80, 0.4, [2, 4], 0.4);
        bullets.splice(bi, 1);
        updateHealthUI();
        if (player.hp <= 0) {
          player.hp = 0;
          spawnParticles(player.x, player.y, '#e63946', 30, 130, 1, [2, 6], 0.9);
          endGame(false);
        }
      }
    }
  }
}

/* ─── Map drawing ────────────────────────────────────────────────────────────── */
const FLOOR_COLOR  = '#111318';
const FLOOR_GRID   = '#16191f';
const WALL_COLOR   = '#1f2833';
const WALL_TOP     = '#2a3545';

function drawMap() {
  // Floor
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, 0, W, H);

  // Subtle floor grid
  ctx.strokeStyle = FLOOR_GRID;
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Walls
  for (let ty = 0; ty < ROWS; ty++) {
    for (let tx = 0; tx < COLS; tx++) {
      if (MAP_TEMPLATE[ty][tx] === 1) {
        const px = tx * TILE, py = ty * TILE;
        // Side face
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(px, py, TILE, TILE);
        // Top highlight
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(px, py, TILE, 4);
        ctx.fillRect(px, py, 4, TILE);
        // Inner shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + TILE - 3, py, 3, TILE);
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
      }
    }
  }
}

/* ─── Player drawing ─────────────────────────────────────────────────────────── */
function drawPlayer() {
  const { x, y, angle, reloading, invincible, hp } = player;
  const alive = hp > 0;

  ctx.save();
  ctx.translate(x, y);

  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(2, 5, PLAYER_R, PLAYER_R * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Invincible flicker
  if (invincible > 0 && Math.floor(invincible * 12) % 2 === 0) {
    ctx.restore();
    return;
  }

  // Reloading ring
  if (reloading) {
    const pct = 1 - player.reloadTimer / RELOAD_TIME;
    ctx.strokeStyle = '#66fcf1';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(0, 0, PLAYER_R + 6, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Body
  ctx.fillStyle = '#45a29e';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_R, 0, Math.PI * 2);
  ctx.fill();

  // Inner
  ctx.fillStyle = '#66fcf1';
  ctx.beginPath();
  ctx.arc(0, 0, PLAYER_R * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Gun barrel
  ctx.rotate(angle);
  ctx.fillStyle = '#c5c6c7';
  ctx.fillRect(PLAYER_R - 2, -3, 14, 6);
  ctx.fillStyle = '#66fcf1';
  ctx.fillRect(PLAYER_R + 6, -1.5, 6, 3);

  ctx.restore();
}

/* ─── Crosshair ──────────────────────────────────────────────────────────────── */
function drawCrosshair() {
  const spread = player.reloading ? 20 : 6 + (player.fireCooldown / FIRE_RATE) * 10;
  const cx = mouseX, cy = mouseY;
  ctx.strokeStyle = '#66fcf1';
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.9;

  // Four lines
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * spread,       cy + Math.sin(a) * spread);
    ctx.lineTo(cx + Math.cos(a) * (spread + 8), cy + Math.sin(a) * (spread + 8));
    ctx.stroke();
  }
  // Center dot
  ctx.fillStyle = '#66fcf1';
  ctx.beginPath();
  ctx.arc(cx, cy, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
}

/* ─── Vignette ───────────────────────────────────────────────────────────────── */
function drawVignette() {
  const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
  const hp = player.hp / PLAYER_HP;
  let edgeAlpha = hp < 0.3 ? 0.65 : 0.25;
  if (activeEvent === 'darkness') edgeAlpha = Math.max(edgeAlpha, 0.88);
  const edgeRGB = hp < 0.3 ? '80,0,0' : '0,0,0';
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(${edgeRGB},${edgeAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  if (activeEvent === 'toxic_gas') {
    ctx.fillStyle = 'rgba(80,200,30,0.1)';
    ctx.fillRect(0, 0, W, H);
  }
}

/* ─── Main loop ──────────────────────────────────────────────────────────────── */
function loop(ts) {
  if (!running) return;
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  // Player aim
  player.angle = Math.atan2(mouseY - player.y, mouseX - player.x);

  // Player movement
  let mvx = 0, mvy = 0;
  if (keys['w'] || keys['arrowup'])    mvy -= 1;
  if (keys['s'] || keys['arrowdown'])  mvy += 1;
  if (keys['a'] || keys['arrowleft'])  mvx -= 1;
  if (keys['d'] || keys['arrowright']) mvx += 1;
  player.moving = (mvx !== 0 || mvy !== 0);

  if (player.moving) {
    const [nx, ny] = normalise(mvx, mvy);
    const spd = PLAYER_SPEED * dt;
    const [rx, ry] = circleVsMap(player.x, player.y, PLAYER_R,
      player.x + nx * spd, player.y + ny * spd);
    player.x = rx; player.y = ry;
    player.bobTimer += dt * 8;
  }

  // Footstep particles (dust)
  if (player.moving) {
    player.footstepTimer -= dt;
    if (player.footstepTimer <= 0) {
      player.footstepTimer = FOOTSTEP_INT;
      spawnParticles(player.x, player.y + PLAYER_R, '#2a3545', 2, 20, 0.6, [1.5, 3], 0.3);
    }
  }

  // Shoot
  if (mouseDown) tryShoot();
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invincible   = Math.max(0, player.invincible   - dt);

  // Reload
  if (player.reloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      player.reloading = false;
      player.ammo = MAG_SIZE;
      updateAmmoUI();
    }
  }

  // Shake decay
  shakeAmt = Math.max(0, shakeAmt - dt * 20);

  // Bullets & particles
  updateBullets(dt);
  updateParticles(dt);
  updateMuzzleFlashes(dt);
  handleCollisions();

  // Enemies
  updateEnemies(dt);

  // Wave management
  if (betweenWaves) {
    waveTimer -= dt;
    if (waveTimer <= 0) startWave();
  } else if (enemies.length === 0 && waveEnemiesLeft === 0) {
    if (wave >= 5) {
      endGame(true);
    } else {
      betweenWaves = true;
      waveTimer = 4;
      showWaveFlash('Wave Clear!');
    }
  }

  // Extreme events
  updateExtremeEvents(dt);
  updateEventHUD();
}

function draw() {
  // Camera shake
  ctx.save();
  if (shakeAmt > 0.1) {
    ctx.translate(rand(-shakeAmt, shakeAmt), rand(-shakeAmt, shakeAmt));
  }

  drawMap();
  drawDecals();
  drawParticles();
  drawBullets();
  drawMuzzleFlashes();
  drawEnemies();
  drawPlayer();
  drawVignette();
  drawCrosshair();

  ctx.restore();
}

/* ─── Init UI ────────────────────────────────────────────────────────────────── */
updateAmmoUI();
updateHealthUI();
