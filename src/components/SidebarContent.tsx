
"use client";

import React, {useEffect} from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {cn} from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { MOCK_SEASONS, MOCK_MATCHES_BY_SEASON, MOCK_TOURNAMENTS } from "@/data/mockData";
import type { Match, Tournament } from "@/types/soccer";


const AppSidebar = () => {
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  const matchParam = searchParams.get("match");

  useEffect(() => {
    if (seasonParam && matchParam) {
      const matchElement = document.getElementById(`match-${matchParam}`);
      if (matchElement) {
        const tournamentAccordionItem = matchElement.closest<HTMLElement>('[data-radix-accordion-item][id^="tournament-"]');
        if (tournamentAccordionItem) {
           const accordionTrigger = tournamentAccordionItem.querySelector<HTMLButtonElement>(
            '[data-radix-accordion-trigger]'
          );
           if (accordionTrigger && tournamentAccordionItem.getAttribute('data-state') === 'closed') {
             accordionTrigger.click();
           }
        }
        setTimeout(() => {
          matchElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 300);
      }
    }
  }, [seasonParam, matchParam]);

  const getMatchesForSeason = (season: string): Match[] => {
    return MOCK_MATCHES_BY_SEASON[season] || [];
  };

  const getTournamentsForSeason = (season: string): Tournament[] => {
    const seasonMatches = getMatchesForSeason(season);
    const tournamentIdsInSeason = new Set(seasonMatches.map(m => m.tournamentId).filter(Boolean));
    return Object.values(MOCK_TOURNAMENTS).filter(t => t.season === season && tournamentIdsInSeason.has(t.id));
  };


  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="flex justify-between items-center p-2">
        <SidebarTrigger className="md:hidden" />
        <ThemeToggle />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <MatchForm/>
        <Accordion type="multiple" className="w-full mt-4">
          {MOCK_SEASONS.map((season) => {
             const seasonMatches = getMatchesForSeason(season);
             const seasonTournaments = getTournamentsForSeason(season);
             const independentMatches = seasonMatches.filter(match => !match.tournamentId);

            return (
            <AccordionItem key={season} value={`season-${season}`}>
              <AccordionTrigger>
                <Link
                  href={`/?season=${season}`}
                  className={cn("hover:underline", seasonParam === season ? "font-bold" : "")}
                  onClick={(e) => {
                      if (window.location.search.includes(`season=${season}&match=`)) { // if already on season and a match is selected, allow navigation to just season
                        // Do nothing, allow navigation
                      } else if (window.location.search.includes(`season=${season}`)) {
                           e.preventDefault(); 
                      }
                  }}
                >
                  {`Season ${season}`}
                </Link>
              </AccordionTrigger>
              <AccordionContent>
                 <Accordion type="multiple" className="w-full pl-4">
                    {seasonTournaments.map((tournament) => (
                        <AccordionItem key={tournament.id} value={`tournament-${tournament.id}`} id={`tournament-${tournament.id}`}>
                        <AccordionTrigger>{tournament.name}</AccordionTrigger>
                        <AccordionContent>
                            <ul className="pl-4 list-disc list-inside">
                            {seasonMatches.filter(match => match.tournamentId === tournament.id).map(match => (
                                <li key={match.id} id={`match-${match.id}`}>
                                <Link
                                    href={`/?season=${season}&match=${match.id}`}
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

                 {independentMatches.length > 0 && (
                    <div className="mt-2 pl-4">
                         <h4 className="font-semibold mb-1 text-sm">Other Matches</h4>
                         <ul className="pl-4 list-disc list-inside">
                            {independentMatches.map(match => (
                                <li key={match.id} id={`match-${match.id}`}>
                                <Link
                                    href={`/?season=${season}&match=${match.id}`}
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
