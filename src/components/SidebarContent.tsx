"use client";

import React, {useEffect, useRef} from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader, // Import SidebarHeader
  SidebarTrigger, // Import SidebarTrigger
} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {useSearchParams} from "next/navigation"; // Removed useRouter as it's not used
import Link from "next/link";
import {cn} from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle"; // Import ThemeToggle

// Mock data (keep or move as needed)
const seasonsMatches = {
  "2024": [
    { id: "2024-match-1", result: 1, tournament: "2024-tournament-1", name: "Match 1", score: "3-2" },
    { id: "2024-match-2", result: 0, tournament: "2024-tournament-1", name: "Match 2", score: "1-2" },
    { id: "2024-match-3", result: 0.5, name: "Match 3", score: "2-2" },
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

const tournaments = {
  "2024-tournament-1": { id: "2024-tournament-1", name: "Tournament 1", season: "2024" },
  "2025-tournament-1": { id: "2025-tournament-1", name: "Tournament 1", season: "2025" },
};


const AppSidebar = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  // Refs for potential future use (scrolling logic removed for now)
  // const seasonRef = useRef<HTMLDivElement>(null);
  // const tournamentRef = useRef<HTMLDivElement>(null);
  // const matchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (seasonParam && matchParam) {
      const matchElement = document.getElementById(`match-${matchParam}`);
      if (matchElement) {
        // Find the parent AccordionItem for the tournament
        const tournamentAccordionItem = matchElement.closest<HTMLElement>('[data-radix-accordion-item][id^="tournament-"]');

        if (tournamentAccordionItem) {
          // Find the trigger within that item
           const accordionTrigger = tournamentAccordionItem.querySelector<HTMLButtonElement>(
            '[data-radix-accordion-trigger]'
          );

          // Check if the accordion is closed before clicking
           if (accordionTrigger && tournamentAccordionItem.getAttribute('data-state') === 'closed') {
             accordionTrigger.click();
           }
        }

        // Scroll the specific match into view after a short delay to allow accordion animation
        setTimeout(() => {
          matchElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 300); // Adjust delay if needed
      }
    }
  }, [seasonParam, matchParam]);


  // Helper to get matches for a season safely
  const getMatchesForSeason = (season: string) => {
    return (seasonsMatches as Record<string, any[]>)[season] || [];
  };

  // Helper to get tournaments for a season safely
  const getTournamentsForSeason = (season: string) => {
    const matches = getMatchesForSeason(season);
    return Object.values(tournaments as Record<string, any>)
      .filter(tournament => matches.some(match => match.tournament === tournament.id));
  };


  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="flex justify-between items-center p-2">
        {/* Add SidebarTrigger for mobile */}
        <SidebarTrigger className="md:hidden" />
        {/* Add ThemeToggle */}
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <MatchForm/>
        <Accordion type="multiple" className="w-full mt-4">
          {seasonsMatches && Object.keys(seasonsMatches).map((season) => {
             const seasonMatches = getMatchesForSeason(season);
             const seasonTournaments = getTournamentsForSeason(season);
             const independentMatches = seasonMatches.filter(match => !match.tournament);

            return (
            <AccordionItem key={season} value={`season-${season}`}>
              <AccordionTrigger>
                <Link
                  href={`/?season=${season}`}
                  className={cn("hover:underline", seasonParam === season ? "font-bold" : "")}
                  onClick={(e) => { // Prevent full page reload, let state handle display
                      if (window.location.search.includes(`season=${season}`)) {
                           e.preventDefault(); // Avoid navigating if already on the season
                           // Optionally, add logic to scroll to top or reset view
                      }
                  }}
                >
                  {`Season ${season}`}
                </Link>
              </AccordionTrigger>
              <AccordionContent>
                {/* Nested Accordion for Tournaments */}
                 <Accordion type="multiple" className="w-full pl-4">
                    {seasonTournaments.map((tournament) => (
                        <AccordionItem key={tournament.id} value={`tournament-${tournament.id}`} id={`tournament-${tournament.id}`}>
                        <AccordionTrigger>{tournament.name}</AccordionTrigger>
                        <AccordionContent>
                            <ul className="pl-4 list-disc list-inside">
                            {seasonMatches.filter(match => match.tournament === tournament.id).map(match => (
                                <li key={match.id} id={`match-${match.id}`}>
                                <Link
                                    href={`/?season=${season}&match=${match.id}`} // Ensure season is included
                                    className={cn(
                                        "hover:underline",
                                        matchParam === match.id ? "highlighted-match font-semibold" : ""
                                    )}
                                >
                                    {match.name} ({match.score})
                                </Link>
                                </li>
                            ))}
                            </ul>
                        </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>

                 {/* Independent Matches List */}
                 {independentMatches.length > 0 && (
                    <div className="mt-2 pl-4">
                         <h4 className="font-semibold mb-1 text-sm">Other Matches</h4>
                         <ul className="pl-4 list-disc list-inside">
                            {independentMatches.map(match => (
                                <li key={match.id} id={`match-${match.id}`}>
                                <Link
                                    href={`/?season=${season}&match=${match.id}`} // Ensure season is included
                                    className={cn(
                                     "hover:underline",
                                     matchParam === match.id ? "highlighted-match font-semibold" : ""
                                    )}
                                >
                                    {match.name} ({match.score})
                                </Link>
                                </li>
                            ))}
                         </ul>
                    </div>
                 )}

                 {seasonTournaments.length === 0 && independentMatches.length === 0 && (
                    <p className="pl-4 text-sm text-muted-foreground">No matches recorded for this season yet.</p>
                 )}
              </AccordionContent>
            </AccordionItem>
          )})}
        </Accordion>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
