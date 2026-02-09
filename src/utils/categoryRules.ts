// Category-specific rules for each sport type

export interface CategoryRule {
  category: string;
  maxStarters: number;
  maxSubs: number;
  maxSquad: number;
  formations: string[];
  fieldType: 'football' | 'handball' | 'basketball' | 'futsal';
  halfDuration: number; // minutes per half
  periods: number; // number of periods (2 halves, 4 quarters, etc.)
}

export const CATEGORY_RULES: Record<string, CategoryRule> = {
  FOOTBALL: {
    category: 'FOOTBALL',
    maxStarters: 11,
    maxSubs: 7,
    maxSquad: 30,
    formations: [
      '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3',
      '4-5-1', '5-3-2', '5-4-1', '4-1-4-1', '4-4-1-1',
    ],
    fieldType: 'football',
    halfDuration: 45,
    periods: 2,
  },
  FUTSAL: {
    category: 'FUTSAL',
    maxStarters: 5,
    maxSubs: 7,
    maxSquad: 14,
    formations: [
      '1-2-2', '2-2', '1-2-1', '1-1-2', '1-3', '3-1', '2-1-1',
    ],
    fieldType: 'futsal',
    halfDuration: 20,
    periods: 2,
  },
  HANDBALL: {
    category: 'HANDBALL',
    maxStarters: 7,
    maxSubs: 7,
    maxSquad: 16,
    formations: [
      '3-2-1', '2-4', '3-3', '1-5', '4-2',
    ],
    fieldType: 'handball',
    halfDuration: 30,
    periods: 2,
  },
  BASKETBALL: {
    category: 'BASKETBALL',
    maxStarters: 5,
    maxSubs: 7,
    maxSquad: 12,
    formations: [
      '2-3', '3-2', '1-3-1', '2-1-2', '1-2-2',
    ],
    fieldType: 'basketball',
    halfDuration: 10,
    periods: 4,
  },
  NATIONAL: {
    category: 'NATIONAL',
    maxStarters: 11,
    maxSubs: 7,
    maxSquad: 30,
    formations: [
      '4-4-2', '4-3-3', '4-2-3-1', '3-5-2', '3-4-3',
      '4-5-1', '5-3-2', '5-4-1', '4-1-4-1', '4-4-1-1',
    ],
    fieldType: 'football',
    halfDuration: 45,
    periods: 2,
  },
};

export function getCategoryRules(category: string): CategoryRule {
  return CATEGORY_RULES[category] || CATEGORY_RULES['FOOTBALL'];
}

