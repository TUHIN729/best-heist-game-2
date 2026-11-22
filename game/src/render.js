// Golden Hour Express — rendering.
// Everything is drawn on one canvas: a golden-hour sky with parallax hills and
// a little city, the four carriages of the train, and the people inside them.
// Guards show translucent vision cones (red when alerted); cameras sweep pale
// blue cones; Mara is the cream coat with the red scarf.

import {
  CAMERA, CARRIAGES, CEIL_Y, COLORS, FLOOR_Y, GUARD, VIEW, WORLD,
} from './config.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, carriageAt } from './world.js';

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, camX, inTunnel) {
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  if (inTunnel) {
    g.addColorStop(0, '#0a0812');
    g.addColorStop(1, '#171020');
  } else {
    g.addColorStop(0, COLORS.skyTop);
    g.addColorStop(0.55, COLORS.skyMid);
    g.addColorStop(1, COLORS.skyLow);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, 430);

  // Low sun, sliding slowly with the camera.
  const sunX = VIEW.width * 0.72 - (camX * 0.02 % 120);
  const sunY = inTunnel ? 420 : 300;
  ctx.fillStyle = COLORS.sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 217, 138, 0.25)';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 74, 0, Math.PI * 2);
  ctx.fill();

  // Parallax hills, two layers.
  for (const [par, color, base, amp] of [
    [0.08, COLORS.hillFar, 330, 46],
    [0.16, COLORS.hillNear, 372, 60],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    for (let x = 0; x <= VIEW.width; x += 16) {
      const wx = x + camX * par;
      const y = base + Math.sin(wx * 0.004) * amp + Math.sin(wx * 0.011) * amp * 0.4;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW.width, 430);
    ctx.closePath();
    ctx.fill();
  }

  // A little city skyline on the near layer, windows lit.
  ctx.fillStyle = COLORS.city;
  const off = (camX * 0.3) % 260;
  for (let i = -1; i < 7; i += 1) {
    const bx = i * 260 - off + 40;
    const bw = 120 + ((i * 53) % 60);
    const bh = 60 + ((i * 37) % 70);
    ctx.fillRect(bx, 430 - bh, bw, bh);
    if (!inTunnel) {
      ctx.fillStyle = 'rgba(255, 220, 130, 0.75)';
      for (let wy = 0; wy < 3; wy += 1) {
        for (let wx = 0; wx < 4; wx += 1) {
          if ((i * 7 + wy * 3 + wx) % 3 === 0) ctx.fillRect(bx + 12 + wx * 26, 430 - bh + 12 + wy * 22, 9, 12);
        }
      }
      ctx.fillStyle = COLORS.city;
    }
  }
}

