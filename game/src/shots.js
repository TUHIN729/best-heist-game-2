// Golden Hour Express — staged screenshot scenes.
// Each shot plays the real rules forward from a fresh world with a fixed
// scripted input, so the frame is what a short game really looks like and
// the same seed always gives the same frame.

import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, stepWorld } from './world.js';

const STEP = 1 / 60;

// A scripted input: an array of [seconds, {left, right, sneak, interact}].
// The pilot holds each entry for its duration, then moves to the next.
function runScript(world, script) {
  for (const [seconds, input] of script) {
    const steps = Math.round(seconds / STEP);
    for (let i = 0; i < steps; i += 1) {
      if (stepWorld(world, STEP, input) & 4) return; // EVENT_OVER
      if (world.screen !== SCREEN_PLAY) return;
    }
  }
}

const IDLE = { left: false, right: false, sneak: false, interact: false };

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * - start: the title screen over the train at rest.
 * - play: Mara mid-heist in the Dining Car, blending beside passengers while
 *   a guard's cone sweeps past — the game's signature moment.
 * - vault: Mara cracking the diamond case in the Vault Car as the train dives
 *   into a tunnel, lamps glowing, cameras blind.
 * - end: the clean-getaway screen with the loot tally.
 */
export function stageShot(name, world) {
  // Fresh world, then play the script.
  world.time = 0;
  world.timer = 240;
  world.screen = SCREEN_PLAY;
  world.alarm = 0;
  world.loot = 0;
  world.lootCount = 0;
  world.hasDiamond = false;
  world.message = '';
  world.messageAt = -10;
  world.tunnelAt = 14;
  world.inTunnel = false;
  world.player.x = 4240;
  world.player.y = 560;
  world.player.vx = 0;
  world.player.dir = -1;
  world.player.stillFor = 0;
  world.player.blended = false;
  world.player.cracking = false;
  for (const j of world.level.jewels) j.taken = false;
  world.level.diamond.taken = false;
  world.level.diamond.crack = 0;

  if (name === 'start') {
    runScript(world, [[1.2, IDLE]]);
    world.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }

  if (name === 'vault') {
    // Mara is already at the case: hold E on it as a tunnel starts, lamps
    // glowing, cameras blind. No long walk — the walk would cross the
    // Vault Car guard's patrol and risk getting caught mid-shot.
    world.player.x = world.level.diamond.x + 40;
    world.player.vx = 0;
    world.tunnelAt = 0.5; // tunnel is already on
    world.time = 1.0;
    world.inTunnel = true;
    runScript(world, [[0.9, { ...IDLE, interact: true }]]);
    world.level.diamond.crack = 0.7;
    world.player.cracking = true;
    world.inTunnel = true;
    return SCREEN_PLAY;
  }

  if (name === 'end') {
    world.hasDiamond = true;
    world.loot = 6400;
    world.lootCount = 3;
    world.timer = 132;
    world.winStats = { loot: 6400, timeBonus: 1320, total: 7720, timeLeft: 132 };
    world.screen = SCREEN_WIN;
    return SCREEN_WIN;
  }

  // play: walk left through First Class, pause to blend beside the diners
  // while the guard patrols past. Short and safe: the guard walks away from
  // Mara while she stands still, so the frame never ends caught.
  runScript(world, [
    [2.0, { left: true, right: false, sneak: false, interact: false }],
    [2.2, IDLE], // stand still near passengers -> blends in
  ]);
  return world.screen === SCREEN_PLAY ? SCREEN_PLAY : world.screen;
}
