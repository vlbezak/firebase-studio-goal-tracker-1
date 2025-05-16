
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
import type { Match, Tournament, SeasonDisplayItem, Team } from "@/types/soccer";
import { calculateSeasonStats, formatDate, formatDateRange, getFinalStandingDisplay, StickyNoteIcon, cn, getResultStyle } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Goal, BarChart3, Swords } from "lucide-react";
import { Input } from "./ui/input";
import { useTranslations } from '@/context/LanguageContext';
import { NoteTooltip } from '@/components/NoteTooltip'; // Ensure NoteTooltip is imported

interface SeasonDetailsProps {
  season: string;
  highlightMatchId: string | null;
  matchesForSeason: Match[];
  tournamentsForSeason: Tournament[];
  teams: Team[];
}

const getTeamName = (teamId: string, teams: Team[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const MatchList: React.FC<{ matches: Match[]; highlightMatchId: string | null; isMultiDateTournament: boolean; teams: Team[]; t: (key: string, params?: Record<string, string | number>) => string; }> = ({ matches, highlightMatchId, isMultiDateTournament, teams, t }) => {
  if (!matches || matches.length === 0) {
    return <p className="text-sm text-muted-foreground px-6 pb-4">{t('noMatchesFoundFor', { query: ''})}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isMultiDateTournament && <TableHead className="w-[80px]">{t('date')}</TableHead>}
          <TableHead className="w-3/5">{t('match')}</TableHead>
          <TableHead className="w-[60px] px-1 text-center">{t('score')}</TableHead>
          <TableHead className="w-[50px] px-1 text-center">{t('result')}</TableHead>
          <TableHead className="w-[40px] px-1 text-center">{t('notes')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => {
          const { color, letter, label } = getResultStyle(match.result, t);
          const isHighlighted = match.id === highlightMatchId;
          
          return (
            <TableRow key={match.id} id={`match-${match.id}`} className={cn(isHighlighted ? "bg-accent text-accent-foreground" : "", "hover:bg-muted/50")}>
              {isMultiDateTournament && <TableCell className="py-2 px-2 sm:px-3">{formatDate(match.date, "dd.MM")}</TableCell>}
              <TableCell className="py-2 px-2 sm:px-4 font-medium">{match.name}</TableCell> 
              <TableCell className="w-[60px] px-1 text-center py-2">{match.score}</TableCell>
              <TableCell className="w-[50px] px-1 text-center py-2">
                <span
                  className="font-bold w-6 h-6 flex items-center justify-center rounded-full text-white text-xs shadow-sm mx-auto"
                  style={{ backgroundColor: color }}
                  title={label}
                >
                  {letter}
                </span>
              </TableCell>
              <TableCell className="w-[40px] px-1 text-center py-2">
                {match.notes ? (
                  <NoteTooltip notes={match.notes} />
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

const TournamentCard: React.FC<{ tournament: Tournament; matches: Match[]; highlightMatchId: string | null; teams: Team[]; t: (key: string, params?: Record<string, string | number>) => string; }> = ({ tournament, matches, highlightMatchId, teams, t }) => {
  const isMultiDate = !!tournament.endDate && tournament.startDate !== tournament.endDate;
  const sortedMatches = [...matches].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="w-full mb-6 shadow-lg" id={`tournament-${tournament.id}`}>
      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{tournament.name}</CardTitle>
            <CardDescription className="text-sm">
              {formatDateRange(tournament.startDate, tournament.endDate)} | {tournament.place}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            {tournament.finalStanding && (
              <div className="text-sm font-semibold">
                {getFinalStandingDisplay(tournament.finalStanding, t)}
              </div>
            )}
            {tournament.notes && (
                <NoteTooltip notes={tournament.notes} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 py-0"> 
        <MatchList matches={sortedMatches} highlightMatchId={highlightMatchId} isMultiDateTournament={isMultiDate} teams={teams} t={t} />
      </CardContent>
    </Card>
  );
};

const IndependentMatchCard: React.FC<{ match: Match; highlightMatchId: string | null; t: (key: string, params?: Record<string, string | number>) => string; teams: Team[] }> = ({ match, highlightMatchId, t, teams }) => {
  const { color, letter, label } = getResultStyle(match.result, t);
  const isHighlighted = match.id === highlightMatchId;
  
  return (
    <Card className={cn("w-full mb-6 shadow-lg", isHighlighted ? "ring-2 ring-primary" : "")} id={`match-${match.id}`}>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{match.name}</CardTitle>
            <CardDescription className="text-sm">
              {formatDate(match.date)} {match.place ? `| ${match.place}` : ""}
            </CardDescription>
          </div>
           {match.notes && (
             <NoteTooltip notes={match.notes} />
           )}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0 pb-4 px-4 sm:px-6">
        <div className="text-base">
          <span className="font-bold ml-2">{match.score}</span>
        </div>
        <span
          className="font-bold w-8 h-8 flex items-center justify-center rounded-full text-white text-md shadow-sm"
          style={{ backgroundColor: color }}
          title={label}
        >
          {letter}
        </span>
      </CardContent>
    </Card>
  );
};


const SeasonDetails: React.FC<SeasonDetailsProps> = ({ season, highlightMatchId, matchesForSeason, tournamentsForSeason, teams }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const t = useTranslations(); 

  const { wins, draws, losses, goalsFor, goalsAgainst, matchesPlayed } = calculateSeasonStats(matchesForSeason);

  const displayItems: SeasonDisplayItem[] = [];

  tournamentsForSeason.forEach(tournament => {
    const tournamentMatches = matchesForSeason.filter(m => m.tournamentId === tournament.id);
    displayItems.push({
      type: 'tournament',
      data: tournament,
      matches: tournamentMatches,
      dateToSort: tournament.startDate,
    });
  });

  matchesForSeason.forEach(match => {
    if (!match.tournamentId) {
      displayItems.push({
        type: 'independent_match',
        data: match,
        dateToSort: match.date,
      });
    }
  });

  displayItems.sort((a, b) => new Date(b.dateToSort).getTime() - new Date(a.dateToSort).getTime());

  const filteredDisplayItems = displayItems.reduce((acc, item) => {
    if (item.type === 'tournament') {
      const filteredMatches = (item.matches || []).filter(match =>
        getTeamName(match.opponentTeamId, teams).toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filteredMatches.length > 0 || item.data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        acc.push({ ...item, matches: filteredMatches });
      }
    } else if (item.type === 'independent_match') {
      if (getTeamName(item.data.opponentTeamId, teams).toLowerCase().includes(searchTerm.toLowerCase()) || 
          item.data.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        acc.push(item);
      }
    }
    return acc;
  }, [] as SeasonDisplayItem[]);

  React.useEffect(() => {
    if (highlightMatchId) {
      const element = document.getElementById(`match-${highlightMatchId}`);
      if (element) {
        const tournamentCard = element.closest<HTMLElement>('[id^="tournament-"]');
        const targetElement = tournamentCard || element; 
        
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightMatchId, filteredDisplayItems]);
  
  if (!matchesForSeason || !tournamentsForSeason || !teams) {
      return <p>{t('loading')}...</p>; 
  }


  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4">
        <div className="p-4 flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{season}</h1>
          <Button asChild variant="outline">
              <Link href="/">
               &lt; {t('dashboard')}
              </Link>
          </Button>
        </div>

        <div className="mb-4 px-4 sm:px-0">
          <Input
            placeholder={t('searchMatchesPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {matchesPlayed > 0 && (
          <Card className="w-full mb-6 shadow-md mx-0 sm:mx-0">
            <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
              <CardTitle className="text-xl">{t('seasonSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm pb-4 px-4 sm:px-6">
              <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{t('statistics')}:</span>
                  <span>{wins} W - {draws} D - {losses} L</span>
              </div>
              <div className="flex items-center gap-2">
                  <Goal className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{t('goals')}:</span>
                  <span>{goalsFor} : {goalsAgainst}</span>
              </div>
               <div className="flex items-center gap-2">
                  <Swords className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold">{t('matchesPlayed')}:</span>
                  <span>{matchesPlayed}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredDisplayItems.length === 0 && matchesPlayed === 0 && searchTerm === '' && (
             <Card className="w-full shadow-md mx-0 sm:mx-0">
              <CardContent className="pt-6 px-4 sm:px-6">
               <p className="text-muted-foreground">{t('noMatchesOrTournamentsFound', { season })}</p>
              </CardContent>
             </Card>
         )}
        
        {filteredDisplayItems.length === 0 && searchTerm && (
          <p className="text-center text-muted-foreground">
            {t('noResultsFoundForInSeason', { searchTerm })}
          </p>
        )}

        {filteredDisplayItems.map((item, index) => {
          if (item.type === 'tournament') {
            return <TournamentCard key={`tournament-${item.data.id}-${index}`} tournament={item.data} matches={item.matches || []} highlightMatchId={highlightMatchId} teams={teams} t={t} />;
          }
          if (item.type === 'independent_match') {
            return <IndependentMatchCard key={`independent-match-${item.data.id}-${index}`} match={item.data} highlightMatchId={highlightMatchId} t={t} teams={teams} />;
          }
          return null;
        })}
      </div>
    </TooltipProvider>
  );
};

export default SeasonDetails;

