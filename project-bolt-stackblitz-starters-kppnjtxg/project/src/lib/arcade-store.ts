export type GameId = "snake" | "memory" | "tictactoe" | "2048" | "sniper" | "deep-signal";

export type ArcadeProfile = {
  displayName: string;
  avatar: string;
  theme: string;
  frame: string;
};

export type ArcadeState = {
  profile: ArcadeProfile;
  friends: string[];
  highScores: Partial<Record<GameId, number>>;
  totalGamesPlayed: number;
};

const STORAGE_KEY = "global-arcade-state-v1";

const DEFAULT_STATE: ArcadeState = {
  profile: {
    displayName: "Player One",
    avatar: "ARC",
    theme: "cosmic",
    frame: "neon",
  },
  friends: [],
  highScores: {},
  totalGamesPlayed: 0,
};

function isArcadeState(value: unknown): value is ArcadeState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ArcadeState>;
  return (
    !!state.profile &&
    typeof state.profile.displayName === "string" &&
    typeof state.profile.avatar === "string" &&
    typeof state.profile.theme === "string" &&
    typeof state.profile.frame === "string" &&
    Array.isArray(state.friends) &&
    state.friends.every((friend) => typeof friend === "string") &&
    !!state.highScores &&
    typeof state.highScores === "object" &&
    typeof state.totalGamesPlayed === "number"
  );
}

export function getArcadeState(): ArcadeState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(DEFAULT_STATE);
    const parsed: unknown = JSON.parse(saved);
    return isArcadeState(parsed) ? parsed : structuredClone(DEFAULT_STATE);
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveArcadeState(state: ArcadeState): ArcadeState {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Keep the in-memory experience usable when browser storage is unavailable.
    }
  }
  return state;
}

export function updateProfile(
  profile: Partial<ArcadeProfile>,
): ArcadeState {
  const current = getArcadeState();
  return saveArcadeState({
    ...current,
    profile: { ...current.profile, ...profile },
  });
}

export function addFriend(name: string): ArcadeState {
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return getArcadeState();
  const current = getArcadeState();
  const duplicate = current.friends.some(
    (friend) => friend.toLocaleLowerCase() === cleaned.toLocaleLowerCase(),
  );
  if (duplicate || cleaned.toLocaleLowerCase() === current.profile.displayName.toLocaleLowerCase()) {
    return current;
  }
  return saveArcadeState({ ...current, friends: [...current.friends, cleaned] });
}

export function removeFriend(name: string): ArcadeState {
  const current = getArcadeState();
  return saveArcadeState({
    ...current,
    friends: current.friends.filter((friend) => friend !== name),
  });
}

export function recordGameResult(game: GameId, score: number): ArcadeState {
  const current = getArcadeState();
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
  return saveArcadeState({
    ...current,
    totalGamesPlayed: current.totalGamesPlayed + 1,
    highScores: {
      ...current.highScores,
      [game]: Math.max(current.highScores[game] ?? 0, safeScore),
    },
  });
}
