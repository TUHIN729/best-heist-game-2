// Golden Hour Express — the world: level, actors, and the rules.
// Side view. Mara starts in First Class (right), must crack the diamond case
// in the Vault Car, then slip out through the caboose door (left) before the
// train reaches Halcyon Station. Guards patrol with vision cones; cameras
// sweep the ceilings; passengers are cover — stand still beside a group and
// Mara blends in. Tunnels dim the train and blind the cameras.

import {
  ALARM, BLEND_STILL_SECONDS, CAMERA, CARRIAGES, CASE_CRACK_SECONDS,
  DIAMOND_SLOW, FLOOR_Y, GUARD, LOOT_SLOW_PER_ITEM, PLAYER,
  TIMER_SECONDS, TUNNEL_LENGTH, TUNNEL_PERIOD, WORLD,
} from './config.js';
import { mulberry32, range } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_CAUGHT = 'caught';

export const EVENT_NONE = 0;
export const EVENT_PICKUP = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_OVER = 4;

function makeGuard(id, x, minX, maxX, facing) {
  return {
    id, x, y: FLOOR_Y, minX, maxX, dir: facing, speed: GUARD.patrolSpeed,
    facing, // -1 left, 1 right
    state: 'patrol', // patrol | chase
    alert: 0, // 0..1, how sure this guard is
    pause: 0, // seconds the guard stands still after bumping into Mara
    lost: 0, // seconds the guard is harmless after losing Mara's trail
  };
}

function makeCamera(id, x, baseAngle) {
  return { id, x, y: 262, baseAngle, angle: baseAngle, sweepDir: 1 };
}

function makePassenger(x, kind, seed) {
  const rng = mulberry32(seed);
  return {
    x, kind, // 'sit' | 'stand' | 'dine'
    hue: ['#b8574a', '#4a7a8c', '#7a5a9c', '#9c7a3a', '#3f7a4a'][Math.floor(rng() * 5)],
    bob: rng() * Math.PI * 2,
  };
}

function makeJewel(id, x, value, label) {
  return { id, x, y: FLOOR_Y - 46, value, label, taken: false, spark: Math.random() };
}

// The level: guards, cameras, passengers and loot, laid out by carriage.
export function buildLevel() {
  return {
    guards: [
      makeGuard('g1', 3900, 3520, 4360, -1), // First Class
      makeGuard('g2', 2900, 2380, 3240, 1), // Dining Car
      makeGuard('g3', 1680, 1260, 2120, -1), // Vault Car
      makeGuard('g4', 620, 140, 1000, 1), // Caboose
    ],
    cameras: [
      { id: 'c1', x: 2900, y: 262, baseAngle: Math.PI / 2, angle: Math.PI / 2, sweepDir: 1 },
      { id: 'c2', x: 1680, y: 262, baseAngle: Math.PI / 2, angle: Math.PI / 2, sweepDir: -1 },
      { id: 'c3', x: 700, y: 262, baseAngle: Math.PI / 2, angle: Math.PI / 2, sweepDir: 1 },
    ],
    passengers: [
      makePassenger(3600, 'sit', 11), makePassenger(3720, 'sit', 12),
      makePassenger(3980, 'stand', 13), makePassenger(4060, 'stand', 14),
      makePassenger(4240, 'sit', 15),
      makePassenger(2480, 'dine', 16), makePassenger(2560, 'dine', 17),
      makePassenger(2740, 'stand', 18), makePassenger(3100, 'dine', 19),
      makePassenger(3180, 'dine', 20),
      makePassenger(1340, 'stand', 21), makePassenger(1420, 'stand', 22),
      makePassenger(340, 'sit', 23), makePassenger(430, 'sit', 24),
    ],
    jewels: [
      makeJewel('j1', 3760, 600, 'Ruby Brooch'),
      makeJewel('j2', 2660, 450, 'Pearl Clutch'),
      makeJewel('j3', 3040, 800, 'Emerald Cuff'),
      makeJewel('j4', 1980, 500, 'Gold Watch'),
      makeJewel('j5', 880, 750, 'Sapphire Ring'),
      makeJewel('j6', 240, 400, 'Silver Locket'),
    ],
    diamond: { x: 1680, y: FLOOR_Y - 120, taken: false, crack: 0 },
    exitDoor: { x: 90, y: FLOOR_Y - 96, width: 84, height: 96 },
  };
}

export function carriageAt(x) {
  for (const c of CARRIAGES) if (x >= c.from && x < c.to) return c;
  return CARRIAGES[CARRIAGES.length - 1];
}

export function createWorld(seed = 7) {
  const level = buildLevel();
  return {
    seed,
    rng: mulberry32(seed),
    time: 0,
    timer: TIMER_SECONDS,
    screen: SCREEN_TITLE,
    player: {
      x: 4240, y: FLOOR_Y, vx: 0, dir: -1, sneaking: false,
      stillFor: 0, blended: false, cracking: false,
    },
    level,
    alarm: 0,
    spotted: false,
    loot: 0,
    lootCount: 0,
    hasDiamond: false,
    message: '',
    messageAt: -10,
    caughtReason: '',
    winStats: null,
    // Tunnel clock: first tunnel starts 14s in, then every TUNNEL_PERIOD.
    tunnelAt: 14,
    inTunnel: false,
    tunnelIn: 14,
    events: EVENT_NONE,
  };
}

