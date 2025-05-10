
import type { Match, Tournament, Team } from '@/types/soccer';

export const MOCK_TEAMS: Team[] = [
  { id: "eagles", name: "MTE Eagles" },
  { id: "lions", name: "Lions" },
  { id: "tigers", name: "Tigers" },
  { id: "leopards", name: "Leopards" },
  { id: "panthers", name: "Panthers" },
  { id: "wolves", name: "Wolves" },
  { id: "bears", name: "Bears" },
  { id: "sharks", name: "Sharks" },
  { id: "dragons", name: "Dragons" },
  { id: "ravens", name: "Ravens" },
  { id: "falcons", name: "Falcons" },
  { id: "ospreys", name: "Ospreys" },
  { id: "condors", name: "Condors" },
  { id: "penguins", name: "Penguins" },
  { id: "polar-bears", name: "Polar Bears" },
  { id: "arctic-foxes", name: "Arctic Foxes" },
  { id: "yetis", name: "Yetis" },
  { id: "metros", name: "Metros" },
  { id: "urbans", name: "Urbans" },
  { id: "citizens", name: "Citizens" },
  { id: "capitals", name: "Capitals" },
  { id: "county-fc", name: "County FC" },
  { id: "state-united", name: "State United" },
  { id: "province-rovers", name: "Province Rovers" },
  { id: "district-albion", name: "District Albion" },
  { id: "spartans", name: "Spartans" },
  { id: "allstars", name: "AllStars" },
  { id: "giants", name: "Giants" },
  { id: "hawks", name: "Hawks" },
  { id: "knights", name: "Knights" },
  { id: "stallions", name: "Stallions" },
  { id: "comets", name: "Comets" },
  { id: "griffins", name: "Griffins" },
  { id: "phoenix", name: "Phoenix" },
  { id: "centaurs", name: "Centaurs" },
  { id: "icicles", name: "Icicles" },
  { id: "blizzards", name: "Blizzards" },
  { id: "frost-giants", name: "Frost Giants" },
  { id: "snowflakes", name: "Snowflakes" },
  { id: "blossoms", name: "Blossoms" },
  { id: "seedlings", name: "Seedlings" },
  { id: "saplings", name: "Saplings" },
  { id: "green-shoots", name: "Green Shoots" },
  { id: "rockets", name: "Rockets" },
  { id: "jets", name: "Jets" },
  { id: "flyers", name: "Flyers" },
  { id: "gliders", name: "Gliders" },
  { id: "dolphins", name: "Dolphins" },
  { id: "whales", name: "Whales" },
  { id: "barracudas", name: "Barracudas" },
  { id: "titans", name: "Titans" },
  { id: "olympians", name: "Olympians" },
  { id: "legends", name: "Legends" },
  { id: "rovers", name: "Rovers" },
  { id: "united", name: "United" },
  { id: "sopron", name: "Sopron" }, // Example for "MTE - Sopron"
];


export const MOCK_SEASONS = ["2023/2024", "2024/2025"];

