# Golden Hour Express — a train heist

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/TUHIN729/best-heist-game-2/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/TUHIN729/best-heist-game-2/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)

One thief. One diamond. Four carriages of trouble.

Mara rides the sunset express to steal the Sun Diamond from the Vault Car,
then slip out of the caboose before the train reaches Halcyon Station. Guards
patrol with vision cones and cameras sweep the ceilings — but passengers are
cover: stand still beside a group and Mara blends in, invisible to every
cone. When the train dives into a tunnel the cameras go blind and the
guards can barely see. That is the moment to strike.

## How to play

- **← → / A D** — walk the train (right is First Class, left is the caboose)
- **SHIFT** — sneak: slower, but the alarm fills half as fast
- **E** — grab loot, hold to crack the diamond case, press at the caboose
  door to escape (only with the diamond)
- **R** — restart, **M** — mute

Every jewel you pocket slows you down a little — the diamond most of all.
The alarm rises while a guard or camera can see you and falls while you are
hidden; at 100% the whole train turns on you. You have 4 minutes before
Halcyon Station.

## Play it

Open `game/index.html` in a desktop browser (or run `node serve.ts` and
visit http://localhost:8080). No network, no build step, no install.

## Hand in

`main.ts` (Node 22, standard library only) copies `game/` and
`screenshots/` to `/output` and writes `/output/dossier.json`:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are real renders of the game's own code, staged with
`?shot=start|play|vault|end` (see `shots.json`).
