// Category-specific rules for each sport type

export interface CategoryRule {
  category: string;
  maxStarters: number;
  maxSubs: number;
  maxSquad: number;
  formations: string[];
  fieldType: 'football' | 'handball' | 'basketball' | 'futsal';
  halfDuration: number;
  periods: number;
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
    maxStarters: 6,
    maxSubs: 7,
    maxSquad: 14,
    formations: [
      '2-2-1', '1-2-2', '2-1-2', '1-3-1', '3-1-1', '2-3',
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

function normalizeCategoryKey(category?: string): string {
  if (!category) return 'FOOTBALL';

  const raw = category.trim();
  const upper = raw.toUpperCase().replace(/[-\s]+/g, '_');

  // Support common mini-football aliases and Arabic labels
  if (
    upper === 'FUTSAL' ||
    upper === 'MINI_FOOTBALL' ||
    upper === 'MINIFOOTBALL' ||
    raw.includes('مصغرة') ||
    raw.includes('مصغره')
  ) {
    return 'FUTSAL';
  }

  return upper;
}

export function getCategoryRules(category?: string): CategoryRule {
  const normalized = normalizeCategoryKey(category);
  return CATEGORY_RULES[normalized] || CATEGORY_RULES['FOOTBALL'];
}

// Formation position mappings per category (positionX, positionY in percentage 0-100)
export const FOOTBALL_FORMATION_POSITIONS: Record<string, { x: number; y: number; pos: string }[]> = {
  '4-4-2': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 15, y: 50, pos: 'LM' }, { x: 38, y: 53, pos: 'CM' }, { x: 62, y: 53, pos: 'CM' }, { x: 85, y: 50, pos: 'RM' },
    { x: 35, y: 28, pos: 'ST' }, { x: 65, y: 28, pos: 'ST' },
  ],
  '4-3-3': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 25, y: 52, pos: 'CM' }, { x: 50, y: 55, pos: 'CM' }, { x: 75, y: 52, pos: 'CM' },
    { x: 20, y: 28, pos: 'LW' }, { x: 50, y: 25, pos: 'ST' }, { x: 80, y: 28, pos: 'RW' },
  ],
  '4-2-3-1': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 35, y: 58, pos: 'CDM' }, { x: 65, y: 58, pos: 'CDM' },
    { x: 20, y: 40, pos: 'LW' }, { x: 50, y: 42, pos: 'CAM' }, { x: 80, y: 40, pos: 'RW' },
    { x: 50, y: 22, pos: 'ST' },
  ],
  '3-5-2': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 25, y: 75, pos: 'CB' }, { x: 50, y: 77, pos: 'CB' }, { x: 75, y: 75, pos: 'CB' },
    { x: 10, y: 52, pos: 'LWB' }, { x: 32, y: 55, pos: 'CM' }, { x: 50, y: 53, pos: 'CM' }, { x: 68, y: 55, pos: 'CM' }, { x: 90, y: 52, pos: 'RWB' },
    { x: 35, y: 28, pos: 'ST' }, { x: 65, y: 28, pos: 'ST' },
  ],
  '3-4-3': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 25, y: 75, pos: 'CB' }, { x: 50, y: 77, pos: 'CB' }, { x: 75, y: 75, pos: 'CB' },
    { x: 15, y: 52, pos: 'LM' }, { x: 40, y: 55, pos: 'CM' }, { x: 60, y: 55, pos: 'CM' }, { x: 85, y: 52, pos: 'RM' },
    { x: 20, y: 28, pos: 'LW' }, { x: 50, y: 25, pos: 'ST' }, { x: 80, y: 28, pos: 'RW' },
  ],
  '4-5-1': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 10, y: 50, pos: 'LM' }, { x: 30, y: 52, pos: 'CM' }, { x: 50, y: 50, pos: 'CM' }, { x: 70, y: 52, pos: 'CM' }, { x: 90, y: 50, pos: 'RM' },
    { x: 50, y: 25, pos: 'ST' },
  ],
  '5-3-2': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 10, y: 70, pos: 'LWB' }, { x: 30, y: 75, pos: 'CB' }, { x: 50, y: 77, pos: 'CB' }, { x: 70, y: 75, pos: 'CB' }, { x: 90, y: 70, pos: 'RWB' },
    { x: 25, y: 52, pos: 'CM' }, { x: 50, y: 50, pos: 'CM' }, { x: 75, y: 52, pos: 'CM' },
    { x: 35, y: 28, pos: 'ST' }, { x: 65, y: 28, pos: 'ST' },
  ],
  '5-4-1': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 10, y: 70, pos: 'LWB' }, { x: 30, y: 75, pos: 'CB' }, { x: 50, y: 77, pos: 'CB' }, { x: 70, y: 75, pos: 'CB' }, { x: 90, y: 70, pos: 'RWB' },
    { x: 15, y: 50, pos: 'LM' }, { x: 38, y: 52, pos: 'CM' }, { x: 62, y: 52, pos: 'CM' }, { x: 85, y: 50, pos: 'RM' },
    { x: 50, y: 25, pos: 'ST' },
  ],
  '4-1-4-1': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 50, y: 60, pos: 'CDM' },
    { x: 15, y: 42, pos: 'LM' }, { x: 38, y: 45, pos: 'CM' }, { x: 62, y: 45, pos: 'CM' }, { x: 85, y: 42, pos: 'RM' },
    { x: 50, y: 22, pos: 'ST' },
  ],
  '4-4-1-1': [
    { x: 50, y: 90, pos: 'GK' },
    { x: 15, y: 72, pos: 'LB' }, { x: 38, y: 75, pos: 'CB' }, { x: 62, y: 75, pos: 'CB' }, { x: 85, y: 72, pos: 'RB' },
    { x: 15, y: 52, pos: 'LM' }, { x: 38, y: 55, pos: 'CM' }, { x: 62, y: 55, pos: 'CM' }, { x: 85, y: 52, pos: 'RM' },
    { x: 50, y: 35, pos: 'CAM' },
    { x: 50, y: 22, pos: 'ST' },
  ],
};