export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  Object.assign(world, fresh);
}

// ---- helpers ---------------------------------------------------------------

function carriageWallsBetween(x1, x2) {
  // Carriage dividers block sight: cones never see through a wall.
  for (const c of CARRIAGES) {
    const wall = c.to;
    if (wall >= WORLD.width) continue;
    if ((x1 < wall && x2 > wall) || (x2 < wall && x1 > wall)) return true;
  }
  return false;
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Is the point (px, py) inside a cone from (ox, oy) facing `facing`
// (radians), with half-angle `half` and range `range`?
function inCone(ox, oy, facing, half, range, px, py) {
  const dx = px - ox;
  const dy = py - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 24) return true;
  return Math.abs(angleDiff(Math.atan2(dy, dx), facing)) <= half;
}

// ---- the step --------------------------------------------------------------

export function stepWorld(world, dt, input) {
  const p = world.player;
  const level = world.level;
  world.time += dt;
  world.timer = Math.max(0, world.timer - dt);
  world.events = EVENT_NONE;

  // Tunnel cycle.
  world.tunnelIn = world.tunnelAt - world.time;
  world.inTunnel = world.time >= world.tunnelAt && world.time < world.tunnelAt + TUNNEL_LENGTH;
  if (world.time >= world.tunnelAt + TUNNEL_LENGTH) world.tunnelAt += TUNNEL_PERIOD;

  // Movement. Sneaking is slower but halves how fast the alarm fills.
  const slow = 1 - world.lootCount * LOOT_SLOW_PER_ITEM - (world.hasDiamond ? DIAMOND_SLOW : 0);
  const speed = (input.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed) * Math.max(0.65, slow);
  p.sneaking = !!input.sneak;
  let move = 0;
  if (input.left) move -= 1;
  if (input.right) move += 1;
  const targetVx = move * speed;
  p.vx += Math.max(-PLAYER.accel * dt, Math.min(PLAYER.accel * dt, targetVx - p.vx));
  p.x = Math.max(24, Math.min(WORLD.width - 24, p.x + p.vx * dt));
  if (move !== 0) p.dir = move;

  // Standing still beside a passenger group blends Mara in.
  if (move === 0 && Math.abs(p.vx) < 8) {
    p.stillFor += dt;
  } else {
    p.stillFor = 0;
    p.blended = false;
  }
  if (!p.blended && p.stillFor >= BLEND_STILL_SECONDS) {
    const near = level.passengers.some((ps) => Math.abs(ps.x - p.x) < 150);
    if (near) {
      p.blended = true;
      world.message = 'BLENDED IN — guards walk right past';
      world.messageAt = world.time;
    }
  }

  // Guards patrol; above the chase threshold the nearest guard hunts Mara.
  const visionScale = world.inTunnel ? 0.55 : 1;
  let seen = false;
  let seenRate = 0;
  for (const g of level.guards) {
    if (g.lost > 0) g.lost -= dt;
    if (g.pause > 0) {
      // Standing still, staring suspiciously, after bumping into Mara.
      g.pause -= dt;
    } else if (world.alarm >= ALARM.chaseAt && !p.blended) {
      // Chase: run toward Mara — but a guard gives up if she opens up
      // real distance, or if she vanishes into a crowd of passengers.
      // A guard who loses her is harmless for a few seconds: he turns
      // away, scratches his head, and his cone stops raising the alarm.
      const dist = Math.abs(p.x - g.x);
      if (dist > 200) {
        g.state = 'patrol';
        g.alert = Math.max(0, g.alert - dt * 2);
        g.lost = 4;
        g.facing = p.x > g.x ? -1 : 1;
      } else {
        const dir = p.x > g.x ? 1 : -1;
        g.x += dir * GUARD.chaseSpeed * dt;
        g.facing = dir;
        g.state = 'chase';
      }
    } else {
      g.state = 'patrol';
      g.x += g.dir * g.speed * dt;
      if (g.x <= g.minX) { g.x = g.minX; g.dir = 1; g.facing = 1; }
      if (g.x >= g.maxX) { g.x = g.maxX; g.dir = -1; g.facing = -1; }
    }
    // Vision: cone from the guard's head, facing left or right. A guard who
    // just lost Mara's trail does not see her at all for a few seconds.
    const eyeY = FLOOR_Y - 62;
    const range = GUARD.coneRange * visionScale * (p.sneaking ? 0.7 : 1);
    const facingAngle = g.facing === 1 ? 0 : Math.PI;
    if (g.lost <= 0 && !p.blended && !carriageWallsBetween(g.x, p.x)
      && inCone(g.x, eyeY, facingAngle, GUARD.coneHalfAngle, range, p.x, FLOOR_Y - 40)) {
      seen = true;
      seenRate = Math.max(seenRate, ALARM.guardRate * (p.sneaking ? ALARM.sneakFactor : 1));
      // A guard grows sure slowly: a half-second glimpse is a bump warning,
      // two seconds of staring means he grabs her on touch.
      g.alert = Math.min(1, g.alert + dt * 0.8);
    } else {
      g.alert = Math.max(0, g.alert - dt * 0.5);
    }
    // Bumped into a guard. A casual bump is a warning — the alarm jumps,
    // Mara is knocked back and the guard stops to stare — but if the alarm
    // is already hot, or this guard is sure of her, the grab ends the run.
    // A guard who just lost her trail does not grab at all.
    if (g.lost <= 0 && Math.abs(g.x - p.x) < GUARD.touchRange && !p.blended) {
      if (world.alarm >= 40 || g.alert > 0.5) {
        world.screen = SCREEN_CAUGHT;
        world.caughtReason = 'A guard grabbed Mara by the arm.';
        return EVENT_OVER;
      }
      world.alarm = Math.min(100, world.alarm + 35);
      p.x = Math.max(24, Math.min(WORLD.width - 24, p.x + (p.x > g.x ? 70 : -70)));
      p.vx = 0;
      g.pause = 1.5;
      // The bump leaves the guard disoriented for a couple of seconds — he
      // cannot see or grab while he is figuring out what he just hit. The
      // alarm jump is the warning; the next touch is only lethal if he has
      // had time to grow sure of her again.
      g.lost = 2.5;
      world.message = 'BUMPED! The guard is suspicious — slip away!';
      world.messageAt = world.time;
      world.events |= EVENT_SPOTTED;
    }
  }

  // Cameras sweep; they are blind inside a tunnel.
  if (!world.inTunnel) {
    for (const cam of level.cameras) {
      cam.angle += cam.sweepDir * CAMERA.sweepSpeed * dt;
      const lo = cam.baseAngle - CAMERA.sweepArc;
      const hi = cam.baseAngle + CAMERA.sweepArc;
      if (cam.angle <= lo) { cam.angle = lo; cam.sweepDir = 1; }
      if (cam.angle >= hi) { cam.angle = hi; cam.sweepDir = -1; }
      if (!p.blended && !carriageWallsBetween(cam.x, p.x)
        && inCone(cam.x, cam.y, cam.angle, CAMERA.coneHalfAngle, CAMERA.coneRange, p.x, FLOOR_Y - 40)) {
        seen = true;
        seenRate = Math.max(seenRate, ALARM.cameraRate * (p.sneaking ? ALARM.sneakFactor : 1));
      }
    }
  }

  // Alarm rises while seen, decays while hidden. While a guard is already
  // chasing, the cones add alarm only slowly — the chase itself is the
  // consequence, and running clear of it has to be a real escape.
  const anyChase = level.guards.some((g) => g.state === 'chase');
  if (seen) {
    const rate = anyChase ? Math.min(seenRate, 5) : seenRate;
    world.alarm = Math.min(100, world.alarm + rate * dt);
    if (!world.spotted) {
      world.spotted = true;
      world.events |= EVENT_SPOTTED;
    }
  } else {
    world.spotted = false;
    world.alarm = Math.max(0, world.alarm - ALARM.decayRate * dt);
  }
  if (world.alarm >= 100) {
    world.screen = SCREEN_CAUGHT;
    world.caughtReason = 'The alarm hit 100% — the whole train turned on Mara.';
    return EVENT_OVER;
  }

  // Pick up jewels by walking over them.
  for (const j of level.jewels) {
    if (!j.taken && Math.abs(j.x - p.x) < 42) {
      j.taken = true;
      world.loot += j.value;
      world.lootCount += 1;
      world.message = `+ $${j.value} — ${j.label}`;
      world.messageAt = world.time;
      world.events |= EVENT_PICKUP;
    }
  }

  // Crack the diamond case: hold E beside it.
  const d = level.diamond;
  const nearDiamond = Math.abs(d.x - p.x) < 90;
  if (!d.taken && nearDiamond && input.interact) {
    d.crack += dt;
    p.cracking = true;
    if (d.crack >= CASE_CRACK_SECONDS) {
      d.taken = true;
      world.hasDiamond = true;
      world.loot += 5000;
      world.lootCount += 1;
      world.message = 'THE SUN DIAMOND IS YOURS — get to the caboose!';
      world.messageAt = world.time;
      world.events |= EVENT_PICKUP;
    }
  } else {
    d.crack = Math.max(0, d.crack - dt * 2);
    p.cracking = false;
  }

  // Win: reach the caboose door with the diamond and press E.
  const door = level.exitDoor;
  if (world.hasDiamond && Math.abs(p.x - door.x) < 70 && input.interact) {
    const timeBonus = Math.round(world.timer) * 10;
    world.winStats = {
      loot: world.loot,
      timeBonus,
      total: world.loot + timeBonus,
      timeLeft: Math.round(world.timer),
    };
    world.screen = SCREEN_WIN;
    return EVENT_OVER;
  }

  // The train arrives: out of time.
  if (world.timer <= 0) {
    world.screen = SCREEN_CAUGHT;
    world.caughtReason = 'The train pulled into Halcyon Station — police boarded.';
    return EVENT_OVER;
  }

  return world.events;
}
