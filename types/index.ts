// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'operator' | 'admin' | 'guest' | 'publisher' | 'delegate';
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
  category?: string;
  country?: string;
  city?: string;
  stadium?: string;
  coach?: string;
  coachImageUrl?: string;
  assistantCoach1?: string;
  assistantCoach1Image?: string;
  assistantCoach2?: string;
  assistantCoach2Image?: string;
  goalkeeperCoach?: string;
  goalkeeperCoachImage?: string;
  physio?: string;
  physioImage?: string;
  founded?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
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
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  preferredFoot?: string;
  team?: Team;
  statistics?: {
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    appearances: number;
  };
  recentGoals?: Array<{
    matchId: string;
    match?: any;
    minute: number;
  }>;
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
  format?: string;
  icon?: string;
  isActive?: boolean;
  sortOrder?: number;
  _count?: {
    matches: number;
  };
}

// Match types
export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'extra_time' | 'extra_time_halftime' | 'penalties' | 'finished';

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
  homePasses?: number;
  awayPasses?: number;
  homePassAccuracy?: number;
  awayPassAccuracy?: number;
  homeSaves?: number;
  awaySaves?: number;
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
  liveStartedAt?: string;
  secondHalfStartedAt?: string;
  updatedAt?: string;
  isFeatured: boolean;
  venue?: string;
  referee?: string;
  assistantReferee1?: string;
  assistantReferee2?: string;
  fourthReferee?: string;
  refereeRef?: { id: string; name: string; imageUrl?: string; nationality?: string; refereeType?: string };
  assistantReferee1Ref?: { id: string; name: string; imageUrl?: string; nationality?: string; refereeType?: string };
  assistantReferee2Ref?: { id: string; name: string; imageUrl?: string; nationality?: string; refereeType?: string };
  fourthRefereeRef?: { id: string; name: string; imageUrl?: string; nationality?: string; refereeType?: string };
  supervisorRef?: { id: string; name: string; imageUrl?: string; nationality?: string; refereeType?: string };
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
  | 'throw_in'
  | 'shot_on_target'
  | 'shot_off_target'
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
