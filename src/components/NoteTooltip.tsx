"use client";

import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { StickyNoteIcon } from "@/lib/utils";

interface NoteTooltipProps {
  notes: string;
}

export const NoteTooltip: React.FC<NoteTooltipProps> = ({ notes }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTriggerClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen} delayDuration={0}> {/* Set delayDuration to 0 for immediate open */}
      <TooltipTrigger asChild>
        {/* Using a span to ensure clickability on the icon itself */}
        {/* Added outline-none to prevent focus border on click */}
        {/* Added role="button" and tabIndex={0} for accessibility */}
        <span onClick={handleTriggerClick} className="cursor-pointer outline-none" role="button" tabIndex={0}>
          <StickyNoteIcon className="h-4 w-4 text-muted-foreground mx-auto" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs break-words" onPointerDownOutside={() => setIsOpen(false)} onEscapeKeyDown={() => setIsOpen(false)}>
        {notes}
      </TooltipContent>
    </Tooltip>
  );
};
