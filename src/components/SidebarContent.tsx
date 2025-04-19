"use client";

import React from "react";
import {Sidebar, SidebarContent, SidebarMenuButton} from "@/components/ui/sidebar";
import MatchForm from "@/components/MatchForm";
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from "@/components/ui/accordion";
import {SoccerBallIcon} from "lucide-react";

const AppSidebar = () => {
  return (
    <Sidebar collapsible="offcanvas">
      <SidebarContent>
        <MatchForm />
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
                      <li>Match 1</li>
                      <li>Match 2</li>
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
                      <li>Match 1</li>
                      <li>Match 2</li>
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
