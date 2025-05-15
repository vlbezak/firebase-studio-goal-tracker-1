
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";
import type { ReactNode } from "react";
import { Trophy, StickyNote } from "lucide-react";
import type { Match } from "@/types/soccer";

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

  if (typeof standing === 'string') {
    const standingLower = standing.toLowerCase();
    if (standingLower === "no place") {
      displayStanding = "no final standing";
    } else if (isNaN(Number(standing.replace(/[^0-9]/g, '')))) {
      displayStanding = standing;
      if (standingLower === "champions" || standingLower === "1st") iconColor = "text-yellow-500";
    } else { 
      const numericStanding = parseInt(standing.replace(/[^0-9]/g, ''), 10);
      if (isNaN(numericStanding)) {
        displayStanding = standing; 
      } else {
        switch (numericStanding) {
          case 1:
            displayStanding = "1st";
            iconColor = "text-yellow-500";
            break;
          case 2:
            displayStanding = "2nd";
            iconColor = "text-gray-400";
            break;
          case 3:
            displayStanding = "3rd";
            iconColor = "text-orange-500";
            break;
          default:
            displayStanding = `${numericStanding}th`;
            break;
        }
      }
    }
  } else if (typeof standing === 'number') { 
    switch (standing) {
      case 1:
        displayStanding = "1st";
        iconColor = "text-yellow-500";
        break;
      case 2:
        displayStanding = "2nd";
        iconColor = "text-gray-400";
        break;
      case 3:
        displayStanding = "3rd";
        iconColor = "text-orange-500";
        break;
      default:
        displayStanding = `${standing}th`;
        break;
    }
  } else {
    displayStanding = String(standing); 
  }
  
   if (displayStanding === undefined || displayStanding === null || displayStanding === "no final standing") {
     return <span className="text-xs italic text-muted-foreground">no final standing</span>;
   }

  return (
    <span className="flex items-center gap-1">
      {iconColor && <Trophy className={cn("h-4 w-4", iconColor)} />}
      {displayStanding}
    </span>
  );
}

export { StickyNote as StickyNoteIcon };


export interface ScoreParts {
  ourGoals: number;
  opponentGoals: number;
}

export function parseScore(score: string): ScoreParts | null {
  if (!score || !score.includes('-')) {
    return null; 
  }
  const parts = score.split('-');
  if (parts.length !== 2) {
    return null;
  }
  const ourGoals = parseInt(parts[0], 10);
  const opponentGoals = parseInt(parts[1], 10);

  if (isNaN(ourGoals) || isNaN(opponentGoals)) {
    return null;
  }
  return { ourGoals, opponentGoals };
}

export interface SeasonStats {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  matchesPlayed: number;
}

export function calculateSeasonStats(matches: Match[]): SeasonStats {
  const stats: SeasonStats = {
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    matchesPlayed: matches.length,
  };

  matches.forEach(match => {
    if (match.result === 1) stats.wins++;
    else if (match.result === 0.5) stats.draws++;
    else if (match.result === 0) stats.losses++;

    if (typeof match.ourScore === 'number' && typeof match.opponentScore === 'number') {
        stats.goalsFor += match.ourScore;
        stats.goalsAgainst += match.opponentScore;
    } else {
        const scoreParts = parseScore(match.score);
        if (scoreParts) {
            stats.goalsFor += scoreParts.ourGoals;
            stats.goalsAgainst += scoreParts.opponentGoals;
        }
    }
  });

  return stats;
}

export const getResultStyle = (result: number, t: (key: string) => string) => {
  if (result === 1) return { color: "var(--win-color)", letter: "W", label: t('win') };
  if (result === 0) return { color: "var(--loss-color)", letter: "L", label: t('loss') };
  return { color: "var(--draw-color)", letter: "D", label: t('draw') };
};