function drawTrain(ctx, camX, world) {
  const inTunnel = world.inTunnel;
  // The train body spans the whole world; the camera only shows a slice.
  const x0 = -camX;
  // Roof.
  ctx.fillStyle = COLORS.trainRoof;
  ctx.fillRect(x0, CEIL_Y - 34, WORLD.width, 34);
  // Body.
  ctx.fillStyle = COLORS.trainBody;
  ctx.fillRect(x0, CEIL_Y, WORLD.width, FLOOR_Y - CEIL_Y + 46);
  // Teal stripe.
  ctx.fillStyle = COLORS.trainStripe;
  ctx.fillRect(x0, CEIL_Y + 96, WORLD.width, 16);
  // Floor.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(x0, FLOOR_Y, WORLD.width, 46);
  ctx.fillStyle = COLORS.floorEdge;
  ctx.fillRect(x0, FLOOR_Y, WORLD.width, 5);

  // Carriage dividers + names.
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  for (const c of CARRIAGES) {
    const wx = c.from - camX;
    ctx.fillStyle = '#241a10';
    ctx.fillRect(wx - 5, CEIL_Y - 34, 10, FLOOR_Y - CEIL_Y + 80);
    ctx.fillStyle = c.accent;
    ctx.fillText(c.name, wx + (c.to - c.from) / 2, CEIL_Y + 34);
    // Windows between dividers, warm in a tunnel, sunset-lit outside it.
    for (let wx2 = c.from + 90; wx2 < c.to - 80; wx2 += 190) {
      ctx.fillStyle = inTunnel ? COLORS.lamp : '#ffcf8a';
      roundRect(ctx, wx2 - camX, CEIL_Y + 44, 110, 44, 6);
      ctx.fill();
      ctx.fillStyle = 'rgba(60, 30, 10, 0.55)';
      ctx.fillRect(wx2 - camX + 52, CEIL_Y + 44, 6, 44);
    }
  }

  // Seats: little burgundy benches along the floor.
  for (let x = 60; x < WORLD.width; x += 180) {
    const sx = x - camX;
    if (sx < -120 || sx > VIEW.width + 120) continue;
    ctx.fillStyle = COLORS.seatDark;
    ctx.fillRect(sx, FLOOR_Y - 34, 96, 34);
    ctx.fillStyle = COLORS.seat;
    ctx.fillRect(sx, FLOOR_Y - 52, 96, 22);
  }

  // The diamond case in the Vault Car: a glass pedestal.
  const d = world.level.diamond;
  const dx = d.x - camX;
  ctx.fillStyle = '#2a2118';
  ctx.fillRect(dx - 34, FLOOR_Y - 84, 68, 84);
  ctx.fillStyle = 'rgba(155, 232, 255, 0.16)';
  roundRect(ctx, dx - 30, FLOOR_Y - 150, 60, 70, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (!d.taken) {
    const tw = 0.7 + Math.sin(world.time * 4) * 0.3;
    ctx.save();
    ctx.translate(dx, FLOOR_Y - 118);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.diamond;
    const s = 15 * tw;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    if (d.crack > 0) {
      ctx.fillStyle = '#222';
      ctx.fillRect(dx - 40, FLOOR_Y - 176, 80, 9);
      ctx.fillStyle = '#ff5a4a';
      ctx.fillRect(dx - 40, FLOOR_Y - 176, 80 * (d.crack / 1.2), 9);
    }
  }

  // Jewels: small gold sparkles on the floor line.
  for (const j of world.level.jewels) {
    if (j.taken) continue;
    const jx = j.x - camX;
    const tw = 0.6 + Math.sin(world.time * 5 + j.spark * 9) * 0.4;
    ctx.fillStyle = COLORS.jewel;
    ctx.beginPath();
    ctx.arc(jx, j.y, 7 * tw, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 210, 74, 0.35)';
    ctx.beginPath();
    ctx.arc(jx, j.y, 13 * tw, 0, Math.PI * 2);
    ctx.fill();
  }

  // Exit door in the caboose: green-lit doorway.
  const door = world.level.exitDoor;
  ctx.fillStyle = world.hasDiamond ? '#2fae5f' : '#3c5a48';
  roundRect(ctx, door.x - camX, door.y, door.width, door.height, 8);
  ctx.fill();
  ctx.fillStyle = '#eafff0';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText(world.hasDiamond ? 'EXIT — GO!' : 'EXIT', door.x - camX + 42, door.y + 52);
}

function drawCone(ctx, ox, oy, facing, half, range, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.arc(ox, oy, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fill();
}

function drawPerson(ctx, x, y, coat, opts = {}) {
  // Simple standing figure: coat, head, hat or hair. All characters are
  // drawn from the same little vocabulary so the frame reads at a glance.
  const { hat = false, scarf = false, sit = false, scale = 1 } = opts;
  const h = 78 * scale;
  const top = y - h;
  ctx.fillStyle = coat;
  if (sit) {
    roundRect(ctx, x - 13, top + 26, 26, h - 26, 6);
    ctx.fill();
  } else {
    roundRect(ctx, x - 14, top + 22, 28, h - 22, 8);
    ctx.fill();
  }
  // Head.
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(x, top + 12, 11, 0, Math.PI * 2);
  ctx.fill();
  if (hat) {
    ctx.fillStyle = '#1a2233';
    ctx.fillRect(x - 13, top + 2, 26, 6);
    ctx.fillRect(x - 9, top - 8, 18, 10);
  } else {
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(x, top + 8, 11, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  if (scarf) {
    ctx.fillStyle = COLORS.maraScarf;
    ctx.fillRect(x - 12, top + 22, 24, 7);
    ctx.fillRect(x + 4, top + 28, 7, 18);
  }
}

function drawActors(ctx, camX, world) {
  const p = world.player;
  const inTunnel = world.inTunnel;

  // Passengers first (they are the cover).
  for (const ps of world.level.passengers) {
    const px = ps.x - camX;
    if (px < -60 || px > VIEW.width + 60) continue;
    const bob = Math.sin(world.time * 1.4 + ps.bob) * 1.5;
    if (ps.kind === 'sit') {
      drawPerson(ctx, px, FLOOR_Y - 30 + bob, ps.hue, { sit: true, scale: 0.9 });
    } else {
      drawPerson(ctx, px, FLOOR_Y + bob, ps.hue, {});
    }
  }

  // Guards with their vision cones (cones under the figures).
  for (const g of world.level.guards) {
    const gx = g.x - camX;
    const eyeY = FLOOR_Y - 62;
    const range = GUARD.coneRange * (inTunnel ? 0.55 : 1);
    const facing = g.facing === 1 ? 0 : Math.PI;
    drawCone(ctx, gx, eyeY, facing, GUARD.coneHalfAngle, range,
      g.alert > 0.4 ? COLORS.coneAlert : COLORS.cone);
    if (gx < -320 || gx > VIEW.width + 320) continue;
    drawPerson(ctx, gx, FLOOR_Y, COLORS.guardUniform, { hat: true });
    // A small alert mark over a suspicious guard.
    if (g.alert > 0.4) {
      ctx.fillStyle = g.alert > 0.8 ? '#ff4a3a' : '#ffb02e';
      ctx.font = 'bold 26px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.alert > 0.8 ? '!' : '?', gx, FLOOR_Y - 96);
    }
  }

  // Cameras: little ceiling domes with sweeping pale cones.
  if (!inTunnel) {
    for (const cam of world.level.cameras) {
      const cx = cam.x - camX;
      drawCone(ctx, cx, cam.y, cam.angle, CAMERA.coneHalfAngle, CAMERA.coneRange, COLORS.cameraCone);
      ctx.fillStyle = '#20242e';
      ctx.beginPath();
      ctx.arc(cx, cam.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7dd8ff';
      ctx.beginPath();
      ctx.arc(cx, cam.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (const cam of world.level.cameras) {
      const cx = cam.x - camX;
      ctx.fillStyle = '#20242e';
      ctx.beginPath();
      ctx.arc(cx, cam.y, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(cx, cam.y + 4, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Mara: cream coat, red scarf. Crouched a little while sneaking; a soft
  // white ring while blended.
  const mx = p.x - camX;
  const my = FLOOR_Y;
  if (p.blended) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(mx, my - 40, 34, 46, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const sneakScale = p.sneaking ? 0.88 : 1;
  const walkBob = Math.abs(p.vx) > 20 ? Math.sin(world.time * 14) * 2 : 0;
  drawPerson(ctx, mx, my + walkBob, COLORS.maraCoat, { scarf: true, scale: sneakScale });
  // Facing: a little nose of the coat in the walking direction.
  ctx.fillStyle = COLORS.maraCoat;
  ctx.fillRect(mx + (p.dir === 1 ? 10 : -16), my - 52, 6, 26);
  if (p.cracking) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('CRACKING THE CASE…', mx, my - 108);
  }
}

function drawHud(ctx, world) {
  const p = world.player;
  // Top bar.
  ctx.fillStyle = 'rgba(12, 8, 20, 0.72)';
  ctx.fillRect(0, 0, VIEW.width, 58);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`LOOT  $${world.loot.toLocaleString()}`, 20, 37);
  if (world.hasDiamond) {
    ctx.fillStyle = COLORS.diamond;
    ctx.fillText('◆ SUN DIAMOND', 250, 37);
  }
  ctx.fillStyle = '#ffe9a8';
  const mins = Math.floor(world.timer / 60);
  const secs = Math.floor(world.timer % 60);
  ctx.fillText(`STATION IN ${mins}:${String(secs).padStart(2, '0')}`, 560, 37);
  const car = carriageAt(p.x);
  ctx.fillStyle = car.accent;
  ctx.fillText(car.name, 820, 37);
  // Tunnel indicator.
  ctx.fillStyle = world.inTunnel ? '#9be8ff' : '#c9b48a';
  ctx.fillText(
    world.inTunnel ? '● IN TUNNEL — cameras blind' : `TUNNEL IN ${Math.max(0, Math.ceil(world.tunnelIn))}s`,
    1000, 37,
  );

  // Alarm meter, bottom centre.
  const bw = 360;
  const bx = (VIEW.width - bw) / 2;
  const by = VIEW.height - 34;
  ctx.fillStyle = 'rgba(12, 8, 20, 0.72)';
  roundRect(ctx, bx - 90, by - 8, bw + 180, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', bx - 82, by + 10);
  ctx.fillStyle = '#3a2a2a';
  ctx.fillRect(bx, by, bw, 10);
  const frac = world.alarm / 100;
  ctx.fillStyle = frac < 0.5 ? '#e8b64c' : frac < 0.8 ? '#e07840' : '#ff3a2e';
  ctx.fillRect(bx, by, bw * frac, 10);
  if (p.blended) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('BLENDED IN', bx + bw + 12, by + 10);
  }
  if (p.sneaking) {
    ctx.fillStyle = '#9be8ff';
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillText('SNEAKING', bx + bw + 12, by + 10);
  }

  // Transient message.
  if (world.time - world.messageAt < 3 && world.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(12, 8, 20, 0.75)';
    const w = ctx.measureText(world.message).width + 36;
    roundRect(ctx, (VIEW.width - w) / 2, 74, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(world.message, VIEW.width / 2, 97);
  }

  // Controls reminder, bottom left, kept short so it never runs under the
  // alarm meter in the middle.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255, 233, 168, 0.75)';
  ctx.font = '14px Georgia, serif';
  ctx.fillText('← → move   SHIFT sneak   E grab / exit', 20, VIEW.height - 12);
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(10, 6, 18, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd98a';
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GOLDEN HOUR', VIEW.width / 2, 190);
  ctx.fillText('EXPRESS', VIEW.width / 2, 260);
  ctx.fillStyle = '#fff';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('One thief. One diamond. Four carriages of trouble.', VIEW.width / 2, 312);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = '#ffe9a8';
  const lines = [
    'Mara rides the sunset express to steal the Sun Diamond from the Vault Car,',
    'then slip out of the caboose before the train reaches Halcyon Station.',
    '',
    'Guards patrol with vision cones — cameras sweep the ceilings. Stand still',
    'beside passengers to blend in. When the train dives into a tunnel, the',
    'cameras go blind and the guards can barely see: that is your moment.',
    '',
    '← → / A D — move      SHIFT — sneak      E — grab loot / crack the case / exit',
    'R — restart      M — mute',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 360 + i * 26));
  ctx.fillStyle = '#9be8ff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('— press ENTER or click to board —', VIEW.width / 2, 640);
}

function drawEnd(ctx, world) {
  ctx.fillStyle = 'rgba(10, 6, 18, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  if (world.screen === SCREEN_WIN) {
    ctx.fillStyle = '#ffd98a';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText('CLEAN GETAWAY!', VIEW.width / 2, 220);
    const s = world.winStats || { loot: 0, timeBonus: 0, total: 0, timeLeft: 0 };
    ctx.fillStyle = '#fff';
    ctx.font = '24px Georgia, serif';
    ctx.fillText(`Loot  $${s.loot.toLocaleString()}`, VIEW.width / 2, 300);
    ctx.fillText(`Time bonus  $${s.timeBonus.toLocaleString()}  (${s.timeLeft}s to spare)`, VIEW.width / 2, 340);
    ctx.fillStyle = '#9be8ff';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(`TOTAL  $${s.total.toLocaleString()}`, VIEW.width / 2, 400);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '17px Georgia, serif';
    ctx.fillText('The Sun Diamond is gone before anyone knew it was there.', VIEW.width / 2, 460);
  } else {
    ctx.fillStyle = '#ff6a5a';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText('CAUGHT!', VIEW.width / 2, 220);
    ctx.fillStyle = '#fff';
    ctx.font = '22px Georgia, serif';
    ctx.fillText(world.caughtReason, VIEW.width / 2, 300);
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '20px Georgia, serif';
    ctx.fillText(`Loot kept: $${world.loot.toLocaleString()}`, VIEW.width / 2, 360);
  }
  ctx.fillStyle = '#9be8ff';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('— press R to try again —', VIEW.width / 2, 640);
}

export function render(ctx, world) {
  const p = world.player;
  const camX = clamp(p.x - VIEW.width / 2, 0, WORLD.width - VIEW.width);
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawSky(ctx, camX, world.inTunnel);
  drawTrain(ctx, camX, world);
  drawActors(ctx, camX, world);
  // Tunnel darkness washes over the train interior.
  if (world.inTunnel) {
    ctx.fillStyle = 'rgba(8, 6, 16, 0.35)';
    ctx.fillRect(0, CEIL_Y - 34, VIEW.width, FLOOR_Y - CEIL_Y + 80);
    // Warm lamps glow in the tunnel.
    for (let x = 120; x < VIEW.width; x += 260) {
      ctx.fillStyle = 'rgba(255, 233, 168, 0.08)';
      ctx.beginPath();
      ctx.arc(x, CEIL_Y + 40, 70, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (world.screen === SCREEN_PLAY) drawHud(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_WIN || world.screen === SCREEN_CAUGHT) drawEnd(ctx, world);
}
