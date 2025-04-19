
"use client";

import React from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {Button} from "@/components/ui/button";
import {PlusIcon} from "lucide-react";
import {useSidebar} from "@/components/ui/sidebar";

const data = [
  {name: 'Match 1', result: 1}, // 1 for win
  {name: 'Match 2', result: 0}, // 0 for loss
  {name: 'Match 3', result: 0.5}, // 0.5 for draw
  {name: 'Match 4', result: 1},
  {name: 'Match 5', result: 0.5},
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Wins</CardTitle>
            <CardDescription>Number of wins this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Losses</CardTitle>
            <CardDescription>Number of losses this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draws</CardTitle>
            <CardDescription>Number of draws this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Last 5 Results</CardTitle>
            <CardDescription>Graphical display of recent match outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis domain={[0, 1]} tickFormatter={(value) => {
                  if (value === 1) return 'W';
                  if (value === 0) return 'L';
                  return 'D'; // Draw
                }}/>
                <Tooltip/>
                <Area type="monotone" dataKey="result" stroke="#32CD32" fill="#A9F5A9"/>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
