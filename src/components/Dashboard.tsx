"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SeasonDetails from "./SeasonDetails";
import type { Match, Team, Tournament } from "@/types/soccer"; // Removed unused MOCK imports
import { calculateSeasonStats } from "@/lib/utils";
import { Goal, Loader2, AlertTriangle } from "lucide-react"; // Added Loader2, AlertTriangle
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSoccerData } from "@/hooks/useSoccerData"; // Import the new hook

// getTeamName will now accept the list of teams as a parameter
const getTeamName = (teamId: string, teams: Team[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const Dashboard = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  const { seasons, matchesBySeason, teams, tournaments, loading, error } = useSoccerData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(60vh)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(60vh)] text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-destructive mb-2">Error Loading Data</h2>
        <p className="text-muted-foreground mb-4">There was an issue fetching data. Please try again later.</p>
        {/* Optionally show error details in dev mode */}
        {process.env.NODE_ENV === 'development' && <p className="text-xs text-muted-foreground">{error.message}</p>}
      </div>
    );
  }
  
  // Ensure seasons data is available before trying to access it
  if (seasonParam && seasons.includes(seasonParam)) {
    const matchesForSelectedSeason = matchesBySeason[seasonParam] || [];
    const tournamentsForSelectedSeason = tournaments.filter(t => t.season === seasonParam);
    return (
        <SeasonDetails 
          season={seasonParam} 
          highlightMatchId={matchParam}
          matchesForSeason={matchesForSelectedSeason}
          tournamentsForSeason={tournamentsForSelectedSeason}
          teams={teams}
        />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Season Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {seasons.map((season) => (
          <SeasonDashboard 
            key={season} 
            season={season} 
            allMatchesForSeason={matchesBySeason[season] || []}
            teams={teams} // Pass teams to SeasonDashboard
          />
        ))}
      </div>
    </div>
  );
};

// SeasonDashboard props updated
interface SeasonDashboardProps {
  season: string;
  allMatchesForSeason: Match[];
  teams: Team[];
}

const SeasonDashboard = ({ season, allMatchesForSeason, teams }: SeasonDashboardProps) => {
  // const matches: Match[] = MOCK_MATCHES_BY_SEASON[season] || []; // Now passed as prop
  const { wins, draws, losses, goalsFor, goalsAgainst } = calculateSeasonStats(allMatchesForSeason);

  const last5Matches = [...allMatchesForSeason]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="shadow-md hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/?season=${season}`} // Navigation will cause Dashboard to re-evaluate and pass props to SeasonDetails
            className="hover:underline"
          >
            {season}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col justify-center space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--win-color)"}} />
            <span>Wins: {wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--draw-color)"}} />
            <span>Draws: {draws}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--loss-color)"}} />
            <span>Losses: {losses}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Goal className="w-4 h-4 text-muted-foreground" />
            <span>Goals: {goalsFor} : {goalsAgainst}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <CardHeader className="p-0 mb-2">
            <CardTitle className="text-md">Last 5 Results</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-start gap-x-1">
            {last5Matches.map((item) => {
              let color = "var(--loss-color)";
              let letter = "L";
              if (item.result === 1) {
                color = "var(--win-color)";
                letter = "W";
              } else if (item.result === 0.5) {
                color = "var(--draw-color)";
                letter = "D";
              }
              // Use the parameterized getTeamName
              const ourTeamName = getTeamName(item.ourTeamId, teams);
              const opponentTeamName = getTeamName(item.opponentTeamId, teams);
              const tooltipText = `${ourTeamName} vs ${opponentTeamName}, Score: ${item.score}`;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/?season=${season}&match=${item.id}`}
                      className="circle flex items-center justify-center w-8 h-8 rounded-full text-primary-foreground font-bold text-sm shadow-sm"
                      style={{ backgroundColor: color }}
                      aria-label={`Result: ${letter}, Match: ${item.name}, Score: ${item.score}`}
                    >
                      {letter}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltipText}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
