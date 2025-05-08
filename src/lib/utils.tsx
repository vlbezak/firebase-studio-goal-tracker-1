
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";
import type { ReactNode } from "react";
import { Trophy, StickyNote } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string, dateFormat = "dd.MM.yyyy"): string {
  try {
    return format(parseISO(dateString), dateFormat);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return dateString; // Return original string if parsing fails
  }
}

export function formatDateRange(startDateString: string, endDateString?: string): string {
  const formattedStartDate = formatDate(startDateString, "dd.MM");
  if (endDateString && startDateString !== endDateString) {
    const formattedEndDate = formatDate(endDateString, "dd.MM");
    // Check if year is different, then include year for both
    if (parseISO(startDateString).getFullYear() !== parseISO(endDateString).getFullYear()) {
        return `${formatDate(startDateString, "dd.MM.yyyy")} - ${formatDate(endDateString, "dd.MM.yyyy")}`;
    }
    return `${formattedStartDate} - ${formattedEndDate}`;
  }
  return formatDate(startDateString, "dd.MM.yyyy"); // Show full date if single day or start/end same
}

export function getFinalStandingDisplay(standing?: number | string): ReactNode {
  if (standing === undefined || standing === null) return null;

  let displayStanding: ReactNode;
  let iconColor = "";

  if (typeof standing === 'string' && isNaN(Number(standing.replace(/[^0-9]/g, '')))) { // Non-numeric string like "Champions" or "1st Place"
    displayStanding = standing;
    // Corrected: removed `standing === 1` as it's a string comparison branch.
    if (standing.toLowerCase() === "champions" || standing.toLowerCase() === "1st") iconColor = "text-yellow-500";
  } else { // Handles numbers and strings like "1st", "2nd" (which parseInt can handle after stripping non-digits)
    const numericStanding = typeof standing === 'string' ? parseInt(standing.replace(/[^0-9]/g, ''), 10) : standing;
    if (isNaN(numericStanding)) {
        // If after trying to parse, it's still NaN, and it wasn't caught by the above (e.g. empty string or weird cases)
        // For robustess, display original string if it was a string.
        displayStanding = typeof standing === 'string' ? standing : String(standing);
    } else {
        switch (numericStanding) {
          case 1:
            displayStanding = "1st";
            iconColor = "text-yellow-500"; // Gold
            break;
          case 2:
            displayStanding = "2nd";
            iconColor = "text-gray-400"; // Silver
            break;
          case 3:
            displayStanding = "3rd";
            iconColor = "text-orange-500"; // Bronze
            break;
          default:
            displayStanding = `${numericStanding}th`;
            break;
        }
    }
  }
  // Fallback if displayStanding is not set (e.g. numericStanding was NaN and it was a number type initially)
  if (!displayStanding) {
    displayStanding = String(standing);
  }


  return (
    <span className="flex items-center gap-1">
      {iconColor && <Trophy className={cn("h-4 w-4", iconColor)} />}
      {displayStanding}
    </span>
  );
}

// Corrected export: export the imported 'StickyNote' as 'StickyNoteIcon'
export { StickyNote as StickyNoteIcon };
