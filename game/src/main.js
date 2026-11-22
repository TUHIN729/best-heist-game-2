// Golden Hour Express — bootstrap, input and the game loop.
// Opens the canvas, wires keyboard and mouse, and runs the world at a fixed
// 60 Hz step. With ?shot=start|play|vault|end in the URL it stages that
// screenshot scene once and draws a single frame instead of playing.

import { VIEW } from './config.js';
import { render } from './render.js';
import { createWorld, resetWorld, stepWorld, SCREEN_PLAY, SCREEN_TITLE } from './world.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const world = createWorld(7);
let screen = SCREEN_TITLE;
world.screen = screen;

// --- tiny synth: pickup blip, alarm pulse, win arpeggio --------------------
let audioCtx = null;
let muted = false;
function beep(freq, dur, type = 'sine', gain = 0.08) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.stop(audioCtx.currentTime + dur);
  } catch (e) { /* no audio on this machine — the game plays fine silent */ }
}
function fanfare() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.22, 'triangle', 0.1), i * 110));
}

// --- input ------------------------------------------------------------------
const keys = new Set();
const input = { left: false, right: false, sneak: false, interact: false };

function readKeys() {
  input.left = keys.has('ArrowLeft') || keys.has('KeyA');
  input.right = keys.has('ArrowRight') || keys.has('KeyD');
  input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
  input.interact = keys.has('KeyE');
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
    event.preventDefault();
  }
  if (event.code === 'KeyM' && !event.repeat) {
    muted = !muted;
    return;
  }
  if (event.code === 'KeyR' && !event.repeat) {
    resetWorld(world);
    screen = SCREEN_TITLE;
    world.screen = screen;
    return;
  }
  if (screen === SCREEN_TITLE && (event.code === 'Enter' || event.code === 'Space')) {
    resetWorld(world);
    screen = SCREEN_PLAY;
    world.screen = SCREEN_PLAY;
    return;
  }
  if ((screen === 'win' || screen === 'caught') && (event.code === 'Enter' || event.code === 'Space')) {
    resetWorld(world);
    screen = SCREEN_TITLE;
    world.screen = SCREEN_TITLE;
    return;
  }
  keys.add(event.code);
});
window.addEventListener('keyup', (event) => keys.delete(event.code));
canvas.addEventListener('pointerdown', () => {
  if (screen === SCREEN_TITLE) {
    resetWorld(world);
    screen = SCREEN_PLAY;
    world.screen = SCREEN_PLAY;
  }
});

// --- screenshot mode ---------------------------------------------------------
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  screen = stageShot(shot, world);
  world.screen = screen;
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  render(ctx, world);
} else {
  // --- the live loop ---------------------------------------------------------
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;
  let lastEvents = 0;
  let alarmBeepAt = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (screen !== SCREEN_PLAY) {
      // Title and end screens still animate the sky and the train.
      world.time += dt;
      render(ctx, world);
      return;
    }
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      readKeys();
      const events = stepWorld(world, STEP, input);
      if (events & 1) beep(880, 0.12, 'sine', 0.09); // pickup
      if (events & 2) beep(220, 0.2, 'square', 0.05); // spotted
      if (events & 4) {
        if (world.screen === 'win') fanfare();
        else beep(140, 0.5, 'sawtooth', 0.08);
      }
      lastEvents = events;
      screen = world.screen;
      if (screen !== SCREEN_PLAY) break;
    }
    if (world.spotted && now - alarmBeepAt > 700) {
      alarmBeepAt = now;
      beep(330, 0.08, 'square', 0.03);
    }
    const car = world.player.x < 1120 ? 'CABOOSE' : world.player.x < 2240 ? 'VAULT CAR' : world.player.x < 3360 ? 'DINING CAR' : 'FIRST CLASS';
    statusEl.textContent = `Golden Hour Express — ${car}. Loot $${world.loot}. Alarm ${Math.round(world.alarm)}%. ${Math.ceil(world.timer)} seconds to Halcyon Station.`;
    render(ctx, world);
  }
  requestAnimationFrame(frame);
}
