import type { AntiCheatReviewAction, AntiCheatReviewStatus } from "./types";

export const COLLUSION_REVIEW_ORDER = [
  "flagged",
  "warn",
  "restrict",
  "ban",
] as const satisfies readonly AntiCheatReviewStatus[];

export function nextCollusionAction(
  current: AntiCheatReviewStatus,
): AntiCheatReviewAction | null {
  const currentIndex = COLLUSION_REVIEW_ORDER.indexOf(current);
  if (currentIndex < 0) {
    return null;
  }

  const next = COLLUSION_REVIEW_ORDER[currentIndex + 1];
  if (!next || next === "flagged") {
    return null;
  }

  return next;
}
