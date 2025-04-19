"use client";

import React, {useEffect, useRef} from "react";
import {Sidebar, SidebarContent, SidebarMenuButton} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {SoccerBallIcon} from "lucide-react";
import {useSearchParams} from "next/navigation";

const AppSidebar = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  const seasonRef = useRef<HTMLDivElement>(null);
  const tournamentRef = useRef<HTMLDivElement>(null);
  const matchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seasonParam) {
      const seasonElement = document.getElementById(`season-${seasonParam}`);
      seasonElement?.scrollIntoView({behavior: "smooth", block: "start"});

      if (matchParam) {
        const matchElement = document.getElementById(`match-${matchParam}`);
        matchElement?.scrollIntoView({behavior: "smooth", block: "nearest"});

        // Check if the match is inside a tournament and open the tournament accordion
        const tournamentId = matchElement?.closest('[id^="tournament-"]')?.id;
        if (tournamentId) {
          const tournamentElement = document.getElementById(tournamentId);
          tournamentElement?.scrollIntoView({behavior: "smooth", block: "nearest"});
        }
      }
    }
  }, [seasonParam, matchParam]);

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <MatchForm/>
        <Accordion type="single" collapsible className="w-full">
          {/* Season 2024 */}
          <AccordionItem value="season-2024">
            <AccordionTrigger>Season 2024</AccordionTrigger>
            <AccordionContent>
              <Accordion type="single" collapsible className="w-full">
                {/* Tournament 1 */}
                <AccordionItem value="tournament-1">
                  <AccordionTrigger>Tournament 1</AccordionTrigger>
                  <AccordionContent>
                    <ul>
                      <li id="match-2024-match-1">Match 1</li>
                      <li id="match-2024-match-2">Match 2</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                {/* Match 1 */}
                <AccordionItem value="match-1">
                  <AccordionTrigger>Match 1</AccordionTrigger>
                  <AccordionContent>
                    Match Details
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>

          {/* Season 2025 */}
          <AccordionItem value="season-2025">
            <AccordionTrigger>Season 2025</AccordionTrigger>
            <AccordionContent>
              {/* Add content for Season 2025 here */}
              <Accordion type="single" collapsible className="w-full">
                {/* Tournament 1 */}
                <AccordionItem value="tournament-1">
                  <AccordionTrigger>Tournament 1</AccordionTrigger>
                  <AccordionContent>
                    <ul>
                      <li id="match-2025-match-1">Match 1</li>
                      <li id="match-2025-match-2">Match 2</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                {/* Match 1 */}
                <AccordionItem value="match-1">
                  <AccordionTrigger>Match 1</AccordionTrigger>
                  <AccordionContent>
                    Match Details
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
