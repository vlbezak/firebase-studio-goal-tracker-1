"use client";

import { useSearchParams } from 'next/navigation';
import { useSoccerData } from '@/hooks/useSoccerData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { NoteTooltip } from '@/components/NoteTooltip';

interface FilteredMatch {
  id: string;
  date: string;
  teams: string[];
  score: number[];
  result: string;
  notes?: string;
}

interface FilteredTournament {
  id: string;
  name: string;
  matches: FilteredMatch[];
}

interface FilteredSeason {
  id: string;
  name: string;
  tournaments: FilteredTournament[];
}

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { seasons, loading, error } = useSoccerData();

  const filteredSeasons: FilteredSeason[] = React.useMemo(() => {
    if (!seasons) return [];

    const lowerCaseSearchQuery = searchQuery.toLowerCase();

    return seasons
      .map(season => {
        const filteredTournaments: FilteredTournament[] = season.tournaments
          .map(tournament => {
            const filteredMatches: FilteredMatch[] = tournament.matches.filter(match =>
              match.teams.some(team => team.toLowerCase().includes(lowerCaseSearchQuery))
            );

            if (filteredMatches.length > 0) {
              return {
                ...tournament,
                matches: filteredMatches,
              };
            }
            return null;
          })
          .filter((tournament): tournament is FilteredTournament => tournament !== null);

        if (filteredTournaments.length > 0) {
          return {
            ...season,
            tournaments: filteredTournaments,
          };
        }
        return null;
      })
      .filter((season): season is FilteredSeason => season !== null);
  }, [seasons, searchQuery]);

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
                      <TableHead className="w-[50px]">Score</TableHead>
                      <TableHead className="w-[50px]">Result</TableHead>
                      <TableHead className="w-[40px] text-center">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournament.matches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="text-xs">{new Date(match.date).toLocaleDateString()}</TableCell>
                        <TableCell>{match.teams.join(" vs ")}</TableCell>
                        <TableCell>{match.score.join("-")}</TableCell>
                        <TableCell>{match.result}</TableCell>
                        <TableCell>
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