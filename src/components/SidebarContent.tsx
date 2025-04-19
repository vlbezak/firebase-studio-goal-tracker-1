"use client";

import React, {useEffect, useRef} from "react";
import {Sidebar, SidebarContent, SidebarMenuButton} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {SoccerBallIcon} from "lucide-react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {cn} from "@/lib/utils";

const seasonsMatches = {
  "2024": [
    { id: "2024-match-1", result: 1, tournament: "2024-tournament-1", name: "Match 1" }, // 1 for win
    { id: "2024-match-2", result: 0, tournament: "2024-tournament-1", name: "Match 2" }, // 0 for loss
    { id: "2024-match-3", result: 0.5, name: "Match 3" }, // 0.5 for draw
    { id: "2024-match-4", result: 1, name: "Match 4" },
    { id: "2024-match-5", result: 0.5, name: "Match 5" },
  ],
  "2025": [
    { id: "2025-match-1", result: 1, tournament: "2025-tournament-1", name: "Match 1" },
    { id: "2025-match-2", result: 1, name: "Match 2" },
    { id: "2025-match-3", result: 1, name: "Match 3" },
    { id: "2025-match-4", result: 0, name: "Match 4" },
    { id: "2025-match-5", result: 0, name: "Match 5" },
  ],
};

const tournaments = {
  "2024-tournament-1": { id: "2024-tournament-1", name: "Tournament 1" },
  "2025-tournament-1": { id: "2025-tournament-1", name: "Tournament 1" },
};


const AppSidebar = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  const seasonRef = useRef<HTMLDivElement>(null);
  const tournamentRef = useRef<HTMLDivElement>(null);
  const matchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seasonParam && matchParam) {
      const matchElement = document.getElementById(`match-${matchParam}`);
      matchElement?.scrollIntoView({ behavior: "smooth", block: "nearest" });

      // Check if the match is inside a tournament and open the tournament accordion
      const tournamentId = matchElement?.closest('[id^="tournament-"]')?.id;
      if (tournamentId) {
        const tournamentElement = document.getElementById(tournamentId);
        const accordionTrigger = tournamentElement?.querySelector('[data-radix-accordion-trigger]');
        if (accordionTrigger) {
          (accordionTrigger as HTMLButtonElement).click();
        }
      }
    }
  }, [seasonParam, matchParam]);

  const matches = seasonParam ? seasonsMatches[seasonParam] || [] : [];

  const seasonTournaments = seasonParam ? Object.values(tournaments).filter(tournament => {
    return matches.some(match => match.tournament === tournament.id);
  }) : [];

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <MatchForm/>
        <Accordion type="single" collapsible className="w-full">
          {seasonsMatches && Object.keys(seasonsMatches).map((season) => (
            <AccordionItem key={season} value={`season-${season}`}>
              <AccordionTrigger id={`season-${season}`}>
                <Link
                  href={`/?season=${season}`}
                >
                  {`Season ${season}`}
                </Link>
              </AccordionTrigger>
              <AccordionContent>
                <Accordion type="single" collapsible className="w-full">
                  {seasonTournaments.map((tournament) => (
                    <AccordionItem key={tournament.id} value={`tournament-${tournament.id}`} id={`tournament-${tournament.id}`}>
                      <AccordionTrigger>{tournament.name}</AccordionTrigger>
                      <AccordionContent>
                        <ul>
                          {matches.filter(match => match.tournament === tournament.id).map(match => (
                            <li key={match.id} id={`match-${match.id}`}>
                              <Link
                                href={`/?season=${seasonParam}&match=${match.id}`}
                                className={cn(matchParam === match.id ? "highlighted-match" : "")}
                              >
                                {match.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {matches.filter(match => !match.tournament).map(match => (
                    <AccordionItem key={match.id} value={`match-${match.id}`} id={`match-${match.id}`}>
                      <AccordionTrigger>
                        <Link
                          href={`/?season=${seasonParam}&match=${match.id}`}
                          className={cn(matchParam === match.id ? "highlighted-match" : "")}
                        >
                          {match.name}
                        </Link>
                      </AccordionTrigger>
                      <AccordionContent>
                        Match Details
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
