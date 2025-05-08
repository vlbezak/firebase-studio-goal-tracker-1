
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
import { MOCK_MATCHES_BY_SEASON, MOCK_TOURNAMENTS } from "@/data/mockData";
import type { Match, Tournament, SeasonDisplayItem } from "@/types/soccer";
import { formatDate, formatDateRange, getFinalStandingDisplay, StickyNoteIcon, cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";


interface SeasonDetailsProps {
  season: string;
  highlightMatchId: string | null;
}

const getResultStyle = (result: number) => {
  if (result === 1) return { color: "var(--win-color)", letter: "W", label: "Win" };
  if (result === 0) return { color: "var(--loss-color)", letter: "L", label: "Loss" };
  return { color: "var(--draw-color)", letter: "D", label: "Draw" };
};


const MatchList: React.FC<{ matches: Match[]; highlightMatchId: string | null; isMultiDateTournament: boolean }> = ({ matches, highlightMatchId, isMultiDateTournament }) => {
  if (!matches || matches.length === 0) {
    return <p className="text-sm text-muted-foreground px-6 pb-4">No matches found for this event.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isMultiDateTournament && <TableHead className="w-[100px]">Date</TableHead>}
          <TableHead>Opponent</TableHead>
          <TableHead className="w-[80px]">Score</TableHead>
          <TableHead className="w-[80px]">Result</TableHead>
          <TableHead className="w-[50px] text-center">Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((match) => {
          const { color, letter, label } = getResultStyle(match.result);
          const isHighlighted = match.id === highlightMatchId;
          const ourTeamName = match.ourTeam || "My Team";

          return (
            <TableRow key={match.id} id={`match-${match.id}`} className={isHighlighted ? "bg-accent text-accent-foreground" : ""}>
              {isMultiDateTournament && <TableCell>{formatDate(match.date, "dd.MM")}</TableCell>}
              <TableCell>{ourTeamName} vs {match.opponent}</TableCell>
              <TableCell>{match.score}</TableCell>
              <TableCell>
                <span
                  className="font-bold w-6 h-6 flex items-center justify-center rounded-full text-white text-xs shadow-sm"
                  style={{ backgroundColor: color }}
                  title={label}
                >
                  {letter}
                </span>
              </TableCell>
              <TableCell className="text-center">
                {match.notes ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <StickyNoteIcon className="h-4 w-4 mx-auto text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{match.notes}</p>
                    </TooltipContent>
                  </Tooltip>
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

const TournamentCard: React.FC<{ tournament: Tournament; matches: Match[]; highlightMatchId: string | null }> = ({ tournament, matches, highlightMatchId }) => {
  const isMultiDate = !!tournament.endDate && tournament.startDate !== tournament.endDate;
  const sortedMatches = [...matches].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card className="mb-6 shadow-lg" id={`tournament-${tournament.id}`}>
      <CardHeader className="pb-4">
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
                {getFinalStandingDisplay(tournament.finalStanding)}
              </div>
            )}
            {tournament.notes && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <StickyNoteIcon className="h-5 w-5 text-muted-foreground cursor-pointer" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tournament.notes}</p>
                  </TooltipContent>
                </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0"> {/* Remove default padding for table */}
        <MatchList matches={sortedMatches} highlightMatchId={highlightMatchId} isMultiDateTournament={isMultiDate} />
      </CardContent>
    </Card>
  );
};

const IndependentMatchCard: React.FC<{ match: Match; highlightMatchId: string | null }> = ({ match, highlightMatchId }) => {
  const { color, letter, label } = getResultStyle(match.result);
  const isHighlighted = match.id === highlightMatchId;
  const ourTeamName = match.ourTeam || "My Team";

  return (
    <Card className={cn("mb-6 shadow-lg", isHighlighted ? "ring-2 ring-primary" : "")} id={`match-${match.id}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{match.name || `${ourTeamName} vs ${match.opponent}`}</CardTitle>
            <CardDescription className="text-sm">
              {formatDate(match.date)} {match.place ? `| ${match.place}` : ""}
            </CardDescription>
          </div>
           {match.notes && (
             <Tooltip>
                <TooltipTrigger asChild>
                  <StickyNoteIcon className="h-5 w-5 text-muted-foreground flex-shrink-0 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{match.notes}</p>
                </TooltipContent>
             </Tooltip>
           )}
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between pt-0 pb-4 px-6">
        <div className="text-base">
          <span>{ourTeamName} vs {match.opponent}</span>
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


const SeasonDetails: React.FC<SeasonDetailsProps> = ({ season, highlightMatchId }) => {
  const matchesForSeason: Match[] = MOCK_MATCHES_BY_SEASON[season] || [];
  const tournamentsForSeason: Tournament[] = Object.values(MOCK_TOURNAMENTS).filter(t => t.season === season);

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

  // Sort all items by date, most recent first
  displayItems.sort((a, b) => new Date(b.dateToSort).getTime() - new Date(a.dateToSort).getTime());

  React.useEffect(() => {
    if (highlightMatchId) {
      const element = document.getElementById(`match-${highlightMatchId}`);
      if (element) {
        // Check if the match is inside a tournament card that might not be fully in view
        const tournamentCard = element.closest<HTMLElement>('[id^="tournament-"]');
        const targetElement = tournamentCard || element; // Scroll to tournament card if match is inside one, otherwise scroll to the match (independent or inside table)
        
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
         // If it's a match inside a tournament, also ensure the specific match row is highlighted if it's part of a table.
        // The highlighting is done by className, so scrolling the card or row into view is primary.
      }
    }
  }, [highlightMatchId, displayItems]); // Rerun if items change, e.g., season navigation

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Season {season}</h1>
        <Button asChild variant="outline">
            <Link href="/">
             &lt; Back to Dashboard
            </Link>
        </Button>
      </div>

      {displayItems.length === 0 && (
           <Card className="shadow-md">
            <CardContent className="pt-6">
             <p className="text-muted-foreground">No matches or tournaments found for the {season} season.</p>
            </CardContent>
           </Card>
       )}

      {displayItems.map((item, index) => {
        if (item.type === 'tournament') {
          return <TournamentCard key={`tournament-${item.data.id}-${index}`} tournament={item.data} matches={item.matches || []} highlightMatchId={highlightMatchId} />;
        }
        if (item.type === 'independent_match') {
          return <IndependentMatchCard key={`match-${item.data.id}-${index}`} match={item.data} highlightMatchId={highlightMatchId} />;
        }
        return null;
      })}
    </div>
  );
};

export default SeasonDetails;
