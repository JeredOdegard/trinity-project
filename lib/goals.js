export const GOALS = [500, 1000, 5000, 10000];
export const RAIN_NAMES = ["", "a drizzle of cocoa", "a cocoa shower", "a cocoa downpour", "a cocoa storm"];

// level = number of goals reached (0..GOALS.length)
export function goalStatus(count) {
  const level = GOALS.filter((g) => count >= g).length;
  return { count, level, prev: GOALS[level - 1] ?? 0, next: GOALS[level] ?? null };
}