export const FUTSAL_FORMATION_POSITIONS: Record<string, { x: number; y: number; pos: string }[]> = {
  '2-2-1': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 30, y: 68, pos: 'FIX' }, { x: 70, y: 68, pos: 'FIX' },
    { x: 30, y: 45, pos: 'ALA' }, { x: 70, y: 45, pos: 'ALA' },
    { x: 50, y: 22, pos: 'PIV' },
  ],
  '1-2-2': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 50, y: 68, pos: 'FIX' },
    { x: 25, y: 48, pos: 'ALA' }, { x: 75, y: 48, pos: 'ALA' },
    { x: 30, y: 25, pos: 'PIV' }, { x: 70, y: 25, pos: 'PIV' },
  ],
  '2-1-2': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 30, y: 68, pos: 'FIX' }, { x: 70, y: 68, pos: 'FIX' },
    { x: 50, y: 45, pos: 'ALA' },
    { x: 30, y: 22, pos: 'PIV' }, { x: 70, y: 22, pos: 'PIV' },
  ],
  '1-3-1': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 50, y: 68, pos: 'FIX' },
    { x: 20, y: 45, pos: 'ALA' }, { x: 50, y: 42, pos: 'ALA' }, { x: 80, y: 45, pos: 'ALA' },
    { x: 50, y: 22, pos: 'PIV' },
  ],
  '3-1-1': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 20, y: 68, pos: 'FIX' }, { x: 50, y: 70, pos: 'FIX' }, { x: 80, y: 68, pos: 'FIX' },
    { x: 50, y: 42, pos: 'ALA' },
    { x: 50, y: 22, pos: 'PIV' },
  ],
  '2-3': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 30, y: 65, pos: 'FIX' }, { x: 70, y: 65, pos: 'FIX' },
    { x: 20, y: 35, pos: 'ALA' }, { x: 50, y: 30, pos: 'PIV' }, { x: 80, y: 35, pos: 'ALA' },
  ],
};

