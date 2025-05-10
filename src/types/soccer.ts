
export interface Match {
  id: string;
  date: string; // YYYY-MM-DD
  name: string; // e.g., "Group Stage: Our Team vs Opponent Team", "Friendly: Team Y vs Team Z"
  opponent: string;
  ourScore: number; // Score of our team
  opponentScore: number; // Score of the opponent team
  score: string; // Combined score string, e.g., "3-2"
  result: number; // 1 for win, 0.5 for draw, 0 for loss
  tournamentId?: string; // ID of the tournament this match belongs to
  notes?: string;
  place?: string; // For independent matches or if match place differs from tournament
  ourTeam?: string; // Name of our team, defaults to "My Team"
}

export interface Tournament {
  id: string;
  name: string;
  season: string; // e.g., "2024"
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, optional for single-day tournaments
  place: string;
  notes?: string;
  finalStanding?: number | string; // e.g., 1, 2, "3rd", "Champions"
}

// Combined item for sorted display in SeasonDetails
export type SeasonDisplayItem =
  | { type: 'tournament'; data: Tournament; matches: Match[]; dateToSort: string; }
  | { type: 'independent_match'; data: Match; dateToSort: string; };
