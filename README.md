<p align="center">
  <img src="project-bolt-stackblitz-starters-kppnjtxg/project/docs/img/game.png" alt="The Signal Below: the title card over the first floor of the buried complex" width="860">
</p>

<h1 align="center">THE SIGNAL BELOW</h1>
<p align="center"><b>Something is still transmitting.</b></p>

<p align="center">
  <a href="https://signal.gamelab.link"><b>▶ PLAY NOW · signal.gamelab.link</b></a><br>
  <sub>Free · no account · runs in your browser · keyboard + mouse</sub>
</p>

---

A surveyor went missing beneath the ridge. You followed their distress signal into a buried complex, and the entrance sealed behind you.

**100 floors down, something is still sending that signal.** Go find out what.

## What you're in for

- 🏚️ **100 floors, never the same twice.** Every run builds a brand-new dungeon from dice rolls.
- 💀 **A boss every 10th floor.** The **Signal Sovereign** waits on Floor 100.
- 🛡️ **Wardens hit harder.** Watch the wind-up, then dodge or guard at the right moment.
- 💎 **Loot from Common to Legendary.** Better gear equips itself automatically, and the deeper you go, the luckier the drops.
- 🚪 **Bank it or risk it.** Every 5th floor is a safe room. Secure your loot, or carry it deeper for more. Fall in battle and you lose everything you didn't bank.
- 🔥 **Beat Floor 100?** Overdrive mode keeps going.

## Controls

| Action | Keys |
|---|---|
| Move | `W` `A` `S` `D` |
| Slash | `Left click` or `J` |
| Guard | `Right click` or `K` |
| Dodge | `Space` |
| Interact | `E` |
| Next floor | Clear the room, then walk to the lit door |

## The loot math (straight from the code)

Every drop rolls 0 to 100, plus a depth bonus of 0.45 per floor (it maxes out at 35). Here's what that means:

| Floor | Common | Uncommon | Rare | Epic | Legendary |
|---|---|---|---|---|---|
| 1 | 47.6% | 28% | 22% | 2.5% | **0%** |
| 50 | 25.5% | 28% | 22% | 20% | **4.5%** |
| 78+ | 13% | 28% | 22% | 20% | **17%** |

> Legendary gear **can't drop until floor 41**. How deep are you willing to go for it?

## Challenge the squad

Your best run is saved in your browser. **Screenshot it and drop it in the group chat.**

- Who can survive the **Guardian Chamber** on floor 10?
- Who's first to bank a **Legendary**?
- Who actually reaches the **Signal Sovereign**?

<p align="center">
  <img src="project-bolt-stackblitz-starters-kppnjtxg/project/docs/img/lobby.png" alt="The JB Playnet lobby: Something is still transmitting" width="760">
</p>

## 🔒 Coming soon: the vault

Five more games are already built and locked in the vault, waiting for launch:

**Snake** · **Memory** · **Tic-Tac-Toe** · **2048** · **Zombie Sniper** (3D)

## Peek inside the code

Want to see how it works, or build your own? Start with **[Signal Hacker](https://signal.gamelab.link/docs/)**, an interactive guide to this game's code in 11 stages: the game loop, the loot dice, the room generator, the save file, the vault, and a board of real bugs you can hunt.

<p align="center">
  <img src="project-bolt-stackblitz-starters-kppnjtxg/project/docs/img/guide.png" alt="Signal Hacker: You built a game. Now learn to hack it." width="760">
</p>

## Run it yourself

You'll need [Node.js](https://nodejs.org/).

```bash
cd project-bolt-stackblitz-starters-kppnjtxg/project
npm install
npm run dev
```

Then open the address it prints (usually `http://localhost:5173`).

## Where things live

```
project-bolt-stackblitz-starters-kppnjtxg/project/
├─ src/
│  ├─ App.tsx                        lobby, pages, and the router
│  ├─ components/BuriedComplexGame.tsx  the game screen: drawing + controls
│  └─ lib/deep-signal-engine.ts      the brain: rooms, enemies, loot, every frame
└─ docs/                             Signal Hacker + the Field Manual
```

## Built with

React · TypeScript · Vite · HTML canvas · three.js · Tailwind CSS

---

<p align="center"><b>JB Playnet</b> · Found a bug? <a href="https://github.com/Dadlorian/signal-below/issues">Open an issue</a> and it might end up on the bug-hunt board.</p>