export const HANDBALL_FORMATION_POSITIONS: Record<string, { x: number; y: number; pos: string }[]> = {
  '3-2-1': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 15, y: 65, pos: 'LB' }, { x: 50, y: 68, pos: 'CB' }, { x: 85, y: 65, pos: 'RB' },
    { x: 30, y: 42, pos: 'LW' }, { x: 70, y: 42, pos: 'RW' },
    { x: 50, y: 22, pos: 'PIV' },
  ],
  '2-4': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 30, y: 65, pos: 'LB' }, { x: 70, y: 65, pos: 'RB' },
    { x: 15, y: 38, pos: 'LW' }, { x: 38, y: 35, pos: 'LH' }, { x: 62, y: 35, pos: 'RH' }, { x: 85, y: 38, pos: 'RW' },
  ],
  '3-3': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 20, y: 65, pos: 'LB' }, { x: 50, y: 68, pos: 'CB' }, { x: 80, y: 65, pos: 'RB' },
    { x: 20, y: 35, pos: 'LW' }, { x: 50, y: 30, pos: 'PIV' }, { x: 80, y: 35, pos: 'RW' },
  ],
  '1-5': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 50, y: 68, pos: 'CB' },
    { x: 10, y: 40, pos: 'LW' }, { x: 30, y: 35, pos: 'LH' }, { x: 50, y: 30, pos: 'PIV' }, { x: 70, y: 35, pos: 'RH' }, { x: 90, y: 40, pos: 'RW' },
  ],
  '4-2': [
    { x: 50, y: 88, pos: 'GK' },
    { x: 15, y: 65, pos: 'LB' }, { x: 38, y: 68, pos: 'CB' }, { x: 62, y: 68, pos: 'CB' }, { x: 85, y: 65, pos: 'RB' },
    { x: 35, y: 35, pos: 'LW' }, { x: 65, y: 35, pos: 'RW' },
  ],
};

export const BASKETBALL_FORMATION_POSITIONS: Record<string, { x: number; y: number; pos: string }[]> = {
  '2-3': [
    { x: 50, y: 80, pos: 'PG' },
    { x: 25, y: 60, pos: 'SG' }, { x: 75, y: 60, pos: 'SF' },
    { x: 30, y: 35, pos: 'PF' }, { x: 70, y: 35, pos: 'C' },
  ],
  '3-2': [
    { x: 50, y: 80, pos: 'PG' },
    { x: 20, y: 58, pos: 'SG' }, { x: 50, y: 55, pos: 'SF' }, { x: 80, y: 58, pos: 'PF' },
    { x: 50, y: 30, pos: 'C' },
  ],
  '1-3-1': [
    { x: 50, y: 80, pos: 'PG' },
    { x: 20, y: 55, pos: 'SG' }, { x: 50, y: 50, pos: 'SF' }, { x: 80, y: 55, pos: 'PF' },
    { x: 50, y: 25, pos: 'C' },
  ],
  '2-1-2': [
    { x: 30, y: 78, pos: 'PG' }, { x: 70, y: 78, pos: 'SG' },
    { x: 50, y: 50, pos: 'SF' },
    { x: 30, y: 28, pos: 'PF' }, { x: 70, y: 28, pos: 'C' },
  ],
  '1-2-2': [
    { x: 50, y: 80, pos: 'PG' },
    { x: 25, y: 58, pos: 'SG' }, { x: 75, y: 58, pos: 'SF' },
    { x: 30, y: 32, pos: 'PF' }, { x: 70, y: 32, pos: 'C' },
  ],
};

// Get formation positions for a given category
export function getFormationPositions(category: string | undefined, formation: string): { x: number; y: number; pos: string }[] {
  const rules = getCategoryRules(category);
  switch (rules.fieldType) {
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
