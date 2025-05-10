
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
import { MOCK_SEASONS, MOCK_MATCHES_BY_SEASON, MOCK_TEAMS } from "@/data/mockData";
import type { Match, Team } from "@/types/soccer";
import { calculateSeasonStats } from "@/lib/utils";
import { Goal } from "lucide-react"; 
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const getTeamName = (teamId: string): string => {
  const team = MOCK_TEAMS.find(t => t.id === teamId);
  return team ? team.name : "Unknown Team";
};

const Dashboard = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  if (seasonParam && MOCK_SEASONS.includes(seasonParam)) {
    return (
        <SeasonDetails season={seasonParam} highlightMatchId={matchParam} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Season Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {MOCK_SEASONS.map((season) => (
          <SeasonDashboard key={season} season={season} />
        ))}
      </div>
    </div>
  );
};

const SeasonDashboard = ({ season }: { season: string }) => {
  const matches: Match[] = MOCK_MATCHES_BY_SEASON[season] || [];
  const { wins, draws, losses, goalsFor, goalsAgainst } = calculateSeasonStats(matches);

  // Sort matches by date descending to get the last 5
  const last5Matches = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Card className="shadow-md hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
      <CardHeader>
        <CardTitle>
          <Link
            href={`/?season=${season}`}
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
              const ourTeamName = getTeamName(item.ourTeamId);
              const opponentTeamName = getTeamName(item.opponentTeamId);
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
