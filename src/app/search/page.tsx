
"use client";

import { useSearchParams } from 'next/navigation';
import { useSoccerData } from '@/hooks/useSoccerData';
import type { Team } from '@/types/soccer'; // Import Team type
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { NoteTooltip } from '@/components/NoteTooltip';
import { getResultStyle, cn } from '@/lib/utils'; // Import getResultStyle and cn
import Link from 'next/link'; // Added Link import
import { Button } from '@/components/ui/button'; // Added Button import
import { ArrowLeft } from 'lucide-react'; // Added ArrowLeft icon

interface FilteredMatch {
  id: string;
  date: string;
  teams: string[]; // [OurTeamName, OpponentTeamName]
  score: number[]; // [OurScore, OpponentScore]
  result: number;  // Changed from string to number
  notes?: string;
  tournamentName?: string; // Optional: to display if the match belongs to a tournament
  seasonName?: string; // Optional: to display the season
}

interface FilteredTournament {
  id: string;
  name: string;
  matches: FilteredMatch[];
}

interface FilteredSeason {
  id: string; // Season name
  name: string; // Season name
  tournaments: FilteredTournament[];
}

// Helper function to get team name (can be moved to utils if used elsewhere)
const getTeamName = (teamId: string, teams: Team[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { 
    seasons: seasonNames, 
    matchesBySeason, 
    teams: allTeamsList, 
    tournaments: allTournamentsList, 
    loading, 
    error 
  } = useSoccerData();

  const filteredSeasons: FilteredSeason[] = React.useMemo(() => {
    if (loading || error || !seasonNames || !allTournamentsList || !matchesBySeason || !allTeamsList) return [];

    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return seasonNames
      .map(currentSeasonName => {
        const tournamentsForThisSeason = allTournamentsList.filter(t => t.season === currentSeasonName);
        const matchesForThisSeason = matchesBySeason[currentSeasonName] || [];

        const processedTournaments: FilteredTournament[] = tournamentsForThisSeason
          .map(tournament => {
            const matchesInThisTournament = matchesForThisSeason.filter(m => m.tournamentId === tournament.id);

            const filteredMatchesInTournament: FilteredMatch[] = matchesInThisTournament
              .filter(match => {
                const opponentTeamName = getTeamName(match.opponentTeamId, allTeamsList);
                return opponentTeamName.toLowerCase().includes(lowerCaseSearchQuery) ||
                       match.name.toLowerCase().includes(lowerCaseSearchQuery) || 
                       (match.notes && match.notes.toLowerCase().includes(lowerCaseSearchQuery)); 
              })
              .map(match => ({
                id: match.id,
                date: match.date,
                teams: [getTeamName(match.ourTeamId, allTeamsList), getTeamName(match.opponentTeamId, allTeamsList)],
                score: [match.ourScore, match.opponentScore],
                result: match.result, 
                notes: match.notes,
                tournamentName: tournament.name,
                seasonName: currentSeasonName,
              }));

            if (filteredMatchesInTournament.length > 0 || tournament.name.toLowerCase().includes(lowerCaseSearchQuery)) {
              return {
                id: tournament.id,
                name: tournament.name,
                matches: filteredMatchesInTournament,
              };
            }
            return null;
          })
          .filter((t): t is FilteredTournament => t !== null);

        // Handle independent matches for this season
        const independentMatchesForThisSeason = matchesForThisSeason.filter(m => !m.tournamentId);
        const filteredIndependentMatches: FilteredMatch[] = independentMatchesForThisSeason
            .filter(match => {
                const opponentTeamName = getTeamName(match.opponentTeamId, allTeamsList);
                return opponentTeamName.toLowerCase().includes(lowerCaseSearchQuery) ||
                       match.name.toLowerCase().includes(lowerCaseSearchQuery) ||
                       (match.notes && match.notes.toLowerCase().includes(lowerCaseSearchQuery));
            })
            .map(match => ({
                id: match.id,
                date: match.date,
                teams: [getTeamName(match.ourTeamId, allTeamsList), getTeamName(match.opponentTeamId, allTeamsList)],
                score: [match.ourScore, match.opponentScore],
                result: match.result,
                notes: match.notes,
                tournamentName: "Other Matches",
                seasonName: currentSeasonName,
            }));
        
        if (filteredIndependentMatches.length > 0) {
            let otherMatchesTournament = processedTournaments.find(pt => pt.id === `independent-${currentSeasonName}`);
            if (!otherMatchesTournament) {
                 otherMatchesTournament = {
                    id: `independent-${currentSeasonName}`,
                    name: "Other Matches", 
                    matches: [],
                };
                processedTournaments.push(otherMatchesTournament);
            }
            otherMatchesTournament.matches.push(...filteredIndependentMatches);
            otherMatchesTournament.matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        if (processedTournaments.length > 0) {
          return {
            id: currentSeasonName,
            name: currentSeasonName,
            tournaments: processedTournaments,
          };
        }
        return null;
      })
      .filter((s): s is FilteredSeason => s !== null);
  }, [seasonNames, allTournamentsList, matchesBySeason, allTeamsList, searchQuery, loading, error]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading search results...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error loading data: {error.message}</div>;
  }

  const allFilteredMatches: FilteredMatch[] = filteredSeasons.flatMap(season =>
    season.tournaments.flatMap(tournament => tournament.matches)
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Search Results for "{searchQuery}"</h1>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>
      {allFilteredMatches.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Match</TableHead>
              <TableHead className="w-[180px]">Tournament/Event</TableHead>
              <TableHead className="w-[80px] text-center">Score</TableHead>
              <TableHead className="w-[80px] text-center">Result</TableHead>
              <TableHead className="w-[50px] text-center">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allFilteredMatches.map((match) => {
               const { color, letter, label } = getResultStyle(match.result);
              return (
              <TableRow key={match.id}>
                <TableCell className="text-xs">{new Date(match.date).toLocaleDateString()}</TableCell>
                <TableCell>{match.teams.join(" vs ")}</TableCell>
                <TableCell className="text-xs">{match.tournamentName} ({match.seasonName})</TableCell>
                <TableCell className="text-center">{match.score.join(" - ")}</TableCell>
                <TableCell className="text-center">
                  <span
                    className="font-bold w-6 h-6 flex items-center justify-center rounded-full text-white text-xs shadow-sm mx-auto"
                    style={{ backgroundColor: color }}
                    title={label}
                  >
                    {letter}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {match.notes && <NoteTooltip notes={match.notes} />}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      ) : (
        <p>No matches found for "{searchQuery}".</p>
      )}
    </div>
  );
};

export default SearchResultsPage;

