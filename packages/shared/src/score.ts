import { SCREENSHOTS_PER_GAME, type ParsedScore } from './constants';

// Accepts formats: "2-1", "2-0", "3-2", etc.
const SCORE_REGEX = /^(\d+)-(\d+)$/;

export function parseScore(score: string): ParsedScore | null {
  const match = score.trim().match(SCORE_REGEX);
  if (!match) return null;

  const a = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);

  if (a <= b) return null; // winner must have more games

  const gamesPlayed = a + b;
  return {
    winnerGames: a,
    loserGames: b,
    gamesPlayed,
    expectedScreenshots: gamesPlayed * SCREENSHOTS_PER_GAME,
  };
}

export function formatScore(winnerGames: number, loserGames: number): string {
  return `${winnerGames}-${loserGames}`;
}
