"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

// Mock data (Should ideally be fetched or passed down)
// Consider moving this to a shared location if used by multiple components
const seasonsMatches = {
  "2024": [
    { id: "2024-match-1", result: 1, tournament: "2024-tournament-1", name: "Match 1", score: "3-2" },
    { id: "2024-match-2", result: 0, tournament: "2024-tournament-1", name: "Match 2", score: "1-2" },
    { id: "2024-match-3", result: 0.5, name: "Match 3", score: "2-2" },
    { id: "2024-match-4", result: 1, name: "Match 4", score: "4-1" },
    { id: "2024-match-5", result: 0.5, name: "Match 5", score: "0-0" },
    { id: "2024-match-6", result: 1, name: "Match 6", score: "2-1" },
    { id: "2024-match-7", result: 0, name: "Match 7", score: "0-1" },
  ],
  "2025": [
    { id: "2025-match-1", result: 1, tournament: "2025-tournament-1", name: "Match 1", score: "2-0" },
    { id: "2025-match-2", result: 1, name: "Match 2", score: "3-1" },
    { id: "2025-match-3", result: 1, name: "Match 3", score: "1-0" },
    { id: "2025-match-4", result: 0, name: "Match 4", score: "0-2" },
    { id: "2025-match-5", result: 0, name: "Match 5", score: "1-3" },
  ],
};

const tournaments = {
  "2024-tournament-1": { id: "2024-tournament-1", name: "Tournament 1", season: "2024" },
  "2025-tournament-1": { id: "2025-tournament-1", name: "Tournament 1", season: "2025" },
  // Add more tournaments if needed
};

// Helper to get result color and letter
const getResultStyle = (result: number) => {
  if (result === 1) return { color: "var(--win-color)", letter: "W" };
  if (result === 0) return { color: "var(--loss-color)", letter: "L" };
  return { color: "var(--draw-color)", letter: "D" };
};

interface SeasonDetailsProps {
  season: string;
  matchId: string | null;
}

const SeasonDetails: React.FC<SeasonDetailsProps> = ({ season, matchId }) => {
  // Type assertion for accessing matches and tournaments
  const matchesForSeason = (seasonsMatches as Record<string, any[]>)[season] || [];
  const tournamentsForSeason = Object.values(tournaments as Record<string, any>)
    .filter(t => t.season === season);

  // Group matches by tournament
  const matchesByTournament: Record<string, any[]> = {};
  matchesForSeason.forEach(match => {
    const tournamentId = match.tournament || 'independent'; // Group matches without a tournament
    if (!matchesByTournament[tournamentId]) {
      matchesByTournament[tournamentId] = [];
    }
    matchesByTournament[tournamentId].push(match);
  });


  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Season {season}</h1>
        <Link href="/" className="text-blue-500 hover:underline">
          &lt; Back to Dashboard
        </Link>
      </div>

      {tournamentsForSeason.length > 0 && tournamentsForSeason.map(tournament => (
        <Card key={tournament.id}>
          <CardHeader>
            <CardTitle>{tournament.name}</CardTitle>
            <CardDescription>Matches played in this tournament</CardDescription>
          </CardHeader>
          <CardContent>
            <MatchesTable matches={matchesByTournament[tournament.id] || []} highlightMatchId={matchId} />
          </CardContent>
        </Card>
      ))}

      {/* Display matches without a specific tournament */}
      {matchesByTournament['independent'] && matchesByTournament['independent'].length > 0 && (
         <Card>
          <CardHeader>
            <CardTitle>Other Matches</CardTitle>
            <CardDescription>Matches not associated with a specific tournament</CardDescription>
          </CardHeader>
          <CardContent>
            <MatchesTable matches={matchesByTournament['independent']} highlightMatchId={matchId} />
          </CardContent>
        </Card>
      )}

       {matchesForSeason.length === 0 && tournamentsForSeason.length === 0 && (
           <p>No tournaments or matches found for the {season} season.</p>
       )}

    </div>
  );
};

// Reusable table component for matches
const MatchesTable = ({ matches, highlightMatchId }: { matches: any[], highlightMatchId: string | null }) => {
  if (!matches || matches.length === 0) {
    return <p>No matches found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Result</TableHead>
          <TableHead>Match</TableHead>
          <TableHead>Score</TableHead>
          {/* Add other relevant columns like Opponent, Date, etc. later */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => {
          const { color, letter } = getResultStyle(match.result);
          const isHighlighted = match.id === highlightMatchId;
          return (
            <TableRow key={match.id} className={isHighlighted ? "bg-muted/50" : ""}>
              <TableCell>
                <span
                  className="font-bold w-6 h-6 flex items-center justify-center rounded-full text-white text-xs"
                  style={{ backgroundColor: color }}
                  title={letter === 'W' ? 'Win' : letter === 'L' ? 'Loss' : 'Draw'}
                >
                  {letter}
                </span>
              </TableCell>
              <TableCell>{match.name || `Match ${match.id}`}</TableCell>
              <TableCell>{match.score}</TableCell>
              {/* Render other cells */}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};


export default SeasonDetails;
