// Golden Hour Express — configuration.
// A side-view train heist at sunset: four carriages, one long horizontal world.
// All sizes are in world pixels; the canvas is 1280x720 and the camera follows Mara.

export const VIEW = { width: 1280, height: 720 };
export const FLOOR_Y = 560; // top of the carriage floor (feet stand here)
export const CEIL_Y = 250; // carriage ceiling line
export const WORLD = { width: 4480, height: 720 }; // 4 carriages x 1120

export const PLAYER = {
  width: 34,
  height: 78,
  walkSpeed: 235, // px per second
  sneakSpeed: 120,
  accel: 2400,
};

export const GUARD = {
  width: 36,
  height: 82,
  patrolSpeed: 85,
  chaseSpeed: 170,
  coneRange: 270, // px; halved inside a tunnel
  coneHalfAngle: 0.62, // radians either side of facing
  touchRange: 30,
};

export const CAMERA = {
  coneRange: 320,
  coneHalfAngle: 0.36,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 0.85, // radians either side of straight down
};

// Alarm: 0..100. Guard cone fills fast, camera cone slower, sneak halves the
// rate, blending stops it entirely. It decays when nobody can see Mara.
export const ALARM = {
  guardRate: 46,
  cameraRate: 20,
  sneakFactor: 0.5,
  decayRate: 13,
  chaseAt: 60, // guards start chasing above this
};

export const TIMER_SECONDS = 240; // the train reaches Halcyon Station
export const TUNNEL_PERIOD = 26; // seconds between tunnels
export const TUNNEL_LENGTH = 6; // seconds a tunnel lasts
export const BLEND_STILL_SECONDS = 0.5; // stand still this long to blend in
export const CASE_CRACK_SECONDS = 1.2; // hold E at the diamond case
export const LOOT_SLOW_PER_ITEM = 0.02; // each jewel slows Mara a little
export const DIAMOND_SLOW = 0.08;

// Carriages, left to right. Mara starts in First Class (right) and must reach
// the caboose door (left) with the Sun Diamond.
export const CARRIAGES = [
  { name: 'CABOOSE', from: 0, to: 1120, tint: '#3a2f4d', accent: '#c98a3d' },
  { name: 'VAULT CAR', from: 1120, to: 2240, tint: '#233246', accent: '#d8b25c' },
  { name: 'DINING CAR', from: 2240, to: 3360, tint: '#4a2c2c', accent: '#e07840' },
  { name: 'FIRST CLASS', from: 3360, to: 4480, tint: '#2c3a2e', accent: '#e8b64c' },
];

export const COLORS = {
  skyTop: '#2e1a4e',
  skyMid: '#c94f5e',
  skyLow: '#f2a35e',
  sun: '#ffd98a',
  hillFar: '#5a2f56',
  hillNear: '#3a2140',
  city: '#241631',
  trainBody: '#e8dcc0',
  trainStripe: '#2f6f6a',
  trainRoof: '#8a7a5c',
  floor: '#6b4a2f',
  floorEdge: '#4a3018',
  seat: '#7a2e35',
  seatDark: '#5c2027',
  guardUniform: '#232c3e',
  guardHat: '#1a2233',
  maraCoat: '#f2e6c8',
  maraScarf: '#c9333e',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneAlert: 'rgba(255, 70, 60, 0.30)',
  cameraCone: 'rgba(120, 220, 255, 0.16)',
  diamond: '#9be8ff',
  jewel: '#ffd24a',
  lamp: '#ffe9a8',
};
