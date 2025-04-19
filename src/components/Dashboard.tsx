"use client";

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "lucide-react";
import {useSidebar} from "@/components/ui/sidebar";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {cn} from "@/lib/utils";

const seasons = ["2024", "2025"];

const data = [
  {result: 1}, // 1 for win
  {result: 0}, // 0 for loss
  {result: 0.5}, // 0.5 for draw
  {result: 1},
  {result: 0.5},
];

const Dashboard = () => {
  const { setOpen } = useSidebar();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Season Performance</h1>
        <Button onClick={() => setOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4"/>
          Add Match
        </Button>
      </div>

      <Tabs defaultValue={seasons[0]} className="w-full">
        <TabsList>
          {seasons.map((season) => (
            <TabsTrigger key={season} value={season}>
              {season}
            </TabsTrigger>
          ))}
        </TabsList>
        {seasons.map((season) => (
          <TabsContent key={season} value={season}>
            <SeasonDashboard season={season}/>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const SeasonDashboard = ({ season }: { season: string }) => {
  const wins = data.filter(item => item.result === 1).length;
  const losses = data.filter(item => item.result === 0).length;
  const draws = data.filter(item => item.result === 0.5).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Wins</CardTitle>
          <CardDescription>Number of wins this season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{wins}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Losses</CardTitle>
          <CardDescription>Number of losses this season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{losses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Draws</CardTitle>
          <CardDescription>Number of draws this season</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{draws}</div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>Last 5 Results</CardTitle>
          <CardDescription>Recent match outcomes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-around">
            {data.map((item, index) => {
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
    </div>
  );
};

export default Dashboard;

    