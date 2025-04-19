"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const seasons = ["2024", "2025"];

const seasonsMatches = {
  "2024": [
    { result: 1 }, // 1 for win
    { result: 0 }, // 0 for loss
    { result: 0.5 }, // 0.5 for draw
    { result: 1 },
    { result: 0.5 },
  ],
  "2025": [
    { result: 1 },
    { result: 1 },
    { result: 1 },
    { result: 0 },
    { result: 0 },
  ],
};

const Dashboard = () => {
  const { setOpen } = useSidebar();

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

const SeasonDashboard = ({ season }: { season: string }) => {
  const matches = seasonsMatches[season] || [];
  const wins = matches.filter((item) => item.result === 1).length;
  const losses = matches.filter((item) => item.result === 0).length;
  const draws = matches.filter((item) => item.result === 0.5).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{season}</CardTitle>
        <CardDescription>Season Performance</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500" />
            <span>W: {wins}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-yellow-500" />
            <span>D: {draws}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500" />
            <span>L: {losses}</span>
          </div>
        </div>
        <CardHeader>
          <CardTitle>Last 5 Results</CardTitle>
          <CardDescription>Recent match outcomes</CardDescription>
        </CardHeader>
        <div className="flex items-center justify-around">
          {matches.map((item, index) => {
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
              <div
                key={index}
                className="circle flex items-center justify-center"
                style={{ backgroundColor: color, color: 'white' }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