// Formation positions for FOOTBALL (11 players)
export const FOOTBALL_FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '4-4-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 45 }, { position: 'CM', x: 35, y: 50 }, { position: 'CM', x: 65, y: 50 }, { position: 'RM', x: 85, y: 45 },
    { position: 'ST', x: 35, y: 20 }, { position: 'ST', x: 65, y: 20 },
  ],
  '4-3-3': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 50, y: 55 }, { position: 'CM', x: 30, y: 45 }, { position: 'CM', x: 70, y: 45 },
    { position: 'LW', x: 20, y: 20 }, { position: 'ST', x: 50, y: 15 }, { position: 'RW', x: 80, y: 20 },
  ],
  '4-2-3-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 35, y: 55 }, { position: 'CDM', x: 65, y: 55 },
    { position: 'LW', x: 20, y: 35 }, { position: 'CAM', x: 50, y: 35 }, { position: 'RW', x: 80, y: 35 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '3-5-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'CB', x: 25, y: 75 }, { position: 'CB', x: 50, y: 75 }, { position: 'CB', x: 75, y: 75 },
    { position: 'LWB', x: 10, y: 50 }, { position: 'CM', x: 30, y: 50 }, { position: 'CM', x: 50, y: 45 }, { position: 'CM', x: 70, y: 50 }, { position: 'RWB', x: 90, y: 50 },
    { position: 'ST', x: 35, y: 20 }, { position: 'ST', x: 65, y: 20 },
  ],
  '3-4-3': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'CB', x: 25, y: 75 }, { position: 'CB', x: 50, y: 75 }, { position: 'CB', x: 75, y: 75 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 35, y: 50 }, { position: 'CM', x: 65, y: 50 }, { position: 'RM', x: 85, y: 50 },
    { position: 'LW', x: 20, y: 20 }, { position: 'ST', x: 50, y: 15 }, { position: 'RW', x: 80, y: 20 },
  ],
  '4-5-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 45 }, { position: 'CM', x: 35, y: 50 }, { position: 'CDM', x: 50, y: 55 }, { position: 'CM', x: 65, y: 50 }, { position: 'RM', x: 85, y: 45 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '5-3-2': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LWB', x: 10, y: 65 }, { position: 'CB', x: 30, y: 75 }, { position: 'CB', x: 50, y: 75 }, { position: 'CB', x: 70, y: 75 }, { position: 'RWB', x: 90, y: 65 },
    { position: 'CM', x: 30, y: 45 }, { position: 'CM', x: 50, y: 50 }, { position: 'CM', x: 70, y: 45 },
    { position: 'ST', x: 35, y: 20 }, { position: 'ST', x: 65, y: 20 },
  ],
  '5-4-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LWB', x: 10, y: 65 }, { position: 'CB', x: 30, y: 75 }, { position: 'CB', x: 50, y: 75 }, { position: 'CB', x: 70, y: 75 }, { position: 'RWB', x: 90, y: 65 },
    { position: 'LM', x: 20, y: 45 }, { position: 'CM', x: 40, y: 50 }, { position: 'CM', x: 60, y: 50 }, { position: 'RM', x: 80, y: 45 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '4-1-4-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'CDM', x: 50, y: 60 },
    { position: 'LM', x: 15, y: 40 }, { position: 'CM', x: 35, y: 45 }, { position: 'CM', x: 65, y: 45 }, { position: 'RM', x: 85, y: 40 },
    { position: 'ST', x: 50, y: 15 },
  ],
  '4-4-1-1': [
    { position: 'GK', x: 50, y: 90 },
    { position: 'LB', x: 15, y: 70 }, { position: 'CB', x: 35, y: 75 }, { position: 'CB', x: 65, y: 75 }, { position: 'RB', x: 85, y: 70 },
    { position: 'LM', x: 15, y: 50 }, { position: 'CM', x: 35, y: 55 }, { position: 'CM', x: 65, y: 55 }, { position: 'RM', x: 85, y: 50 },
    { position: 'CAM', x: 50, y: 30 },
    { position: 'ST', x: 50, y: 15 },
  ],
};

// Formation positions for FUTSAL (5 players)
export const FUTSAL_FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '1-2-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 30, y: 60 }, { position: 'FIX', x: 70, y: 60 },
    { position: 'ALA', x: 30, y: 30 }, { position: 'PIV', x: 70, y: 30 },
  ],
  '2-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 30, y: 60 }, { position: 'FIX', x: 70, y: 60 },
    { position: 'ALA', x: 30, y: 30 }, { position: 'PIV', x: 70, y: 30 },
  ],
  '1-2-1': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 50, y: 65 },
    { position: 'ALA', x: 25, y: 45 }, { position: 'ALA', x: 75, y: 45 },
    { position: 'PIV', x: 50, y: 22 },
  ],
  '1-1-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 50, y: 65 },
    { position: 'ALA', x: 50, y: 45 },
    { position: 'PIV', x: 30, y: 25 }, { position: 'PIV', x: 70, y: 25 },
  ],
  '1-3': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 50, y: 65 },
    { position: 'ALA', x: 20, y: 35 }, { position: 'ALA', x: 50, y: 30 }, { position: 'PIV', x: 80, y: 35 },
  ],
  '3-1': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 20, y: 60 }, { position: 'FIX', x: 50, y: 65 }, { position: 'FIX', x: 80, y: 60 },
    { position: 'PIV', x: 50, y: 25 },
  ],
  '2-1-1': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'FIX', x: 30, y: 65 }, { position: 'FIX', x: 70, y: 65 },
    { position: 'ALA', x: 50, y: 42 },
    { position: 'PIV', x: 50, y: 22 },
  ],
};

