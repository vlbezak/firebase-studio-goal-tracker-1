
"use client";

import { useSearchParams } from 'next/navigation';
import { useSoccerData } from '@/hooks/useSoccerData';
import type { Team } from '@/types/soccer'; // Import Team type
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { NoteTooltip } from '@/components/NoteTooltip';

interface FilteredMatch {
  id: string;
  date: string;
  teams: string[]; // [OurTeamName, OpponentTeamName]
  score: number[]; // [OurScore, OpponentScore]
  result: string;  // "WIN", "DRAW", "LOSS"
  notes?: string;
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

// Helper function to map numeric result to string
const mapResultToString = (result: number): string => {
    if (result === 1) return "WIN";
    if (result === 0.5) return "DRAW";
    if (result === 0) return "LOSS";
    return "UNKNOWN";
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

            const filteredMatches: FilteredMatch[] = matchesInThisTournament
              .filter(match => {
                const opponentTeamName = getTeamName(match.opponentTeamId, allTeamsList);
                const ourTeamName = getTeamName(match.ourTeamId, allTeamsList);
                return ourTeamName.toLowerCase().includes(lowerCaseSearchQuery) ||
                       opponentTeamName.toLowerCase().includes(lowerCaseSearchQuery);
              })
              .map(match => ({
                id: match.id,
                date: match.date,
                teams: [getTeamName(match.ourTeamId, allTeamsList), getTeamName(match.opponentTeamId, allTeamsList)],
                score: [match.ourScore, match.opponentScore],
                result: mapResultToString(match.result),
                notes: match.notes,
              }));

            if (filteredMatches.length > 0) {
              return {
                id: tournament.id,
                name: tournament.name,
                matches: filteredMatches,
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
                const ourTeamName = getTeamName(match.ourTeamId, allTeamsList);
                return ourTeamName.toLowerCase().includes(lowerCaseSearchQuery) ||
                       opponentTeamName.toLowerCase().includes(lowerCaseSearchQuery);
            })
            .map(match => ({
                id: match.id,
                date: match.date,
                teams: [getTeamName(match.ourTeamId, allTeamsList), getTeamName(match.opponentTeamId, allTeamsList)],
                score: [match.ourScore, match.opponentScore],
                result: mapResultToString(match.result),
                notes: match.notes,
            }));
        
        if (filteredIndependentMatches.length > 0) {
            // Add independent matches as a pseudo-tournament
            processedTournaments.push({
                id: `independent-${currentSeasonName}`, // Unique ID for pseudo-tournament
                name: "Other Matches", 
                matches: filteredIndependentMatches,
            });
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{searchQuery}"</h1>
      {filteredSeasons.length > 0 ? (
        filteredSeasons.map((season) => (
          <div key={season.id} className="mb-8">
            <h2 className="text-xl font-semibold mb-2">{season.name}</h2>
            {season.tournaments.map((tournament) => (
              <div key={tournament.id} className="mb-4">
                <h3 className="text-lg font-medium mb-2">{tournament.name}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Date</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead className="w-[50px] text-center">Score</TableHead>
                      <TableHead className="w-[50px] text-center">Result</TableHead>
                      <TableHead className="w-[40px] text-center">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="text-xs">{new Date(match.date).toLocaleDateString()}</TableCell>
                        <TableCell>{match.teams.join(" vs ")}</TableCell>
                        <TableCell className="text-center">{match.score.join(" - ")}</TableCell>
                        <TableCell className="text-center">{match.result}</TableCell>
                        <TableCell className="text-center">
                          {match.notes && <NoteTooltip notes={match.notes} />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No matches found for "{searchQuery}".</p>
      )}
    </div>
  );
};

export default SearchResultsPage;
