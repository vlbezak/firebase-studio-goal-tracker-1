
"use client";

import { useSearchParams } from 'next/navigation';
import { useSoccerData } from '@/hooks/useSoccerData';
import type { Team } from '@/types/soccer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';
import { NoteTooltip } from '@/components/NoteTooltip';
import { getResultStyle, cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from '@/context/LanguageContext';

interface FilteredMatch {
  id: string;
  date: string;
  teams: string[]; 
  score: [number, number]; // Tuple for ourScore, opponentScore
  result: number;
  notes?: string;
  tournamentName?: string;
  seasonName?: string;
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

const getTeamName = (teamId: string, teams: Team[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const SearchResultsPage = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const t = useTranslations();
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
                tournamentName: t('otherMatches'),
                seasonName: currentSeasonName,
            }));
        
        if (filteredIndependentMatches.length > 0) {
            let otherMatchesTournament = processedTournaments.find(pt => pt.id === `independent-${currentSeasonName}`);
            if (!otherMatchesTournament) {
                 otherMatchesTournament = {
                    id: `independent-${currentSeasonName}`,
                    name: t('otherMatches'), 
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
  }, [seasonNames, allTournamentsList, matchesBySeason, allTeamsList, searchQuery, loading, error, t]);

  if (loading) {
    return <div className="container mx-auto p-4">{t('loadingSearchResults')}</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{t('errorLoadingData', { error: error.message })}</div>;
  }

  const allFilteredMatches: FilteredMatch[] = filteredSeasons.flatMap(season =>
    season.tournaments.flatMap(tournament => tournament.matches)
  ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('searchResultsFor', { query: searchQuery })}</h1>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToDashboard')}
          </Link>
        </Button>
      </div>
      {allFilteredMatches.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[90px] px-2">{t('date')}</TableHead>
              <TableHead className="px-2">{t('match')}</TableHead>
              <TableHead className="w-[150px] px-2 hidden sm:table-cell">{t('tournamentEvent')}</TableHead>
              <TableHead className="w-[70px] px-2 text-center">{t('score')}</TableHead>
              <TableHead className="w-[70px] px-2 text-center">{t('result')}</TableHead>
              <TableHead className="w-[40px] px-1 text-center">{t('notes')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allFilteredMatches.map((match) => {
               const { color, letter, label } = getResultStyle(match.result, t);
              return (
              <TableRow key={match.id}>
                <TableCell className="text-xs px-2">{new Date(match.date).toLocaleDateString()}</TableCell>
                <TableCell className="px-2">{match.teams.join(" vs ")}</TableCell>
                <TableCell className="text-xs px-2 hidden sm:table-cell">{match.tournamentName} ({match.seasonName})</TableCell>
                <TableCell className="text-center px-2">{match.score[0]} : {match.score[1]}</TableCell>
                <TableCell className="text-center px-2">
                  <span
                    className="font-bold w-6 h-6 flex items-center justify-center rounded-full text-white text-xs shadow-sm mx-auto"
                    style={{ backgroundColor: color }}
                    title={label}
                  >
                    {letter}
                  </span>
                </TableCell>
                <TableCell className="text-center px-1">
                  {match.notes && <NoteTooltip notes={match.notes} />}
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      ) : (
        <p>{t('noMatchesFoundFor', { query: searchQuery })}</p>
      )}
    </div>
  );
};

export default SearchResultsPage;
