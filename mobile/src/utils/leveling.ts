/**
 * Leveling System Utilities
 * Calculates student levels based on points earned
 * Points are earned from star ratings: 1 star = 1 point (direct conversion)
 */

export interface LevelInfo {
  level: number;
  name: string;
  pointsRequired: number; // Renamed from starsRequired for clarity
  pointsForNextLevel: number; // Renamed from starsForNextLevel for clarity
  progress: number; // 0-1, progress toward next level
}

/**
 * Level definitions with thresholds and fun names
 */
interface LevelDefinition {
  level: number;
  name: string;
  pointsRequired: number;
  emoji: string;
}

const LEVEL_DEFINITIONS: LevelDefinition[] = [
  { level: 1, name: 'Math Explorer', pointsRequired: 0, emoji: '🌱' },
  { level: 2, name: 'Number Navigator', pointsRequired: 10, emoji: '⭐' },      // 10 points (3-5 activities)
  { level: 3, name: 'Counting Champion', pointsRequired: 25, emoji: '🏆' },    // 15 more (5-8 activities)
  { level: 4, name: 'Addition Ace', pointsRequired: 50, emoji: '🎯' },         // 25 more (8-13 activities)
  { level: 5, name: 'Subtraction Star', pointsRequired: 100, emoji: '⭐⭐' },    // 50 more (17-25 activities)
  { level: 6, name: 'Math Master', pointsRequired: 200, emoji: '👑' },          // 100 more (34-50 activities)
  { level: 7, name: 'Problem Solver Pro', pointsRequired: 350, emoji: '🧠' },   // 150 more (50-75 activities)
  { level: 8, name: 'Shape Specialist', pointsRequired: 550, emoji: '🔷' },     // 200 more (67-100 activities)
  { level: 9, name: 'Measurement Maestro', pointsRequired: 800, emoji: '📏' },  // 250 more (84-125 activities)
  { level: 10, name: 'Math Wizard', pointsRequired: 1200, emoji: '✨' },         // 400 more (134-200 activities)
];

/**
 * Calculate the current level based on points earned
 */
export function calculateLevel(points: number): number {
  if (points < 0) return 1;

  // Find the highest level the student has reached
  for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_DEFINITIONS[i].pointsRequired) {
      return LEVEL_DEFINITIONS[i].level;
    }
  }

  return 1;
}

/**
 * Get the fun name for a given level
 */
export function getLevelName(level: number): string {
  const definition = LEVEL_DEFINITIONS.find((def) => def.level === level);
  return definition ? definition.name : 'Math Explorer';
}

/**
 * Get the emoji for a given level
 */
export function getLevelEmoji(level: number): string {
  const definition = LEVEL_DEFINITIONS.find((def) => def.level === level);
  return definition ? definition.emoji : '🌱';
}

/**
 * Get the number of points required for a specific level
 */
export function getPointsRequiredForLevel(level: number): number {
  const definition = LEVEL_DEFINITIONS.find((def) => def.level === level);
  return definition ? definition.pointsRequired : 0;
}

/**
 * Get the number of points needed to reach the next level
 */
export function getPointsForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1;
  const nextLevelDef = LEVEL_DEFINITIONS.find((def) => def.level === nextLevel);
  const currentLevelDef = LEVEL_DEFINITIONS.find((def) => def.level === currentLevel);

  if (!nextLevelDef) {
    // Already at max level
    return 0;
  }

  if (!currentLevelDef) {
    return nextLevelDef.pointsRequired;
  }

  return nextLevelDef.pointsRequired - currentLevelDef.pointsRequired;
}

/**
 * Get complete level information including progress
 */
export function getLevelInfo(points: number): LevelInfo {
  const currentLevel = calculateLevel(points);
  const currentLevelDef = LEVEL_DEFINITIONS.find((def) => def.level === currentLevel);
  const nextLevelDef = LEVEL_DEFINITIONS.find((def) => def.level === currentLevel + 1);

  if (!currentLevelDef) {
    return {
      level: 1,
      name: 'Math Explorer',
      pointsRequired: 0,
      pointsForNextLevel: 10,
      progress: 0,
    };
  }

  // If at max level
  if (!nextLevelDef) {
    return {
      level: currentLevel,
      name: currentLevelDef.name,
      pointsRequired: currentLevelDef.pointsRequired,
      pointsForNextLevel: 0,
      progress: 1,
    };
  }

  // Calculate progress toward next level
  const pointsInCurrentLevel = points - currentLevelDef.pointsRequired;
  const pointsNeededForNext = nextLevelDef.pointsRequired - currentLevelDef.pointsRequired;
  const progress = Math.min(1, Math.max(0, pointsInCurrentLevel / pointsNeededForNext));

  return {
    level: currentLevel,
    name: currentLevelDef.name,
    pointsRequired: currentLevelDef.pointsRequired,
    pointsForNextLevel: pointsNeededForNext,
    progress,
  };
}

/**
 * Get the display text for a level (e.g., "Level 3: Counting Champion")
 */
export function getLevelDisplayText(level: number): string {
  const name = getLevelName(level);
  return `Level ${level}: ${name}`;
}

/**
 * Get the full display text with emoji (e.g., "Level 3: Counting Champion 🏆")
 */
export function getLevelDisplayTextWithEmoji(level: number): string {
  const name = getLevelName(level);
  const emoji = getLevelEmoji(level);
  return `Level ${level}: ${name} ${emoji}`;
}

