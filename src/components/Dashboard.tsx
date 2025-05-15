
"use client";

import React, { useState } from "react"; // Added useState
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation"; // Added useRouter
import SeasonDetails from "./SeasonDetails";
import type { Match, Team, Tournament } from "@/types/soccer";
import { calculateSeasonStats } from "@/lib/utils";
import { Goal, Loader2, AlertTriangle, Search as SearchIcon } from "lucide-react"; // Added SearchIcon
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSoccerData } from "@/hooks/useSoccerData";
import { Input } from "@/components/ui/input"; // Added Input
import { Button } from "@/components/ui/button"; // Added Button

const getTeamName = (teamId: string, teams: Team[]): string => {
  const team = teams.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const Dashboard = () => {
  const searchParams = useSearchParams();
  const router = useRouter(); // Initialize router
  const seasonParam = searchParams.get("season");
  const urlSearchParam = searchParams.get("search"); // Renamed to avoid conflict
  const matchParam = searchParams.get("match");

  const [internalSearchQuery, setInternalSearchQuery] = useState(urlSearchParam || ''); // Local state for the input

  const { seasons, matchesBySeason, teams, tournaments, loading, error } = useSoccerData();

  const handleDashboardSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (internalSearchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(internalSearchQuery.trim())}`);
    } else {
      // If search is cleared, navigate to dashboard without search query
      // or optionally clear the searchParam from the current URL if staying on Dashboard
      router.push('/'); // Or update URL: router.push(pathname) without search query
    }
  };

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
        {process.env.NODE_ENV === 'development' && <p className="text-xs text-muted-foreground">{error.message}</p>}
      </div>
    );
  }
  
  // Filter seasons based on urlSearchParam (from URL, not local input state)
  const filteredSeasons = seasons.filter(season => {
    if (!urlSearchParam) return true; 
    const lowerCaseSearch = urlSearchParam.toLowerCase();
    const matchesForSeason = matchesBySeason[season] || [];
    return matchesForSeason.some(match => {
      const opponentTeamName = getTeamName(match.opponentTeamId, teams);
      return opponentTeamName.toLowerCase().includes(lowerCaseSearch);
    });
  });

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

      {/* Search Form that navigates to /search page */}
      <form onSubmit={handleDashboardSearch} className="flex gap-2 items-center mb-4">
        <Input
         type="text"
         placeholder="Search by opponent team in all seasons..."
         value={internalSearchQuery}
         onChange={(e) => setInternalSearchQuery(e.target.value)}
         className="flex-grow"
         aria-label="Search by opponent team"
       />
       <Button type="submit" variant="outline" size="icon" aria-label="Submit search">
          <SearchIcon className="h-4 w-4" />
       </Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredSeasons.map((season) => (
          <SeasonDashboard 
            key={season} 
            season={season} 
            allMatchesForSeason={matchesBySeason[season] || []}
            teams={teams}
            urlSearchParam={urlSearchParam} // Pass urlSearchParam here
          />
        ))}
        {filteredSeasons.length === 0 && urlSearchParam && (
          <p className="md:col-span-2 text-center text-muted-foreground">
            No seasons match your search for "{urlSearchParam}".
          </p>
        )}
      </div>
    </div>
  );
};

interface SeasonDashboardProps {
  season: string;
  allMatchesForSeason: Match[];
  teams: Team[];
  urlSearchParam: string | null; // Add urlSearchParam to props
}

const SeasonDashboard = ({ season, allMatchesForSeason, teams, urlSearchParam }: SeasonDashboardProps) => {
  const { wins, draws, losses, goalsFor, goalsAgainst } = calculateSeasonStats(allMatchesForSeason);

  const last5Matches = [...allMatchesForSeason]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="shadow-md hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/?season=${season}${urlSearchParam ? `&search=${encodeURIComponent(urlSearchParam)}` : ''}`} // Preserve search param on navigation
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
              const ourTeamName = getTeamName(item.ourTeamId, teams);
              const opponentTeamName = getTeamName(item.opponentTeamId, teams);
              const tooltipText = `${ourTeamName} vs ${opponentTeamName}, Score: ${item.score}`;

              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/?season=${season}&match=${item.id}${urlSearchParam ? `&search=${encodeURIComponent(urlSearchParam)}` : ''}`} // Preserve search param
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
            {last5Matches.length === 0 && (
                <p className="text-xs text-muted-foreground">No recent matches.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
