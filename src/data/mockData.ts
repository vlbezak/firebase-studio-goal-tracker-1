
import type { Match, Tournament } from '@/types/soccer';

export const MOCK_SEASONS = ["2024", "2025"];

export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {
  "2024": [
    { id: "2024-match-1", date: "2024-03-15", name: "Match vs Lions", opponent: "Lions", score: "3-2", result: 1, tournamentId: "2024-tournament-1", ourTeam: "Eagles" },
    { id: "2024-match-2", date: "2024-03-16", name: "Match vs Tigers", opponent: "Tigers", score: "1-2", result: 0, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Tough game, good opponent." },
    { id: "2024-match-3", date: "2024-04-10", name: "Friendly vs Bears", opponent: "Bears", score: "2-2", result: 0.5, place: "Home Stadium", ourTeam: "Eagles" },
    { id: "2024-match-4", date: "2024-05-01", name: "Cup Match vs Wolves", opponent: "Wolves", score: "4-1", result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Great offensive display." },
    { id: "2024-match-5", date: "2024-05-02", name: "Cup Semifinal vs Sharks", opponent: "Sharks", score: "0-0", result: 0.5, tournamentId: "2024-cup-1", ourTeam: "Eagles" }, // Won on penalties, actual result draw
    { id: "2024-match-6", date: "2024-06-20", name: "League Opener vs Giants", opponent: "Giants", score: "2-1", result: 1, place: "Giants Arena", ourTeam: "Eagles" },
    { id: "2024-match-7", date: "2024-07-05", name: "Derby vs Hawks", opponent: "Hawks", score: "0-1", result: 0, place: "City Stadium", ourTeam: "Eagles", notes: "Disappointing result." },
  ],
  "2025": [
    { id: "2025-match-1", date: "2025-02-20", name: "Pre-season vs Knights", opponent: "Knights", score: "2-0", result: 1, place: "Training Ground", ourTeam: "Eagles" },
    { id: "2025-match-2", date: "2025-03-10", name: "Challenge Cup R1", opponent: "Dragons", score: "3-1", result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles" },
    { id: "2025-match-3", date: "2025-03-11", name: "Challenge Cup QF", opponent: "Phoenix", score: "1-0", result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles" },
    { id: "2025-match-4", date: "2025-04-05", name: "Friendly vs Stallions", opponent: "Stallions", score: "0-2", result: 0, place: "Away Ground", ourTeam: "Eagles", notes: "Need to improve defense." },
    { id: "2025-match-5", date: "2025-04-15", name: "Friendly vs Comets", opponent: "Comets", score: "1-3", result: 0, place: "Comet Park", ourTeam: "Eagles" },
  ],
};

export const MOCK_TOURNAMENTS: Record<string, Tournament> = {
  "2024-tournament-1": { id: "2024-tournament-1", name: "Spring Invitational", season: "2024", startDate: "2024-03-15", endDate: "2024-03-16", place: "Porec", finalStanding: 2, notes: "Good competitive tournament." },
  "2024-cup-1": { id: "2024-cup-1", name: "Summer Cup", season: "2024", startDate: "2024-05-01", endDate: "2024-05-02", place: "Veszprem", finalStanding: "Champions" },
  "2025-challenge-cup": { id: "2025-challenge-cup", name: "Challenge Cup", season: "2025", startDate: "2025-03-10", endDate: "2025-03-11", place: "Senec", finalStanding: 1, notes: "Team performed excellently." },
};