export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {
  "2023/2024": [
    // Tournament 1 (Spring Invitational) - Round Robin
    { id: "2024-match-1", date: "2024-03-15", name: "Group: MTE Eagles vs Lions", ourTeamId: "eagles", opponentTeamId: "lions", ourScore: 3, opponentScore: 2, score: "3-2", result: 1, tournamentId: "2024-tournament-1", notes: "Very fair refereeing. Good passing from our team. One player got a minor knock but continued." },
    { id: "2024-match-2", date: "2024-03-16", name: "Group: MTE Eagles vs Tigers", ourTeamId: "eagles", opponentTeamId: "tigers", ourScore: 1, opponentScore: 2, score: "1-2", result: 0, tournamentId: "2024-tournament-1", notes: "Tough game, good opponent. Referee made some questionable calls." },
    { id: "2024-match-26", date: "2024-03-15", name: "Group: MTE Eagles vs Leopards", ourTeamId: "eagles", opponentTeamId: "leopards", ourScore: 1, opponentScore: 1, score: "1-1", result: 0.5, tournamentId: "2024-tournament-1", notes: "Evenly matched game, good defensive work from both sides." },
    { id: "2024-match-27", date: "2024-03-16", name: "Group: MTE Eagles vs Panthers", ourTeamId: "eagles", opponentTeamId: "panthers", ourScore: 4, opponentScore: 0, score: "4-0", result: 1, tournamentId: "2024-tournament-1", notes: "Dominant performance, fantastic goals." },
    
    // Tournament 2 (Summer Cup) - Playoff Structure
    { id: "2024-match-4", date: "2024-05-01", name: "Group Stage: MTE Eagles vs Wolves", ourTeamId: "eagles", opponentTeamId: "wolves", ourScore: 4, opponentScore: 1, score: "4-1", result: 1, tournamentId: "2024-cup-1", notes: "Great offensive display. Dominated the midfield." },
    { id: "2024-match-28", date: "2024-05-01", name: "Group Stage: MTE Eagles vs Bears", ourTeamId: "eagles", opponentTeamId: "bears", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, tournamentId: "2024-cup-1", notes: "Controlled the game from the start." },
    { id: "2024-match-5", date: "2024-05-02", name: "Semi-final: MTE Eagles vs Sharks", ourTeamId: "eagles", opponentTeamId: "sharks", ourScore: 0, opponentScore: 0, score: "0-0", result: 0.5, tournamentId: "2024-cup-1", notes: "Nail-biting finish! Won on penalties after a hard-fought draw. One player injured but should recover soon." },
    { id: "2024-match-29", date: "2024-05-02", name: "Final: MTE Eagles vs Dragons", ourTeamId: "eagles", opponentTeamId: "dragons", ourScore: 3, opponentScore: 2, score: "3-2", result: 1, tournamentId: "2024-cup-1", notes: "Thrilling final, came back from 0-2 down!" },

    // Tournament 3 (Autumn Shield) - Round Robin
    { id: "2024-match-8", date: "2024-09-10", name: "Group: MTE Eagles vs Ravens", ourTeamId: "eagles", opponentTeamId: "ravens", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, tournamentId: "2024-tournament-2", notes: "Solid defensive performance. Referee was excellent." },
    { id: "2024-match-9", date: "2024-09-10", name: "Group: MTE Eagles vs Falcons", ourTeamId: "eagles", opponentTeamId: "falcons", ourScore: 1, opponentScore: 1, score: "1-1", result: 0.5, tournamentId: "2024-tournament-2", notes: "A draw, but we played better." },
    { id: "2024-match-10", date: "2024-09-11", name: "Group: MTE Eagles vs Ospreys", ourTeamId: "eagles", opponentTeamId: "ospreys", ourScore: 3, opponentScore: 1, score: "3-1", result: 1, tournamentId: "2024-tournament-2", notes: "Good attacking play." },
    { id: "2024-match-11", date: "2024-09-11", name: "Group: MTE Eagles vs Condors", ourTeamId: "eagles", opponentTeamId: "condors", ourScore: 0, opponentScore: 1, score: "0-1", result: 0, tournamentId: "2024-tournament-2", notes: "Lost in the final minutes. Disappointing." },

    // Tournament 4 (Winter Classic) - Round Robin
    { id: "2024-match-12", date: "2024-11-20", name: "Group: MTE Eagles vs Penguins", ourTeamId: "eagles", opponentTeamId: "penguins", ourScore: 4, opponentScore: 0, score: "4-0", result: 1, tournamentId: "2024-tournament-3", notes: "Comfortable win." },
    { id: "2024-match-13", date: "2024-11-20", name: "Group: MTE Eagles vs Polar Bears", ourTeamId: "eagles", opponentTeamId: "polar-bears", ourScore: 2, opponentScore: 2, score: "2-2", result: 0.5, tournamentId: "2024-tournament-3", notes: "Slippery floor! Hard to control the ball." },
    { id: "2024-match-14", date: "2024-11-20", name: "Group: MTE Eagles vs Arctic Foxes", ourTeamId: "eagles", opponentTeamId: "arctic-foxes", ourScore: 1, opponentScore: 3, score: "1-3", result: 0, tournamentId: "2024-tournament-3", notes: "They were too quick for us today." },
    { id: "2024-match-15", date: "2024-11-20", name: "Group: MTE Eagles vs Yetis", ourTeamId: "eagles", opponentTeamId: "yetis", ourScore: 0, opponentScore: 0, score: "0-0", result: 0.5, tournamentId: "2024-tournament-3", notes: "Both teams defended well." },

    // Tournament 5 (City Championship) - Playoff Structure
    { id: "2024-match-16", date: "2024-10-05", name: "Group Stage: MTE Eagles vs Metros", ourTeamId: "eagles", opponentTeamId: "metros", ourScore: 5, opponentScore: 1, score: "5-1", result: 1, tournamentId: "2024-tournament-4", notes: "Fantastic start to the championship." },
    { id: "2024-match-17", date: "2024-10-05", name: "Group Stage: MTE Eagles vs Urbans", ourTeamId: "eagles", opponentTeamId: "urbans", ourScore: 3, opponentScore: 0, score: "3-0", result: 1, tournamentId: "2024-tournament-4", notes: "Clinical finishing." },
    { id: "2024-match-18", date: "2024-10-06", name: "Semi-final: MTE Eagles vs Citizens", ourTeamId: "eagles", opponentTeamId: "citizens", ourScore: 2, opponentScore: 1, score: "2-1", result: 1, tournamentId: "2024-tournament-4", notes: "Semi-final thriller. Our keeper was man of the match." },
    { id: "2024-match-19", date: "2024-10-06", name: "Final: MTE Eagles vs Capitals", ourTeamId: "eagles", opponentTeamId: "capitals", ourScore: 1, opponentScore: 0, score: "1-0", result: 1, tournamentId: "2024-tournament-4", notes: "Champions! Hard fought final. Referee made a few strange calls but it didn't affect the outcome." },

    // Tournament 6 (Regional Challenge) - Round Robin
    { id: "2024-match-20", date: "2024-08-15", name: "Group: MTE Eagles vs County FC", ourTeamId: "eagles", opponentTeamId: "county-fc", ourScore: 2, opponentScore: 2, score: "2-2", result: 0.5, tournamentId: "2024-tournament-5", notes: "Came back from two goals down." },
    { id: "2024-match-21", date: "2024-08-15", name: "Group: MTE Eagles vs State United", ourTeamId: "eagles", opponentTeamId: "state-united", ourScore: 3, opponentScore: 1, score: "3-1", result: 1, tournamentId: "2024-tournament-5", notes: "Good goalkeeping from opponent." },
    { id: "2024-match-22", date: "2024-08-16", name: "Group: MTE Eagles vs Province Rovers", ourTeamId: "eagles", opponentTeamId: "province-rovers", ourScore: 1, opponentScore: 0, score: "1-0", result: 1, tournamentId: "2024-tournament-5", notes: "A very tight game, decided by a late penalty." },
    { id: "2024-match-23", date: "2024-08-16", name: "Group: MTE Eagles vs District Albion", ourTeamId: "eagles", opponentTeamId: "district-albion", ourScore: 0, opponentScore: 2, score: "0-2", result: 0, tournamentId: "2024-tournament-5", notes: "Couldn't break their defense." },
    
    // Independent Matches
    { id: "2024-match-3", date: "2024-04-10", name: "Friendly: MTE Eagles vs Bears", ourTeamId: "eagles", opponentTeamId: "bears", ourScore: 2, opponentScore: 2, score: "2-2", result: 0.5, place: "Home Stadium", notes: "Training match, focused on defense. Good sportsmanship from both teams." },
    { id: "2024-match-6", date: "2024-06-20", name: "League: MTE Eagles vs Giants", ourTeamId: "eagles", opponentTeamId: "giants", ourScore: 2, opponentScore: 1, score: "2-1", result: 1, place: "Giants Arena", notes: "Important win to start the league. Solid defensive work in the second half." },
    { id: "2024-match-7", date: "2024-07-05", name: "Derby: MTE Eagles vs Hawks", ourTeamId: "eagles", opponentTeamId: "hawks", ourScore: 0, opponentScore: 1, score: "0-1", result: 0, place: "City Stadium", notes: "Disappointing result in a heated derby. Need to work on finishing. One of our players got a yellow card." },
    { id: "2024-match-24", date: "2024-09-25", name: "Friendly: MTE Eagles vs Spartans", ourTeamId: "eagles", opponentTeamId: "spartans", ourScore: 3, opponentScore: 3, score: "3-3", result: 0.5, place: "Home Training", notes: "Good practice game. Lots of goals and open play." },
    { id: "2024-match-25", date: "2024-10-20", name: "Charity Match: MTE Eagles vs AllStars", ourTeamId: "eagles", opponentTeamId: "allstars", ourScore: 4, opponentScore: 2, score: "4-2", result: 1, place: "Community Field", notes: "Fun event for a good cause. Opponent scored an own goal." },
  ],
  "2024/2025": [
    // Tournament 1 (Challenge Cup) - Playoff Structure
    { id: "2025-match-2", date: "2025-03-10", name: "Quarter-final: MTE Eagles vs Dragons", ourTeamId: "eagles", opponentTeamId: "dragons", ourScore: 3, opponentScore: 1, score: "3-1", result: 1, tournamentId: "2025-challenge-cup", notes: "Strong performance, controlled the game well. Pitch was a bit muddy." },
    { id: "2025-match-26", date: "2025-03-10", name: "Semi-final: MTE Eagles vs Griffins", ourTeamId: "eagles", opponentTeamId: "griffins", ourScore: 2, opponentScore: 2, score: "2-2", result: 0.5, tournamentId: "2025-challenge-cup", notes: "Went to penalties, we lost. Tough luck." },
    { id: "2025-match-3", date: "2025-03-11", name: "Quarter-final: MTE Eagles vs Phoenix", ourTeamId: "eagles", opponentTeamId: "phoenix", ourScore: 1, opponentScore: 0, score: "1-0", result: 1, tournamentId: "2025-challenge-cup", notes: "Tight match, late goal secured the win. Opponent very physical." }, 
    { id: "2025-match-27", date: "2025-03-11", name: "5th Place Match: MTE Eagles vs Centaurs", ourTeamId: "eagles", opponentTeamId: "centaurs", ourScore: 5, opponentScore: 0, score: "5-0", result: 1, tournamentId: "2025-challenge-cup", notes: "Bounced back with a big win for 5th place." },

    // Tournament 2 (New Year Cup) - Round Robin
    { id: "2025-match-6", date: "2025-01-10", name: "Group: MTE Eagles vs Icicles", ourTeamId: "eagles", opponentTeamId: "icicles", ourScore: 3, opponentScore: 0, score: "3-0", result: 1, tournamentId: "2025-tournament-2", notes: "Good start despite the cold." },
    { id: "2025-match-7", date: "2025-01-10", name: "Group: MTE Eagles vs Blizzards", ourTeamId: "eagles", opponentTeamId: "blizzards", ourScore: 1, opponentScore: 1, score: "1-1", result: 0.5, tournamentId: "2025-tournament-2", notes: "Referee missed a clear penalty for us. Very frustrating." },
    { id: "2025-match-8", date: "2025-01-11", name: "Group: MTE Eagles vs Frost Giants", ourTeamId: "eagles", opponentTeamId: "frost-giants", ourScore: 0, opponentScore: 2, score: "0-2", result: 0, tournamentId: "2025-tournament-2", notes: "They were physically stronger." },
    { id: "2025-match-9", date: "2025-01-11", name: "Group: MTE Eagles vs Snowflakes", ourTeamId: "eagles", opponentTeamId: "snowflakes", ourScore: 2, opponentScore: 1, score: "2-1", result: 1, tournamentId: "2025-tournament-2", notes: "A close game, happy with the win." },

    // Tournament 3 (Spring League Kickoff) - Round Robin
    { id: "2025-match-10", date: "2025-03-25", name: "Group: MTE Eagles vs Blossoms", ourTeamId: "eagles", opponentTeamId: "blossoms", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, tournamentId: "2025-tournament-3", notes: "Clean sheet and a good team effort." },
    { id: "2025-match-11", date: "2025-03-25", name: "Group: MTE Eagles vs Seedlings", ourTeamId: "eagles", opponentTeamId: "seedlings", ourScore: 4, opponentScore: 1, score: "4-1", result: 1, tournamentId: "2025-tournament-3", notes: "Our strikers were on fire." },
    { id: "2025-match-12", date: "2025-03-26", name: "Group: MTE Eagles vs Saplings", ourTeamId: "eagles", opponentTeamId: "saplings", ourScore: 0, opponentScore: 0, score: "0-0", result: 0.5, tournamentId: "2025-tournament-3", notes: "Defensive battle. Not many chances for either team." },
    { id: "2025-match-13", date: "2025-03-26", name: "Group: MTE Eagles vs Green Shoots", ourTeamId: "eagles", opponentTeamId: "green-shoots", ourScore: 1, opponentScore: 2, score: "1-2", result: 0, tournamentId: "2025-tournament-3", notes: "Conceded late, learning experience." },

    // Tournament 4 (Mid-Season Trophy) - Playoff Structure
    { id: "2025-match-14", date: "2025-06-10", name: "Group Stage: MTE Eagles vs Rockets", ourTeamId: "eagles", opponentTeamId: "rockets", ourScore: 3, opponentScore: 1, score: "3-1", result: 1, tournamentId: "2025-tournament-4", notes: "Played with high intensity." },
    { id: "2025-match-15", date: "2025-06-10", name: "Group Stage: MTE Eagles vs Jets", ourTeamId: "eagles", opponentTeamId: "jets", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, tournamentId: "2025-tournament-4", notes: "Two well-worked goals." },
    { id: "2025-match-16", date: "2025-06-11", name: "Semi-final: MTE Eagles vs Flyers", ourTeamId: "eagles", opponentTeamId: "flyers", ourScore: 1, opponentScore: 0, score: "1-0", result: 1, tournamentId: "2025-tournament-4", notes: "Clean sheet! Progressed to the final." },
    { id: "2025-match-17", date: "2025-06-11", name: "Final: MTE Eagles vs Gliders", ourTeamId: "eagles", opponentTeamId: "gliders", ourScore: 4, opponentScore: 0, score: "4-0", result: 1, tournamentId: "2025-tournament-4", notes: "Total domination in the final. We are champions!" },

    // Tournament 5 (Summer Showdown) - Round Robin
    { id: "2025-match-18", date: "2025-08-01", name: "Group: MTE Eagles vs Sharks", ourTeamId: "eagles", opponentTeamId: "sharks", ourScore: 2, opponentScore: 1, score: "2-1", result: 1, tournamentId: "2025-tournament-5", notes: "Very hot weather, tough conditions." },
    { id: "2025-match-19", date: "2025-08-01", name: "Group: MTE Eagles vs Dolphins", ourTeamId: "eagles", opponentTeamId: "dolphins", ourScore: 1, opponentScore: 1, score: "1-1", result: 0.5, tournamentId: "2025-tournament-5", notes: "Fair result." },
    { id: "2025-match-20", date: "2025-08-02", name: "Group: MTE Eagles vs Whales", ourTeamId: "eagles", opponentTeamId: "whales", ourScore: 0, opponentScore: 1, score: "0-1", result: 0, tournamentId: "2025-tournament-5", notes: "Unlucky deflection for their goal. Opponent keeper played well." },
    { id: "2025-match-21", date: "2025-08-02", name: "Group: MTE Eagles vs Barracudas", ourTeamId: "eagles", opponentTeamId: "barracudas", ourScore: 3, opponentScore: 2, score: "3-2", result: 1, tournamentId: "2025-tournament-5", notes: "Exciting game with lots of chances." },

    // Tournament 6 (Champions Gala) - Playoff Structure
    { id: "2025-match-22", date: "2025-10-15", name: "Quarter-final: MTE Eagles vs Titans", ourTeamId: "eagles", opponentTeamId: "titans", ourScore: 1, opponentScore: 0, score: "1-0", result: 1, tournamentId: "2025-tournament-6", notes: "A single goal decided it." },
    { id: "2025-match-23", date: "2025-10-15", name: "Quarter-final: MTE Eagles vs Giants", ourTeamId: "eagles", opponentTeamId: "giants", ourScore: 2, opponentScore: 2, score: "2-2", result: 0.5, tournamentId: "2025-tournament-6", notes: "Fair play award to opponent for sportsmanship. Lost on penalties." }, 
    { id: "2025-match-24", date: "2025-10-15", name: "Semi-final: MTE Eagles vs Olympians", ourTeamId: "eagles", opponentTeamId: "olympians", ourScore: 3, opponentScore: 1, score: "3-1", result: 1, tournamentId: "2025-tournament-6", notes: "Strong second half performance." }, 
    { id: "2025-match-25", date: "2025-10-15", name: "Final: MTE Eagles vs Legends", ourTeamId: "eagles", opponentTeamId: "legends", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, tournamentId: "2025-tournament-6", notes: "Great way to end the gala, champions again!" },

    // Independent Matches
    { id: "2025-match-1", date: "2025-02-20", name: "Pre-season: MTE Eagles vs Knights", ourTeamId: "eagles", opponentTeamId: "knights", ourScore: 2, opponentScore: 0, score: "2-0", result: 1, place: "Training Ground", notes: "Good start to pre-season, testing new formations. Referee was learning too." },
    { id: "2025-match-4", date: "2025-04-05", name: "Friendly: MTE Eagles vs Stallions", ourTeamId: "eagles", opponentTeamId: "stallions", ourScore: 0, opponentScore: 2, score: "0-2", result: 0, place: "Away Ground", notes: "Need to improve defense and capitalize on chances created. Easy match for opponents." },
    { id: "2025-match-5", date: "2025-04-15", name: "Friendly: MTE Eagles vs Comets", ourTeamId: "eagles", opponentTeamId: "comets", ourScore: 1, opponentScore: 3, score: "1-3", result: 0, place: "Comet Park", notes: "Some positives in attack but defensive errors cost us. One player twisted an ankle." },
    { id: "2025-match-28", date: "2025-07-10", name: "League: MTE Eagles vs Rovers", ourTeamId: "eagles", opponentTeamId: "rovers", ourScore: 2, opponentScore: 1, score: "2-1", result: 1, place: "Home Field", notes: "Tough league match, crucial win." },
    { id: "2025-match-29", date: "2025-09-05", name: "Cup Qualifier: MTE Eagles vs United", ourTeamId: "eagles", opponentTeamId: "united", ourScore: 4, opponentScore: 0, score: "4-0", result: 1, place: "Neutral Ground", notes: "Dominated possession and qualified for next round." },
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
