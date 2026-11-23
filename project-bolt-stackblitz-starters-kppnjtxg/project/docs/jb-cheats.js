// =============================================================
//  JB PLAYNET  ·  "The Signal Below"  ·  console cheat kit
//
//  1. Start a run in the game.
//  2. Press F12 and open the Console tab.
//  3. Paste all of this, then press Enter.
//  4. Type jb.help() to see every cheat.
//
//  Gray lines starting with // are notes for humans.
//  The computer skips them, so read them first!
// =============================================================

window.jb = (() => {

  // ---------- PART 1 · Find the game's brain ----------
  // The game keeps everything in one object called the
  // "state": your health, your gold, the enemies...
  // React hides it from us, so we go hunting for it.
  const findGameBrain = () => {

    // Step A: find the page element React draws the game into.
    const rootElement = [...document.querySelectorAll('*')]
      .find(element => Object.keys(element)
        .some(key => key.startsWith('__reactContainer')));
    const rootKey = Object.keys(rootElement)
      .find(key => key.startsWith('__reactContainer'));

    // Step B: walk through React's pieces until we meet the
    // one that holds a player AND enemies. That piece is
    // the game's brain.
    let found = null;
    const search = (piece) => {
      while (piece && !found) {
        if (typeof piece.type === 'function' && piece.memoizedState) {
          const state = piece.memoizedState.memoizedState;
          if (state && state.player && state.enemies) {
            found = piece;
          }
        }
        if (piece.child) search(piece.child);
        piece = piece.sibling;
      }
    };
    search(rootElement[rootKey]);

    if (!found) {
      throw new Error('Start a run first. No game state found.');
    }
    return found;
  };


  // ---------- PART 2 · Read it and change it ----------
  // Look at the state without changing anything.
  const readState = () =>
    findGameBrain().memoizedState.memoizedState;

  // Give the game a new version of its state. This is the
  // game's own setState, so the screen updates normally.
  const changeState = (makeNewState) =>
    findGameBrain().memoizedState.queue.dispatch(makeNewState);

  // Change only the player (health, stamina...), keep the rest.
  const changePlayer = (makeChanges) =>
    changeState(state => ({
      ...state,
      player: { ...state.player, ...makeChanges(state.player) },
    }));

  // Change every enemy at once.
  const changeEnemies = (makeChanges) =>
    changeState(state => ({
      ...state,
      enemies: state.enemies.map(enemy => ({
        ...enemy,
        ...makeChanges(enemy),
      })),
    }));

  // Used by god mode below so it can be switched off again.
  let godModeTimer = null;


  // ---------- PART 3 · The cheats ----------
  // Each one is a little function you call: jb.heal()
  return {

    // ----- Look at things -----
    state: readState,

    me: () => {
      const state = readState();
      const player = state.player;
      return {
        hp: player.health + '/' + player.maxHealth,
        lvl: player.level,
        xp: player.xp,
        gold: state.carriedGold,
        gems: state.carriedDiamonds,
        kills: state.kills,
      };
    },

    enemies: () => console.table(
      readState().enemies.map(enemy => ({
        kind: enemy.kind,
        weapon: enemy.weapon,
        hp: enemy.health,
        dmg: enemy.damage,
        speed: enemy.speed,
      }))
    ),

    // ----- Help yourself -----
    heal: () => changePlayer(player => ({
      health: player.maxHealth,
      stamina: player.maxStamina,
    })),

    // God mode refills your health ten times a second,
    // so you never die.
    god: (on = true) => {
      clearInterval(godModeTimer);
      godModeTimer = on
        ? setInterval(() => changePlayer(player => ({
            health: player.maxHealth,
            stamina: player.maxStamina,
          })), 100)
        : null;
      return on ? 'GOD MODE ON' : 'god mode off';
    },

    tank: (hp = 9999) => changePlayer(() => ({
      maxHealth: hp,
      health: hp,
    })),

    gold: (amount = 1000) => changeState(state => ({
      ...state,
      carriedGold: state.carriedGold + amount,
    })),

    gems: (amount = 10) => changeState(state => ({
      ...state,
      carriedDiamonds: state.carriedDiamonds + amount,
    })),

    // ----- Mess with the enemies -----
    // Freezing remembers each enemy's speed to put it back.
    freeze: (on = true) => changeEnemies(enemy => on
      ? {
          savedSpeed: enemy.savedSpeed ?? enemy.speed,
          speed: 0,
          stunMs: 999999,
        }
      : {
          speed: enemy.savedSpeed ?? enemy.speed,
          stunMs: 0,
        }),

    slowmo: () => changeEnemies(enemy => ({
      speed: enemy.speed * 0.3,
    })),

    weak: () => changeEnemies(() => ({ health: 1, maxHealth: 1 })),
    nuke: () => changeEnemies(() => ({ health: 0 })),

    // ----- The menu -----
    help: () => console.log(
      '%cJB CHEATS',
      'font-size:18px;color:#4fd',
      `
jb.me()        your stats
jb.heal()      full HP + stamina
jb.god()       never die  (jb.god(false) = off)
jb.tank(9999)  huge max HP
jb.gold(1000)  add run gold
jb.gems(10)    add run gems
jb.enemies()   table of enemies
jb.freeze()    freeze enemies (jb.freeze(false) = unfreeze)
jb.slowmo()    slow enemies down
jb.weak()      enemies at 1 HP
jb.nuke()      zap every enemy`
    ),
  };
})();

jb.help();
