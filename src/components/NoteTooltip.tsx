
"use client";

import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StickyNoteIcon } from "@/lib/utils";

interface NoteTooltipProps {
  notes: string;
}

export const NoteTooltip: React.FC<NoteTooltipProps> = ({ notes }) => {
  const [isOpen, setIsOpen] = useState(false);

  // onOpenChange is called by Radix when it determines the tooltip should open or close
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  // Explicitly toggle on click for the trigger
  const handleTriggerClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // Prevent event from bubbling up if it causes issues
    setIsOpen(!isOpen);
  };

  return (
    <Tooltip open={isOpen} onOpenChange={handleOpenChange} delayDuration={0}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleTriggerClick}
          // Basic styling to make the button invisible and act like an icon container
          className="cursor-pointer appearance-none bg-transparent border-none p-0 m-0 flex items-center justify-center"
          aria-label="View note"
        >
          <StickyNoteIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-xs break-words"
        // Stop propagation for events within the content to prevent accidental closing
        onPointerDownOutside={(event) => {
            // If the click is on the trigger itself, let the trigger's onClick handle it.
            if (event.target instanceof HTMLElement && event.target.closest('button[aria-label="View note"]')) {
              return;
            }
            setIsOpen(false);
          }}
      >
        {notes}
      </TooltipContent>
    </Tooltip>
  );
};
