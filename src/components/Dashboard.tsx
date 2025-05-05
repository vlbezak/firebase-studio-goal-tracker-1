"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar"; // Keep if needed elsewhere
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
// Import the actual SeasonDetails component
import SeasonDetails from "./SeasonDetails"; 

// Mock data (consider moving this to a separate file/API later)
const seasons = ["2024", "2025"];

const seasonsMatches = {
  "2024": [
    { id: "2024-match-1", result: 1, tournament: "2024-tournament-1", name: "Match 1", score: "3-2" }, // 1 for win
    { id: "2024-match-2", result: 0, tournament: "2024-tournament-1", name: "Match 2", score: "1-2" }, // 0 for loss
    { id: "2024-match-3", result: 0.5, name: "Match 3", score: "2-2" }, // 0.5 for draw
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

// Removed tournaments data as it's now within SeasonDetails for this structure


const Dashboard = () => {
  // const { setOpen } = useSidebar(); // Uncomment if sidebar interaction is needed here
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  // Conditionally render based on seasonParam
  if (seasonParam && seasons.includes(seasonParam)) {
    // Render the actual SeasonDetails component
    return <SeasonDetails season={seasonParam} matchId={matchParam} />; 
  }

  // Original Dashboard View
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Season Performance</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {seasons.map((season) => (
          <SeasonDashboard key={season} season={season} />
        ))}
      </div>
    </div>
  );
};

// SeasonDashboard component remains unchanged 
const SeasonDashboard = ({ season }: { season: string }) => {
  // Type assertion for seasonsMatches keys
  const matches = (seasonsMatches as Record<string, any[]>)[season] || [];
  const wins = matches.filter((item) => item.result === 1).length;
  const losses = matches.filter((item) => item.result === 0).length;
  const draws = matches.filter((item) => item.result === 0.5).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {/* Link to trigger the detailed view */}
          <Link
            href={`/?season=${season}`}
            className="hover:underline"
          >
            {season}
          </Link>
        </CardTitle>
        <CardDescription>Season Performance</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--win-color)"}} />
            <span>W: {wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--draw-color)"}} />
            <span>D: {draws}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full" style={{backgroundColor: "var(--loss-color)"}} />
            <span>L: {losses}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <CardHeader className="p-0 mb-2"> {/* Added mb-2 for spacing */}
            <CardTitle className="text-md">Last 5 Results</CardTitle>
          </CardHeader>
          <div className="flex items-center justify-around">
            {matches.slice(-5).map((item, index) => {
              let color = "var(--loss-color)";
              let letter = "L";
              if (item.result === 1) {
                color = "var(--win-color)";
                letter = "W";
              } else if (item.result === 0.5) {
                color = "var(--draw-color)";
                letter = "D";
              }
              return (
                <Link
                  // Link to trigger detailed view with match selected
                  href={`/?season=${season}&match=${item.id}`}
                  key={item.id}
                  className="circle flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm" // Adjusted size and added text styles
                  style={{ backgroundColor: color }}
                  title={`Match: ${item.name}, Score: ${item.score}`} // Added tooltip
                >
                  {letter}
                </Link>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


export default Dashboard;