// Formation positions for HANDBALL (7 players)
export const HANDBALL_FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '3-2-1': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'LB', x: 15, y: 65 }, { position: 'CB', x: 50, y: 68 }, { position: 'RB', x: 85, y: 65 },
    { position: 'LW', x: 30, y: 42 }, { position: 'RW', x: 70, y: 42 },
    { position: 'PIV', x: 50, y: 22 },
  ],
  '2-4': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'LB', x: 30, y: 65 }, { position: 'RB', x: 70, y: 65 },
    { position: 'LW', x: 15, y: 38 }, { position: 'LH', x: 38, y: 35 }, { position: 'RH', x: 62, y: 35 }, { position: 'RW', x: 85, y: 38 },
  ],
  '3-3': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'LB', x: 20, y: 65 }, { position: 'CB', x: 50, y: 68 }, { position: 'RB', x: 80, y: 65 },
    { position: 'LW', x: 20, y: 35 }, { position: 'PIV', x: 50, y: 30 }, { position: 'RW', x: 80, y: 35 },
  ],
  '1-5': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'CB', x: 50, y: 68 },
    { position: 'LW', x: 10, y: 40 }, { position: 'LH', x: 30, y: 35 }, { position: 'PIV', x: 50, y: 30 }, { position: 'RH', x: 70, y: 35 }, { position: 'RW', x: 90, y: 40 },
  ],
  '4-2': [
    { position: 'GK', x: 50, y: 88 },
    { position: 'LB', x: 15, y: 65 }, { position: 'CB', x: 38, y: 68 }, { position: 'CB', x: 62, y: 68 }, { position: 'RB', x: 85, y: 65 },
    { position: 'LW', x: 35, y: 35 }, { position: 'RW', x: 65, y: 35 },
  ],
};

// Formation positions for BASKETBALL (5 players)
export const BASKETBALL_FORMATION_POSITIONS: Record<string, { position: string; x: number; y: number }[]> = {
  '2-3': [
    { position: 'PG', x: 50, y: 80 },
    { position: 'SG', x: 25, y: 60 }, { position: 'SF', x: 75, y: 60 },
    { position: 'PF', x: 30, y: 35 }, { position: 'C', x: 70, y: 35 },
  ],
  '3-2': [
    { position: 'PG', x: 50, y: 80 },
    { position: 'SG', x: 20, y: 58 }, { position: 'SF', x: 50, y: 55 }, { position: 'PF', x: 80, y: 58 },
    { position: 'C', x: 50, y: 30 },
  ],
  '1-3-1': [
    { position: 'PG', x: 50, y: 80 },
    { position: 'SG', x: 20, y: 55 }, { position: 'SF', x: 50, y: 50 }, { position: 'PF', x: 80, y: 55 },
    { position: 'C', x: 50, y: 25 },
  ],
  '2-1-2': [
    { position: 'PG', x: 30, y: 78 }, { position: 'SG', x: 70, y: 78 },
    { position: 'SF', x: 50, y: 50 },
    { position: 'PF', x: 30, y: 28 }, { position: 'C', x: 70, y: 28 },
  ],
  '1-2-2': [
    { position: 'PG', x: 50, y: 80 },
    { position: 'SG', x: 25, y: 58 }, { position: 'SF', x: 75, y: 58 },
    { position: 'PF', x: 30, y: 32 }, { position: 'C', x: 70, y: 32 },
  ],
};

// Get formation positions for a given category and formation
export function getFormationPositions(category: string, formation: string): { position: string; x: number; y: number }[] {
  const fieldType = getCategoryRules(category).fieldType;
  switch (fieldType) {
    case 'futsal':
      return FUTSAL_FORMATION_POSITIONS[formation] || [];
    case 'handball':
      return HANDBALL_FORMATION_POSITIONS[formation] || [];
    case 'basketball':
      return BASKETBALL_FORMATION_POSITIONS[formation] || [];
    case 'football':
    default:
      return FOOTBALL_FORMATION_POSITIONS[formation] || [];
  }
}
