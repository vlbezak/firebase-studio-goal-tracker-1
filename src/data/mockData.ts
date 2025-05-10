
import type { Match, Tournament } from '@/types/soccer';

export const MOCK_SEASONS = ["2023/2024", "2024/2025"];

export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {
  "2023/2024": [
    // Tournament 1 (Spring Invitational) - Round Robin
    { id: "2024-match-1", date: "2024-03-15", name: "Group: Eagles vs Lions", opponent: "Lions", ourScore: 3, opponentScore: 2, result: 1, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Very fair refereeing. Good passing from our team. One player got a minor knock but continued." },
    { id: "2024-match-2", date: "2024-03-16", name: "Group: Eagles vs Tigers", opponent: "Tigers", ourScore: 1, opponentScore: 2, result: 0, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Tough game, good opponent. Referee made some questionable calls." },
    { id: "2024-match-26", date: "2024-03-15", name: "Group: Eagles vs Leopards", opponent: "Leopards", ourScore: 1, opponentScore: 1, result: 0.5, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Evenly matched game, good defensive work from both sides." },
    { id: "2024-match-27", date: "2024-03-16", name: "Group: Eagles vs Panthers", opponent: "Panthers", ourScore: 4, opponentScore: 0, result: 1, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Dominant performance, fantastic goals." },
    
    // Tournament 2 (Summer Cup) - Playoff Structure
    { id: "2024-match-4", date: "2024-05-01", name: "Group Stage: Eagles vs Wolves", opponent: "Wolves", ourScore: 4, opponentScore: 1, result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Great offensive display. Dominated the midfield." },
    { id: "2024-match-28", date: "2024-05-01", name: "Group Stage: Eagles vs Bears", opponent: "Bears", ourScore: 2, opponentScore: 0, result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Controlled the game from the start." },
    { id: "2024-match-5", date: "2024-05-02", name: "Semi-final: Eagles vs Sharks", opponent: "Sharks", ourScore: 0, opponentScore: 0, result: 0.5, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Nail-biting finish! Won on penalties after a hard-fought draw. One player injured but should recover soon." },
    { id: "2024-match-29", date: "2024-05-02", name: "Final: Eagles vs Dragons", opponent: "Dragons", ourScore: 3, opponentScore: 2, result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Thrilling final, came back from 0-2 down!" },

    // Tournament 3 (Autumn Shield) - Round Robin
    { id: "2024-match-8", date: "2024-09-10", name: "Group: Eagles vs Ravens", opponent: "Ravens", ourScore: 2, opponentScore: 0, result: 1, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Solid defensive performance. Referee was excellent." },
    { id: "2024-match-9", date: "2024-09-10", name: "Group: Eagles vs Falcons", opponent: "Falcons", ourScore: 1, opponentScore: 1, result: 0.5, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "A draw, but we played better." },
    { id: "2024-match-10", date: "2024-09-11", name: "Group: Eagles vs Ospreys", opponent: "Ospreys", ourScore: 3, opponentScore: 1, result: 1, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Good attacking play." },
    { id: "2024-match-11", date: "2024-09-11", name: "Group: Eagles vs Condors", opponent: "Condors", ourScore: 0, opponentScore: 1, result: 0, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Lost in the final minutes. Disappointing." },

    // Tournament 4 (Winter Classic) - Round Robin
    { id: "2024-match-12", date: "2024-11-20", name: "Group: Eagles vs Penguins", opponent: "Penguins", ourScore: 4, opponentScore: 0, result: 1, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Comfortable win." },
    { id: "2024-match-13", date: "2024-11-20", name: "Group: Eagles vs Polar Bears", opponent: "Polar Bears", ourScore: 2, opponentScore: 2, result: 0.5, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Slippery floor! Hard to control the ball." },
    { id: "2024-match-14", date: "2024-11-20", name: "Group: Eagles vs Arctic Foxes", opponent: "Arctic Foxes", ourScore: 1, opponentScore: 3, result: 0, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "They were too quick for us today." },
    { id: "2024-match-15", date: "2024-11-20", name: "Group: Eagles vs Yetis", opponent: "Yetis", ourScore: 0, opponentScore: 0, result: 0.5, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Both teams defended well." },

    // Tournament 5 (City Championship) - Playoff Structure
    { id: "2024-match-16", date: "2024-10-05", name: "Group Stage: Eagles vs Metros", opponent: "Metros", ourScore: 5, opponentScore: 1, result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Fantastic start to the championship." },
    { id: "2024-match-17", date: "2024-10-05", name: "Group Stage: Eagles vs Urbans", opponent: "Urbans", ourScore: 3, opponentScore: 0, result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Clinical finishing." },
    { id: "2024-match-18", date: "2024-10-06", name: "Semi-final: Eagles vs Citizens", opponent: "Citizens", ourScore: 2, opponentScore: 1, result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Semi-final thriller. Our keeper was man of the match." },
    { id: "2024-match-19", date: "2024-10-06", name: "Final: Eagles vs Capitals", opponent: "Capitals", ourScore: 1, opponentScore: 0, result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Champions! Hard fought final. Referee made a few strange calls but it didn't affect the outcome." },

    // Tournament 6 (Regional Challenge) - Round Robin
    { id: "2024-match-20", date: "2024-08-15", name: "Group: Eagles vs County FC", opponent: "County FC", ourScore: 2, opponentScore: 2, result: 0.5, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Came back from two goals down." },
    { id: "2024-match-21", date: "2024-08-15", name: "Group: Eagles vs State United", opponent: "State United", ourScore: 3, opponentScore: 1, result: 1, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Good goalkeeping from opponent." },
    { id: "2024-match-22", date: "2024-08-16", name: "Group: Eagles vs Province Rovers", opponent: "Province Rovers", ourScore: 1, opponentScore: 0, result: 1, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "A very tight game, decided by a late penalty." },
    { id: "2024-match-23", date: "2024-08-16", name: "Group: Eagles vs District Albion", opponent: "District Albion", ourScore: 0, opponentScore: 2, result: 0, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Couldn't break their defense." },
    
    // Independent Matches
    { id: "2024-match-3", date: "2024-04-10", name: "Friendly: Eagles vs Bears", opponent: "Bears", ourScore: 2, opponentScore: 2, result: 0.5, place: "Home Stadium", ourTeam: "Eagles", notes: "Training match, focused on defense. Good sportsmanship from both teams." },
    { id: "2024-match-6", date: "2024-06-20", name: "League: Eagles vs Giants", opponent: "Giants", ourScore: 2, opponentScore: 1, result: 1, place: "Giants Arena", ourTeam: "Eagles", notes: "Important win to start the league. Solid defensive work in the second half." },
    { id: "2024-match-7", date: "2024-07-05", name: "Derby: Eagles vs Hawks", opponent: "Hawks", ourScore: 0, opponentScore: 1, result: 0, place: "City Stadium", ourTeam: "Eagles", notes: "Disappointing result in a heated derby. Need to work on finishing. One of our players got a yellow card." },
    { id: "2024-match-24", date: "2024-09-25", name: "Friendly: Eagles vs Spartans", opponent: "Spartans", ourScore: 3, opponentScore: 3, result: 0.5, place: "Home Training", ourTeam: "Eagles", notes: "Good practice game. Lots of goals and open play." },
    { id: "2024-match-25", date: "2024-10-20", name: "Charity Match: Eagles vs AllStars", opponent: "AllStars", ourScore: 4, opponentScore: 2, result: 1, place: "Community Field", ourTeam: "Eagles", notes: "Fun event for a good cause. Opponent scored an own goal." },
  ],
  "2024/2025": [
    // Tournament 1 (Challenge Cup) - Playoff Structure
    { id: "2025-match-2", date: "2025-03-10", name: "Quarter-final: Eagles vs Dragons", opponent: "Dragons", ourScore: 3, opponentScore: 1, result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Strong performance, controlled the game well. Pitch was a bit muddy." },
    { id: "2025-match-26", date: "2025-03-10", name: "Semi-final: Eagles vs Griffins", opponent: "Griffins", ourScore: 2, opponentScore: 2, result: 0.5, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Went to penalties, we lost. Tough luck." },
    { id: "2025-match-3", date: "2025-03-11", name: "Quarter-final: Eagles vs Phoenix", opponent: "Phoenix", ourScore: 1, opponentScore: 0, result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Tight match, late goal secured the win. Opponent very physical." }, // Note: This match existing as a QF for Eagles after a SF is logically inconsistent for a single team path, but data is preserved as per previous state.
    { id: "2025-match-27", date: "2025-03-11", name: "5th Place Match: Eagles vs Centaurs", opponent: "Centaurs", ourScore: 5, opponentScore: 0, result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Bounced back with a big win for 5th place." },

    // Tournament 2 (New Year Cup) - Round Robin
    { id: "2025-match-6", date: "2025-01-10", name: "Group: Eagles vs Icicles", opponent: "Icicles", ourScore: 3, opponentScore: 0, result: 1, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "Good start despite the cold." },
    { id: "2025-match-7", date: "2025-01-10", name: "Group: Eagles vs Blizzards", opponent: "Blizzards", ourScore: 1, opponentScore: 1, result: 0.5, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "Referee missed a clear penalty for us. Very frustrating." },
    { id: "2025-match-8", date: "2025-01-11", name: "Group: Eagles vs Frost Giants", opponent: "Frost Giants", ourScore: 0, opponentScore: 2, result: 0, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "They were physically stronger." },
    { id: "2025-match-9", date: "2025-01-11", name: "Group: Eagles vs Snowflakes", opponent: "Snowflakes", ourScore: 2, opponentScore: 1, result: 1, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "A close game, happy with the win." },

    // Tournament 3 (Spring League Kickoff) - Round Robin
    { id: "2025-match-10", date: "2025-03-25", name: "Group: Eagles vs Blossoms", opponent: "Blossoms", ourScore: 2, opponentScore: 0, result: 1, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Clean sheet and a good team effort." },
    { id: "2025-match-11", date: "2025-03-25", name: "Group: Eagles vs Seedlings", opponent: "Seedlings", ourScore: 4, opponentScore: 1, result: 1, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Our strikers were on fire." },
    { id: "2025-match-12", date: "2025-03-26", name: "Group: Eagles vs Saplings", opponent: "Saplings", ourScore: 0, opponentScore: 0, result: 0.5, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Defensive battle. Not many chances for either team." },
    { id: "2025-match-13", date: "2025-03-26", name: "Group: Eagles vs Green Shoots", opponent: "Green Shoots", ourScore: 1, opponentScore: 2, result: 0, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Conceded late, learning experience." },

    // Tournament 4 (Mid-Season Trophy) - Playoff Structure
    { id: "2025-match-14", date: "2025-06-10", name: "Group Stage: Eagles vs Rockets", opponent: "Rockets", ourScore: 3, opponentScore: 1, result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Played with high intensity." },
    { id: "2025-match-15", date: "2025-06-10", name: "Group Stage: Eagles vs Jets", opponent: "Jets", ourScore: 2, opponentScore: 0, result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Two well-worked goals." },
    { id: "2025-match-16", date: "2025-06-11", name: "Semi-final: Eagles vs Flyers", opponent: "Flyers", ourScore: 1, opponentScore: 0, result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Clean sheet! Progressed to the final." },
    { id: "2025-match-17", date: "2025-06-11", name: "Final: Eagles vs Gliders", opponent: "Gliders", ourScore: 4, opponentScore: 0, result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Total domination in the final. We are champions!" },

    // Tournament 5 (Summer Showdown) - Round Robin
    { id: "2025-match-18", date: "2025-08-01", name: "Group: Eagles vs Sharks", opponent: "Sharks", ourScore: 2, opponentScore: 1, result: 1, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Very hot weather, tough conditions." },
    { id: "2025-match-19", date: "2025-08-01", name: "Group: Eagles vs Dolphins", opponent: "Dolphins", ourScore: 1, opponentScore: 1, result: 0.5, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Fair result." },
    { id: "2025-match-20", date: "2025-08-02", name: "Group: Eagles vs Whales", opponent: "Whales", ourScore: 0, opponentScore: 1, result: 0, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Unlucky deflection for their goal. Opponent keeper played well." },
    { id: "2025-match-21", date: "2025-08-02", name: "Group: Eagles vs Barracudas", opponent: "Barracudas", ourScore: 3, opponentScore: 2, result: 1, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Exciting game with lots of chances." },

    // Tournament 6 (Champions Gala) - Playoff Structure
    { id: "2025-match-22", date: "2025-10-15", name: "Quarter-final: Eagles vs Titans", opponent: "Titans", ourScore: 1, opponentScore: 0, result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "A single goal decided it." },
    { id: "2025-match-23", date: "2025-10-15", name: "Quarter-final: Eagles vs Giants", opponent: "Giants", ourScore: 2, opponentScore: 2, result: 0.5, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Fair play award to opponent for sportsmanship. Lost on penalties." }, 
    { id: "2025-match-24", date: "2025-10-15", name: "Semi-final: Eagles vs Olympians", opponent: "Olympians", ourScore: 3, opponentScore: 1, result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Strong second half performance." }, 
    { id: "2025-match-25", date: "2025-10-15", name: "Final: Eagles vs Legends", opponent: "Legends", ourScore: 2, opponentScore: 0, result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Great way to end the gala, champions again!" },

    // Independent Matches
    { id: "2025-match-1", date: "2025-02-20", name: "Pre-season: Eagles vs Knights", opponent: "Knights", ourScore: 2, opponentScore: 0, result: 1, place: "Training Ground", ourTeam: "Eagles", notes: "Good start to pre-season, testing new formations. Referee was learning too." },
    { id: "2025-match-4", date: "2025-04-05", name: "Friendly: Eagles vs Stallions", opponent: "Stallions", ourScore: 0, opponentScore: 2, result: 0, place: "Away Ground", ourTeam: "Eagles", notes: "Need to improve defense and capitalize on chances created. Easy match for opponents." },
    { id: "2025-match-5", date: "2025-04-15", name: "Friendly: Eagles vs Comets", opponent: "Comets", ourScore: 1, opponentScore: 3, result: 0, place: "Comet Park", ourTeam: "Eagles", notes: "Some positives in attack but defensive errors cost us. One player twisted an ankle." },
    { id: "2025-match-28", date: "2025-07-10", name: "League: Eagles vs Rovers", opponent: "Rovers", ourScore: 2, opponentScore: 1, result: 1, place: "Home Field", ourTeam: "Eagles", notes: "Tough league match, crucial win." },
    { id: "2025-match-29", date: "2025-09-05", name: "Cup Qualifier: Eagles vs United", opponent: "United", ourScore: 4, opponentScore: 0, result: 1, place: "Neutral Ground", ourTeam: "Eagles", notes: "Dominated possession and qualified for next round." },
  ],
};

export const MOCK_TOURNAMENTS: Record<string, Tournament> = {
  // 2024 Tournaments
  "2024-tournament-1": { id: "2024-tournament-1", name: "Spring Invitational", season: "2023/2024", startDate: "2024-03-15", endDate: "2024-03-16", place: "Porec", finalStanding: 2, notes: "Good competitive tournament. Weather was excellent. Organization was top-notch." },
  "2024-cup-1": { id: "2024-cup-1", name: "Summer Cup", season: "2023/2024", startDate: "2024-05-01", endDate: "2024-05-02", place: "Veszprem", finalStanding: "Champions", notes: "Proud of the team's effort and spirit throughout the cup! Some tough referee calls but we overcame them." },
  "2024-tournament-2": { id: "2024-tournament-2", name: "Autumn Shield", season: "2023/2024", startDate: "2024-09-10", endDate: "2024-09-11", place: "Greenfield Park", finalStanding: 3, notes: "Well organized, tough competition. The fields were in perfect condition." },
  "2024-tournament-3": { id: "2024-tournament-3", name: "Winter Classic", season: "2023/2024", startDate: "2024-11-20", endDate: "2024-11-20", place: "Indoor Arena", finalStanding: "5th", notes: "First indoor tournament of the season. Fast paced games." },
  "2024-tournament-4": { id: "2024-tournament-4", name: "City Championship", season: "2023/2024", startDate: "2024-10-05", endDate: "2024-10-06", place: "Metro Stadium", finalStanding: 1, notes: "Fantastic win for the Eagles! The kids played their hearts out. Great support from parents." },
  "2024-tournament-5": { id: "2024-tournament-5", name: "Regional Challenge", season: "2023/2024", startDate: "2024-08-15", endDate: "2024-08-16", place: "Valley Fields", finalStanding: 2, notes: "Great teamwork displayed. Lost narrowly in the final but showed great spirit." },

  // 2025 Tournaments
  "2025-challenge-cup": { id: "2025-challenge-cup", name: "Challenge Cup", season: "2024/2025", startDate: "2025-03-10", endDate: "2025-03-11", place: "Senec", finalStanding: 5, notes: "Team performed excellently to win their placement matches. Great atmosphere at the finals weekend." },
  "2025-tournament-2": { id: "2025-tournament-2", name: "New Year Cup", season: "2024/2025", startDate: "2025-01-10", endDate: "2025-01-11", place: "Glacier Arena", finalStanding: 4, notes: "Cold weather, but good games. Some parents complained about parking." },
  "2025-tournament-3": { id: "2025-tournament-3", name: "Spring League Kickoff", season: "2024/2025", startDate: "2025-03-25", endDate: "2025-03-26", place: "Riverside Park", finalStanding: "Quarter-finalists", notes: "Promising start to the league phase. Good competitive games." },
  "2025-tournament-4": { id: "2025-tournament-4", name: "Mid-Season Trophy", season: "2024/2025", startDate: "2025-06-10", endDate: "2025-06-11", place: "Summit Fields", finalStanding: 1, notes: "Dominant performance. Unbeaten throughout the tournament." },
  "2025-tournament-5": { id: "2025-tournament-5", name: "Summer Showdown", season: "2024/2025", startDate: "2025-08-01", endDate: "2025-08-02", place: "Coastal Stadium", finalStanding: 3, notes: "Hot conditions, very competitive. Secured third place with a good final match." },
  "2025-tournament-6": { id: "2025-tournament-6", name: "Champions Gala", season: "2024/2025", startDate: "2025-10-15", endDate: "2025-10-15", place: "Victory Lane", finalStanding: "Champions", notes: "Capped off a great season with another trophy! Excellent organization." },
};

