// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'operator' | 'admin' | 'guest';
  avatar?: string;
  isGuest?: boolean;
}

// Team types
export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  primaryColor?: string;
  country?: string;
  players?: Player[];
}

// Player types
export interface Player {
  id: string;
  teamId: string;
  name: string;
  shirtNumber?: number;
  position?: string;
  imageUrl?: string;
  nationality?: string;
  team?: Team;
}

// Competition types
export type CompetitionType = 'football' | 'basketball' | 'futsal' | 'women' | 'national';

export interface Competition {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  country?: string;
  season?: string;
  type?: CompetitionType;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  _count?: {
    matches: number;
  };
}

// Match types
export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished';

export interface LineupPlayer {
  id: string;
  lineupId: string;
  playerId: string;
  position?: string;
  positionX?: number;
  positionY?: number;
  isStarter: boolean;
  isCaptain: boolean;
  player?: Player;
}

export interface MatchLineup {
  id: string;
  matchId: string;
  teamId: string;
  formation?: string;
  coach?: string;
  team?: Team;
  players?: LineupPlayer[];
}

export interface MatchStats {
  id: string;
  matchId: string;
  homePossession?: number;
  awayPossession?: number;
  homeShots?: number;
  awayShots?: number;
  homeShotsOnTarget?: number;
  awayShotsOnTarget?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeYellowCards?: number;
  awayYellowCards?: number;
  homeRedCards?: number;
  awayRedCards?: number;
  homeOffsides?: number;
  awayOffsides?: number;
}

export interface Match {
  id: string;
  competitionId?: string;
  homeTeamId: string;
  awayTeamId: string;
  startTime: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  currentMinute?: number;
  isFeatured: boolean;
  venue?: string;
  referee?: string;
  homeTeam: Team;
  awayTeam: Team;
  competition?: Competition;
  events?: MatchEvent[];
  lineups?: MatchLineup[];
  stats?: MatchStats;
}

// Event types
export type EventType =
  | 'goal'
  | 'foul'
  | 'yellow_card'
  | 'red_card'
  | 'substitution'
  | 'var_review'
  | 'penalty'
  | 'corner'
  | 'offside'
  | 'injury'
  | 'stop'
  | 'start_half'
  | 'end_half'
  | 'end_match';

export interface MatchEvent {
  id: string;
  matchId: string;
  minute: number;
  extraTime?: number;
  type: EventType;
  teamId?: string;
  playerId?: string;
  secondaryPlayerId?: string;
  posX?: number;
  posY?: number;
  description?: string;
  createdAt: string;
  player?: Player;
  secondaryPlayer?: Player;
  team?: Team;
  match?: Match;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Create event payload
export interface CreateEventPayload {
  matchId: string;
  minute: number;
  extraTime?: number;
  type: EventType;
  teamId?: string;
  playerId?: string;
  secondaryPlayerId?: string;
  posX?: number;
  posY?: number;
  description?: string;
}
