
import type { Match, Tournament } from '@/types/soccer';

export const MOCK_SEASONS = ["2024", "2025"];

export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {
  "2024": [
    // Existing Matches for Tournament 1 (Spring Invitational)
    { id: "2024-match-1", date: "2024-03-15", name: "Match vs Lions", opponent: "Lions", score: "3-2", result: 1, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Very fair refereeing. Good passing from our team. One player got a minor knock but continued." },
    { id: "2024-match-2", date: "2024-03-16", name: "Match vs Tigers", opponent: "Tigers", score: "1-2", result: 0, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Tough game, good opponent. Referee made some questionable calls." },
    { id: "2024-match-26", date: "2024-03-15", name: "Match vs Leopards", opponent: "Leopards", score: "1-1", result: 0.5, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Evenly matched game, good defensive work from both sides." },
    { id: "2024-match-27", date: "2024-03-16", name: "Match vs Panthers", opponent: "Panthers", score: "4-0", result: 1, tournamentId: "2024-tournament-1", ourTeam: "Eagles", notes: "Dominant performance, fantastic goals." },
    
    // Existing Matches for Tournament 2 (Summer Cup)
    { id: "2024-match-4", date: "2024-05-01", name: "Cup Match vs Wolves", opponent: "Wolves", score: "4-1", result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Great offensive display. Dominated the midfield." },
    { id: "2024-match-5", date: "2024-05-02", name: "Cup Semifinal vs Sharks", opponent: "Sharks", score: "0-0", result: 0.5, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Nail-biting finish! Won on penalties after a hard-fought draw. One player injured but should recover soon." },
    { id: "2024-match-28", date: "2024-05-01", name: "Cup Group vs Bears", opponent: "Bears", score: "2-0", result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Controlled the game from the start." },
    { id: "2024-match-29", date: "2024-05-02", name: "Cup Final vs Dragons", opponent: "Dragons", score: "3-2", result: 1, tournamentId: "2024-cup-1", ourTeam: "Eagles", notes: "Thrilling final, came back from 0-2 down!" },

    // Matches for New Tournament 3 (Autumn Shield)
    { id: "2024-match-8", date: "2024-09-10", name: "Match vs Ravens", opponent: "Ravens", score: "2-0", result: 1, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Solid defensive performance. Referee was excellent." },
    { id: "2024-match-9", date: "2024-09-10", name: "Match vs Falcons", opponent: "Falcons", score: "1-1", result: 0.5, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "A draw, but we played better." },
    { id: "2024-match-10", date: "2024-09-11", name: "Match vs Ospreys", opponent: "Ospreys", score: "3-1", result: 1, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Good attacking play." },
    { id: "2024-match-11", date: "2024-09-11", name: "Match vs Condors", opponent: "Condors", score: "0-1", result: 0, tournamentId: "2024-tournament-2", ourTeam: "Eagles", notes: "Lost in the final minutes. Disappointing." },

    // Matches for New Tournament 4 (Winter Classic)
    { id: "2024-match-12", date: "2024-11-20", name: "Match vs Penguins", opponent: "Penguins", score: "4-0", result: 1, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Comfortable win." },
    { id: "2024-match-13", date: "2024-11-20", name: "Match vs Polar Bears", opponent: "Polar Bears", score: "2-2", result: 0.5, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Slippery floor! Hard to control the ball." },
    { id: "2024-match-14", date: "2024-11-20", name: "Match vs Arctic Foxes", opponent: "Arctic Foxes", score: "1-3", result: 0, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "They were too quick for us today." },
    { id: "2024-match-15", date: "2024-11-20", name: "Match vs Yetis", opponent: "Yetis", score: "0-0", result: 0.5, tournamentId: "2024-tournament-3", ourTeam: "Eagles", notes: "Both teams defended well." },

    // Matches for New Tournament 5 (City Championship)
    { id: "2024-match-16", date: "2024-10-05", name: "Match vs Metros", opponent: "Metros", score: "5-1", result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Fantastic start to the championship." },
    { id: "2024-match-17", date: "2024-10-05", name: "Match vs Urbans", opponent: "Urbans", score: "3-0", result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Clinical finishing." },
    { id: "2024-match-18", date: "2024-10-06", name: "Semi-final vs Citizens", opponent: "Citizens", score: "2-1", result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Semi-final thriller. Our keeper was man of the match." },
    { id: "2024-match-19", date: "2024-10-06", name: "Final vs Capitals", opponent: "Capitals", score: "1-0", result: 1, tournamentId: "2024-tournament-4", ourTeam: "Eagles", notes: "Champions! Hard fought final. Referee made a few strange calls but it didn't affect the outcome." },

    // Matches for New Tournament 6 (Regional Challenge)
    { id: "2024-match-20", date: "2024-08-15", name: "Match vs County FC", opponent: "County FC", score: "2-2", result: 0.5, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Came back from two goals down." },
    { id: "2024-match-21", date: "2024-08-15", name: "Match vs State United", opponent: "State United", score: "3-1", result: 1, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Good goalkeeping from opponent." },
    { id: "2024-match-22", date: "2024-08-16", name: "Match vs Province Rovers", opponent: "Province Rovers", score: "1-0", result: 1, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "A very tight game, decided by a late penalty." },
    { id: "2024-match-23", date: "2024-08-16", name: "Match vs District Albion", opponent: "District Albion", score: "0-2", result: 0, tournamentId: "2024-tournament-5", ourTeam: "Eagles", notes: "Couldn't break their defense." },
    
    // Existing Independent Matches
    { id: "2024-match-3", date: "2024-04-10", name: "Friendly vs Bears", opponent: "Bears", score: "2-2", result: 0.5, place: "Home Stadium", ourTeam: "Eagles", notes: "Training match, focused on defense. Good sportsmanship from both teams." },
    { id: "2024-match-6", date: "2024-06-20", name: "League Opener vs Giants", opponent: "Giants", score: "2-1", result: 1, place: "Giants Arena", ourTeam: "Eagles", notes: "Important win to start the league. Solid defensive work in the second half." },
    { id: "2024-match-7", date: "2024-07-05", name: "Derby vs Hawks", opponent: "Hawks", score: "0-1", result: 0, place: "City Stadium", ourTeam: "Eagles", notes: "Disappointing result in a heated derby. Need to work on finishing. One of our players got a yellow card." },
    // New Independent Matches for 2024
    { id: "2024-match-24", date: "2024-09-25", name: "Friendly vs Spartans", opponent: "Spartans", score: "3-3", result: 0.5, place: "Home Training", ourTeam: "Eagles", notes: "Good practice game. Lots of goals and open play." },
    { id: "2024-match-25", date: "2024-10-20", name: "Charity Match vs AllStars", opponent: "AllStars", score: "4-2", result: 1, place: "Community Field", ourTeam: "Eagles", notes: "Fun event for a good cause. Opponent scored an own goal." },
  ],
  "2025": [
    // Existing Matches for Tournament 1 (Challenge Cup)
    { id: "2025-match-2", date: "2025-03-10", name: "Challenge Cup R1", opponent: "Dragons", score: "3-1", result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Strong performance, controlled the game well. Pitch was a bit muddy." },
    { id: "2025-match-3", date: "2025-03-11", name: "Challenge Cup QF", opponent: "Phoenix", score: "1-0", result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Tight match, late goal secured the win. Opponent very physical." },
    { id: "2025-match-26", date: "2025-03-10", name: "Challenge Cup R2", opponent: "Griffins", score: "2-2", result: 0.5, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Went to penalties, we lost. Tough luck." },
    { id: "2025-match-27", date: "2025-03-11", name: "Challenge Cup Placement", opponent: "Centaurs", score: "5-0", result: 1, tournamentId: "2025-challenge-cup", ourTeam: "Eagles", notes: "Bounced back with a big win for 5th place." },

    // Matches for New Tournament 2 (New Year Cup)
    { id: "2025-match-6", date: "2025-01-10", name: "Match vs Icicles", opponent: "Icicles", score: "3-0", result: 1, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "Good start despite the cold." },
    { id: "2025-match-7", date: "2025-01-10", name: "Match vs Blizzards", opponent: "Blizzards", score: "1-1", result: 0.5, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "Referee missed a clear penalty for us. Very frustrating." },
    { id: "2025-match-8", date: "2025-01-11", name: "Match vs Frost Giants", opponent: "Frost Giants", score: "0-2", result: 0, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "They were physically stronger." },
    { id: "2025-match-9", date: "2025-01-11", name: "Match vs Snowflakes", opponent: "Snowflakes", score: "2-1", result: 1, tournamentId: "2025-tournament-2", ourTeam: "Eagles", notes: "A close game, happy with the win." },

    // Matches for New Tournament 3 (Spring League Kickoff)
    { id: "2025-match-10", date: "2025-03-25", name: "Match vs Blossoms", opponent: "Blossoms", score: "2-0", result: 1, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Clean sheet and a good team effort." },
    { id: "2025-match-11", date: "2025-03-25", name: "Match vs Seedlings", opponent: "Seedlings", score: "4-1", result: 1, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Our strikers were on fire." },
    { id: "2025-match-12", date: "2025-03-26", name: "Match vs Saplings", opponent: "Saplings", score: "0-0", result: 0.5, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Defensive battle. Not many chances for either team." },
    { id: "2025-match-13", date: "2025-03-26", name: "Match vs Green Shoots", opponent: "Green Shoots", score: "1-2", result: 0, tournamentId: "2025-tournament-3", ourTeam: "Eagles", notes: "Conceded late, learning experience." },

    // Matches for New Tournament 4 (Mid-Season Trophy)
    { id: "2025-match-14", date: "2025-06-10", name: "Match vs Rockets", opponent: "Rockets", score: "3-1", result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Played with high intensity." },
    { id: "2025-match-15", date: "2025-06-10", name: "Match vs Jets", opponent: "Jets", score: "2-0", result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Two well-worked goals." },
    { id: "2025-match-16", date: "2025-06-11", name: "Semi-final vs Flyers", opponent: "Flyers", score: "1-0", result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Clean sheet! Progressed to the final." },
    { id: "2025-match-17", date: "2025-06-11", name: "Final vs Gliders", opponent: "Gliders", score: "4-0", result: 1, tournamentId: "2025-tournament-4", ourTeam: "Eagles", notes: "Total domination in the final. We are champions!" },

    // Matches for New Tournament 5 (Summer Showdown)
    { id: "2025-match-18", date: "2025-08-01", name: "Match vs Sharks", opponent: "Sharks", score: "2-1", result: 1, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Very hot weather, tough conditions." },
    { id: "2025-match-19", date: "2025-08-01", name: "Match vs Dolphins", opponent: "Dolphins", score: "1-1", result: 0.5, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Fair result." },
    { id: "2025-match-20", date: "2025-08-02", name: "Match vs Whales", opponent: "Whales", score: "0-1", result: 0, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Unlucky deflection for their goal. Opponent keeper played well." },
    { id: "2025-match-21", date: "2025-08-02", name: "Match vs Barracudas", opponent: "Barracudas", score: "3-2", result: 1, tournamentId: "2025-tournament-5", ourTeam: "Eagles", notes: "Exciting game with lots of chances." },

    // Matches for New Tournament 6 (Champions Gala)
    { id: "2025-match-22", date: "2025-10-15", name: "Match vs Titans", opponent: "Titans", score: "1-0", result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "A single goal decided it." },
    { id: "2025-match-23", date: "2025-10-15", name: "Match vs Giants", opponent: "Giants", score: "2-2", result: 0.5, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Fair play award to opponent for sportsmanship." },
    { id: "2025-match-24", date: "2025-10-15", name: "Semi-final vs Olympians", opponent: "Olympians", score: "3-1", result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Strong second half performance." },
    { id: "2025-match-25", date: "2025-10-15", name: "Final vs Legends", opponent: "Legends", score: "2-0", result: 1, tournamentId: "2025-tournament-6", ourTeam: "Eagles", notes: "Great way to end the gala, champions again!" },

    // Existing Independent Matches
    { id: "2025-match-1", date: "2025-02-20", name: "Pre-season vs Knights", opponent: "Knights", score: "2-0", result: 1, place: "Training Ground", ourTeam: "Eagles", notes: "Good start to pre-season, testing new formations. Referee was learning too." },
    { id: "2025-match-4", date: "2025-04-05", name: "Friendly vs Stallions", opponent: "Stallions", score: "0-2", result: 0, place: "Away Ground", ourTeam: "Eagles", notes: "Need to improve defense and capitalize on chances created. Easy match for opponents." },
    { id: "2025-match-5", date: "2025-04-15", name: "Friendly vs Comets", opponent: "Comets", score: "1-3", result: 0, place: "Comet Park", ourTeam: "Eagles", notes: "Some positives in attack but defensive errors cost us. One player twisted an ankle." },
     // Add more independent matches for 2025 if needed to meet the 3 minimum (already met)
  ],
};

export const MOCK_TOURNAMENTS: Record<string, Tournament> = {
  // 2024 Tournaments
  "2024-tournament-1": { id: "2024-tournament-1", name: "Spring Invitational", season: "2024", startDate: "2024-03-15", endDate: "2024-03-16", place: "Porec", finalStanding: 2, notes: "Good competitive tournament. Weather was excellent. Organization was top-notch." },
  "2024-cup-1": { id: "2024-cup-1", name: "Summer Cup", season: "2024", startDate: "2024-05-01", endDate: "2024-05-02", place: "Veszprem", finalStanding: "Champions", notes: "Proud of the team's effort and spirit throughout the cup! Some tough referee calls but we overcame them." },
  "2024-tournament-2": { id: "2024-tournament-2", name: "Autumn Shield", season: "2024", startDate: "2024-09-10", endDate: "2024-09-11", place: "Greenfield Park", finalStanding: 3, notes: "Well organized, tough competition. The fields were in perfect condition." },
  "2024-tournament-3": { id: "2024-tournament-3", name: "Winter Classic", season: "2024", startDate: "2024-11-20", endDate: "2024-11-20", place: "Indoor Arena", finalStanding: "5th", notes: "First indoor tournament of the season. Fast paced games." },
  "2024-tournament-4": { id: "2024-tournament-4", name: "City Championship", season: "2024", startDate: "2024-10-05", endDate: "2024-10-06", place: "Metro Stadium", finalStanding: 1, notes: "Fantastic win for the Eagles! The kids played their hearts out. Great support from parents." },
  "2024-tournament-5": { id: "2024-tournament-5", name: "Regional Challenge", season: "2024", startDate: "2024-08-15", endDate: "2024-08-16", place: "Valley Fields", finalStanding: 2, notes: "Great teamwork displayed. Lost narrowly in the final but showed great spirit." },

  // 2025 Tournaments
  "2025-challenge-cup": { id: "2025-challenge-cup", name: "Challenge Cup", season: "2025", startDate: "2025-03-10", endDate: "2025-03-11", place: "Senec", finalStanding: 5, notes: "Team performed excellently to win their placement matches. Great atmosphere at the finals weekend." }, // Adjusted standing based on new matches
  "2025-tournament-2": { id: "2025-tournament-2", name: "New Year Cup", season: "2025", startDate: "2025-01-10", endDate: "2025-01-11", place: "Glacier Arena", finalStanding: 4, notes: "Cold weather, but good games. Some parents complained about parking." },
  "2025-tournament-3": { id: "2025-tournament-3", name: "Spring League Kickoff", season: "2025", startDate: "2025-03-25", endDate: "2025-03-26", place: "Riverside Park", finalStanding: "Quarter-finalists", notes: "Promising start to the league phase. Good competitive games." },
  "2025-tournament-4": { id: "2025-tournament-4", name: "Mid-Season Trophy", season: "2025", startDate: "2025-06-10", endDate: "2025-06-11", place: "Summit Fields", finalStanding: 1, notes: "Dominant performance. Unbeaten throughout the tournament." },
  "2025-tournament-5": { id: "2025-tournament-5", name: "Summer Showdown", season: "2025", startDate: "2025-08-01", endDate: "2025-08-02", place: "Coastal Stadium", finalStanding: 3, notes: "Hot conditions, very competitive. Secured third place with a good final match." },
  "2025-tournament-6": { id: "2025-tournament-6", name: "Champions Gala", season: "2025", startDate: "2025-10-15", endDate: "2025-10-15", place: "Victory Lane", finalStanding: "Champions", notes: "Capped off a great season with another trophy! Excellent organization." },
};
