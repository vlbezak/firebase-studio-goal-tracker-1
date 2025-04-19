
import React from "react";
import {Calendar} from "@/components/ui/calendar";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {CalendarIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";

const MatchForm = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Enter Match Data</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4"/>
                {date ? date?.toLocaleDateString() : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date()
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="opponent">Opponent Team</Label>
          <Input type="text" id="opponent" placeholder="Enter opponent team name"/>
        </div>

        <div>
          <Label htmlFor="tournament">Tournament (Optional)</Label>
          <Input type="text" id="tournament" placeholder="Enter tournament name"/>
        </div>

        <div>
          <Label htmlFor="score">Final Score</Label>
          <Input type="text" id="score" placeholder="Enter final score (e.g., 3-2)"/>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Match Notes</Label>
        <Textarea id="notes" placeholder="Enter general notes about the match"/>
      </div>

      <Button type="submit">Submit Match Data</Button>
    </div>
  );
};

export default MatchForm;
