
import type { Match, Tournament, Team } from '@/types/soccer';

const OUR_TEAM_ID = "mte";
const OUR_TEAM_NAME = "MTE";

// --- Helper functions for parsing CSV data ---
function parseCsvDate(dateStr: string): string {
    if (!dateStr || !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr.trim())) return '';
    const parts = dateStr.trim().split('.');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function parseCsvResult(resultStr: string): number {
    if (!resultStr) return -1;
    switch (resultStr.trim().toUpperCase()) {
        case 'WIN': return 1;
        case 'LOSS': return 0;
        case 'DRAW': return 0.5;
        default: return -1;
    }
}

function normalizeTeamName(name: string | undefined): string {
    if (name === undefined) return "";
    let normalized = name.trim();
    
    if (/gyirmot|gyrmot/i.test(normalized)) normalized = "Gyirmot";
    else if (/^Kiraly SC$/i.test(normalized)) normalized = "Kiraly";
    else if (/^Kellen SC$/i.test(normalized)) normalized = "Kellen"; // Kellen SC is the same as Kellen
    else if (/^Kellen$/i.test(normalized) && name.toLowerCase() !== "budapest kelen") normalized = "Kellen"; // Ensure "Kellen" itself is just "Kellen"
    else if (/gy[oöő]r eto/i.test(normalized) || normalized.toLowerCase() === "gyor" || normalized.toLowerCase() === "goyr") normalized = "Gyor ETO";
    else if (/^Petrzalka$/i.test(normalized)) normalized = "FC Petrzalka";
    else if (/papa elc \(pelc\)|pala elc|pelc/i.test(normalized)) normalized = "Papa ELC (PELC)"; // Keep this one too
    else if (/kelen sc/i.test(normalized) && !normalized.toLowerCase().includes("budapest")) normalized = "Kellen SC"; // This was for when Kellen SC was distinct, now Kellen SC -> Kellen
    else if (/pandorf/i.test(normalized)) normalized = "Parndorf";
    else if (/felcs[oöő]t/i.test(normalized)) normalized = "Felcsut";
    else if (/zalaegerszeg \(zte\)|zte/i.test(normalized) && !normalized.toLowerCase().includes("mte")) normalized = "Zalaegerszeg (ZTE)";
    else if (normalized.toLowerCase() === "zalaegerszeg mte") normalized = "Zalaegerszeg"; // For "Zalaegerszeg MTE" specifically
    else if (normalized.toLowerCase() === "rep" && name.length <=3 ) normalized = "Repcelak";
    else if (normalized.toLowerCase() === "fk slovan ivanka") normalized = "FK Slovan Ivanka";
    else if (normalized.toLowerCase() === "gyorulfalu") normalized = "Gyorujfalu";


    // General cleanup
    normalized = normalized.replace(/\(zte\)/i, '(ZTE)').trim();
    return normalized;
}


function generateTeamId(name: string): string {
    return normalizeTeamName(name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface ProcessedSeasonOutput {
    matches: Match[];
    tournaments: Record<string, Tournament>;
    opponentTeamNames: Set<string>;
}

function processSeasonCsv(
    csvData: string,
    seasonYear: string,
    ourTeamId: string,
    ourTeamDisplayName: string,
    existingOpponentIds: Map<string, string>
): ProcessedSeasonOutput {
    const lines = csvData.trim().split('\n').map(line => line.split(',').map(cell => cell.trim()));
    const seasonMatches: Match[] = [];
    const seasonTournaments: Record<string, Tournament> = {};
    const seasonOpponentNames = new Set<string>();

    let currentTournamentInfo: {
        id: string;
        name: string;
        finalStanding?: string | number;
        notes: string[];
        place?: string;
        matches: Match[];
        startDate?: string;
        endDate?: string;
    } | null = null;

    let matchIdCounter = 0;
    let tournamentIdCounter = 0;
    let lastKnownDateForTournamentMatches: string | null = null;


    const finalizeCurrentTournament = () => {
        if (currentTournamentInfo) {
            if (currentTournamentInfo.matches.length > 0) {
                currentTournamentInfo.matches.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const tournament: Tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate || currentTournamentInfo.matches[0].date,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.matches[currentTournamentInfo.matches.length - 1].date,
                    place: currentTournamentInfo.place || currentTournamentInfo.matches[0]?.place || 'Unknown Location',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : undefined,
                };
                seasonTournaments[tournament.id] = tournament;
                seasonMatches.push(...currentTournamentInfo.matches);
            } else if (currentTournamentInfo.name && currentTournamentInfo.startDate) { // Tournament header with no matches directly under it yet
                 const tournament: Tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.startDate,
                    place: currentTournamentInfo.place || 'Unknown Location',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : undefined,
                };
                seasonTournaments[tournament.id] = tournament;
            }
        }
        currentTournamentInfo = null;
        lastKnownDateForTournamentMatches = null;
    };

    for (const row of lines) {
        if (row.every(cell => cell === '')) continue;

        const firstCell = row[0];
        const potentialFinalStandingOrTournamentPlace = row[6]; // Column G
        const potentialTournamentNote = row[7]; // Column H

        if (firstCell && !parseCsvDate(firstCell) && potentialFinalStandingOrTournamentPlace && (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("place") || potentialFinalStandingOrTournamentPlace.toLowerCase() === "no place" )) {
            finalizeCurrentTournament();

            let finalStanding: string | number | undefined = undefined;
            if (potentialFinalStandingOrTournamentPlace.toLowerCase() !== "no place") {
                 if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("1st")) finalStanding = 1;
                 else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("2nd") || potentialFinalStandingOrTournamentPlace.toLowerCase().includes("2.nd")) finalStanding = 2;
                 else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("3rd")) finalStanding = 3;
                 else {
                    const num = parseInt(potentialFinalStandingOrTournamentPlace.match(/\d+/)?.[0] || '', 10);
                    finalStanding = !isNaN(num) ? num : potentialFinalStandingOrTournamentPlace;
                 }
            } else if (potentialFinalStandingOrTournamentPlace.toLowerCase() === "no place"){
                finalStanding = "no place";
            }
            
            let tournamentPlace = row[1] || undefined;
            if(tournamentPlace && tournamentPlace.toLowerCase() === "place") { // Handle CSV header "Place"
                tournamentPlace = undefined;
            }

            currentTournamentInfo = {
                id: `s${seasonYear.replace('/', '')}-t${tournamentIdCounter++}`,
                name: firstCell,
                finalStanding: finalStanding,
                notes: potentialTournamentNote ? [potentialTournamentNote] : [],
                matches: [],
                startDate: undefined, // Will be set by first match or if date is on header
                endDate: undefined,
                place: tournamentPlace,
            };
            
            if(parseCsvDate(row[1])) { 
                currentTournamentInfo.startDate = parseCsvDate(row[1]);
                currentTournamentInfo.place = row[2] || 'Unknown Location'; 
            } else if (parseCsvDate(row[0]) && firstCell === currentTournamentInfo.name) { // Date might be in firstCell if tournament name is repeated
                currentTournamentInfo.startDate = parseCsvDate(row[0]);
                currentTournamentInfo.place = row[1] || 'Unknown Location';
            }
            continue;
        }
        
        if (firstCell === '' && row.slice(1,6).every(c => c === '') && (row[6] || row[7])) {
            if (currentTournamentInfo) {
                const note = [row[6], row[7]].filter(Boolean).join('; ');
                if (note) currentTournamentInfo.notes.push(note);
            }
            continue;
        }

        let dateStr = firstCell;
        if (!dateStr && currentTournamentInfo && lastKnownDateForTournamentMatches) {
            dateStr = lastKnownDateForTournamentMatches;
        }


        const parsedDate = parseCsvDate(dateStr);
        if (!parsedDate) continue; 

        if(firstCell && parseCsvDate(firstCell)) {
             lastKnownDateForTournamentMatches = firstCell;
        }


        const place = row[1];
        const teamsStr = row[2]; // Can be "MTE:Opponent" or just "Opponent"
        const ourScoreStr = row[3];
        const theirScoreStr = row[4];
        const resultStr = row[5];
        const playoffStageOrNote = row[6]; 
        const matchNoteExtra = row[7]; 


        if ((teamsStr || (ourScoreStr && theirScoreStr)) && resultStr) { // ensure essential fields are present
            let ourTeamNameForMatch = ourTeamDisplayName;
            let opponentNameForMatch = "";
            let ourScore = parseInt(ourScoreStr, 10);
            let opponentScore = parseInt(theirScoreStr, 10);
            let result = parseCsvResult(resultStr);

            if (teamsStr.includes(':')) {
                const [team1Raw, team2Raw] = teamsStr.split(':').map(s => s.trim());
                const normalizedTeam1 = normalizeTeamName(team1Raw);
                const normalizedTeam2 = normalizeTeamName(team2Raw);

                if (normalizedTeam1.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam1.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam2;
                } else if (normalizedTeam2.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam2.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam1;
                    // Swap scores and reverse result if MTE is the second team
                    const tempScore = ourScore;
                    ourScore = opponentScore;
                    opponentScore = tempScore;
                    if (result === 1) result = 0;
                    else if (result === 0) result = 1;
                } else {
                    // MTE not explicitly mentioned, this case should ideally not happen with good CSV data
                    // Or could assume first team is "our team" if it matches some known alias,
                    // but sticking to explicit "MTE" or primary display name is safer.
                    console.warn(`MTE not found in teams string: ${teamsStr} for match on ${parsedDate}`);
                    continue;
                }
            } else if (teamsStr) { // teamsStr is just the opponent name
                opponentNameForMatch = normalizeTeamName(teamsStr);
                // Scores and result are assumed to be from MTE's perspective
            } else {
                // teamsStr is empty, but scores and result might be present. This is unusual.
                console.warn(`Missing teams string for match on ${parsedDate} but scores present.`);
                continue; 
            }
            
            if (!opponentNameForMatch) {
                 console.warn(`Could not determine opponent for match on ${parsedDate} with teamsStr: "${teamsStr}"`);
                continue;
            }
            
            const opponentNameNormalized = normalizeTeamName(opponentNameForMatch);
            seasonOpponentNames.add(opponentNameNormalized);
            let opponentId = existingOpponentIds.get(opponentNameNormalized.toLowerCase());
            if (!opponentId) {
                opponentId = generateTeamId(opponentNameNormalized);
                existingOpponentIds.set(opponentNameNormalized.toLowerCase(), opponentId);
            }

            if (isNaN(ourScore) || isNaN(opponentScore) || result === -1) {
                console.warn(`Invalid score or result for match: ${ourTeamDisplayName} vs ${opponentNameNormalized} on ${parsedDate}. Score: ${ourScoreStr}-${theirScoreStr}, Result: ${resultStr}`);
                continue;
            }

            let matchNamePrefix = "";
            let combinedNotesArray = [];

            if (playoffStageOrNote) {
                const stageLower = playoffStageOrNote.toLowerCase();
                if (stageLower.includes("group") || stageLower.includes("final") || stageLower.includes("semi final") || stageLower.includes("quarter final") || stageLower.includes("3rd place") || stageLower.includes("5th place") || stageLower.includes("match for") || stageLower.includes("playoff") || stageLower.includes("3. miesto")) {
                    matchNamePrefix = `${playoffStageOrNote}: `;
                } else {
                    combinedNotesArray.push(playoffStageOrNote);
                }
            }
            if (matchNoteExtra) combinedNotesArray.push(matchNoteExtra);


            const matchName = `${matchNamePrefix}${ourTeamNameForMatch} vs ${opponentNameNormalized}`;
            
            const match: Match = {
                id: `s${seasonYear.replace('/', '')}-m${matchIdCounter++}`,
                date: parsedDate,
                name: matchName,
                ourTeamId: ourTeamId,
                opponentTeamId: opponentId,
                ourScore,
                opponentScore,
                score: `${ourScore}-${opponentScore}`,
                result,
                place: place || undefined,
                notes: combinedNotesArray.length > 0 ? combinedNotesArray.join('; ') : undefined,
            };

            if (currentTournamentInfo) {
                match.tournamentId = currentTournamentInfo.id;
                currentTournamentInfo.matches.push(match);
                
                if (!currentTournamentInfo.startDate || new Date(parsedDate) < new Date(currentTournamentInfo.startDate)) {
                    currentTournamentInfo.startDate = parsedDate;
                }
                if (!currentTournamentInfo.endDate || new Date(parsedDate) > new Date(currentTournamentInfo.endDate)) {
                    currentTournamentInfo.endDate = parsedDate;
                }
                if (place && !currentTournamentInfo.place) currentTournamentInfo.place = place;

            } else {
                 // Create a generic tournament for "Training match", "Friendly", or "Summer Preparation" if name implies
                 if (firstCell.toLowerCase().includes("training match") || firstCell.toLowerCase().includes("friendly") || firstCell.toLowerCase().includes("summer preparation")) {
                     const genericTournamentName = firstCell;
                     const genericTournamentId = `s${seasonYear.replace('/', '')}-g${genericTournamentName.toLowerCase().replace(/\s+/g, '-')}-${tournamentIdCounter++}`;
                     
                     let existingGenericTournament = Object.values(seasonTournaments).find(
                        t => t.name === genericTournamentName && t.startDate === parsedDate && t.place === (place || 'Unknown Location')
                     );

                     if (!existingGenericTournament) {
                        const newGenericTournament: Tournament = {
                            id: genericTournamentId,
                            name: genericTournamentName,
                            season: seasonYear,
                            startDate: parsedDate,
                            endDate: parsedDate,
                            place: place || 'Unknown Location',
                            finalStanding: 'no place', 
                        };
                        seasonTournaments[newGenericTournament.id] = newGenericTournament;
                        match.tournamentId = newGenericTournament.id;
                        // Add to global matches, but also temporarily set currentTournamentInfo to group this match
                        currentTournamentInfo = { 
                            id: newGenericTournament.id, name: newGenericTournament.name, matches: [match], notes: [],
                            startDate: newGenericTournament.startDate, endDate: newGenericTournament.endDate, place: newGenericTournament.place,
                        };
                        // Don't push to seasonMatches here, finalizeCurrentTournament will do it.
                        finalizeCurrentTournament(); // Finalize immediately after this match
                     } else {
                        match.tournamentId = existingGenericTournament.id;
                        seasonMatches.push(match); 
                     }
                 } else {
                    seasonMatches.push(match); // Truly independent match
                 }
            }
        } else if (firstCell && !parseCsvDate(firstCell) && !teamsStr && !ourScoreStr && !resultStr) {
          // Might be a tournament name on its own line without explicit "place" standing.
          finalizeCurrentTournament(); 
          
          let tournamentPlace = row[1] || undefined;
          if(tournamentPlace && tournamentPlace.toLowerCase() === "place") {
              tournamentPlace = undefined;
          }
          let finalStandingParsed: string | number | undefined = 'no place';
          if(potentialFinalStandingOrTournamentPlace && potentialFinalStandingOrTournamentPlace.toLowerCase() !== 'no place') {
            if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("1st")) finalStandingParsed = 1;
            else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("2nd") || potentialFinalStandingOrTournamentPlace.toLowerCase().includes("2.nd")) finalStandingParsed = 2;
            else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("3rd")) finalStandingParsed = 3;
            else {
               const num = parseInt(potentialFinalStandingOrTournamentPlace.match(/\d+/)?.[0] || '', 10);
               finalStandingParsed = !isNaN(num) ? num : potentialFinalStandingOrTournamentPlace;
            }
          }


          currentTournamentInfo = {
              id: `s${seasonYear.replace('/', '')}-t${tournamentIdCounter++}`,
              name: firstCell,
              finalStanding: finalStandingParsed,
              notes: potentialTournamentNote ? [potentialTournamentNote] : [],
              matches: [],
              startDate: undefined, 
              endDate: undefined,
              place: tournamentPlace,
          };
        }
    }

    finalizeCurrentTournament();

    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: seasonOpponentNames };
}

const CSV_2023_2024 = `
Senect CUP,,,,,,1st place,,
9.3.2024,Senec,MTE:Stupava,3,0,WIN,group,,
9.3.2024,Senec,MTE:Domino,3,1,WIN,group,,
9.3.2024,Senec,MTE:Inter Bratislava,5,1,WIN,group,,
9.3.2024,Senec,MTE: FK Slovan Ivanka,2,1,WIN,group,,
9.3.2024,Senec,MTE:Senec1,3,0,WIN,group,,
9.3.2024,Senec,MTE:Senec2,4,2,WIN,semi final,,
9.3.2024,Senec,MTE:Senec1,3,1,WIN,final,,
,,,,,,,,
DAC tournament,,,,,,1st place,,
16.3.2024,DAC,MTE:DAC1,5,4,WIN,group,,
16.3.2024,DAC,MTE:DAC2,9,4,WIN,group,,
16.3.2024,DAC,MTE:Kecskemet,4,3,WIN,group,,
16.3.2024,DAC,MTE:Fehervar,6,3,WIN,group,,
,,,,,,,,
ZTE tournament,,,,,,no place,,
23.3.2024,Zalaegerszeg,MTE:Gyirmot,3,2,WIN,,,
23.3.2024,Zalaegerszeg,MTE:Zalaegerszeg (ZTE),1,2,LOSS,,,
23.3.2024,Zalaegerszeg,MTE:Veszprem,10,1,WIN,,,
,,,,,,,,
Training match,,,,,,no place,,
27.3.2024,MITE,MTE:MITE,20,1,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
06.4.2024,MTE,MTE:Gyirmot,5,2,WIN,,,
06.4.2024,MTE,MTE:Tatabanya,8,1,WIN,,,
06.4.2024,MTE,MTE:Gyor ETO,6,5,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
13.4.2024,MTE,MTE:Csorna,12,2,WIN,,,
13.4.2024,MTE,MTE:Zalaegerszeg,4,4,DRAW,,,
13.4.2024,MTE,MTE:Karlova Ves,5,2,WIN,,,
,,,,,,,,
Gyirmot mini torunament,,,,,,no place,,
20.4.2024,Gyirmot,MTE:Gyirmot,4,1,WIN,,,
20.4.2024,Gyirmot,MTE:Veszprem,7,0,WIN,,,
20.4.2024,Gyirmot,MTE:Gyor ETO,2,9,LOSS,,,
,,,,,,,,
Parndorf mini tournament,,,,,,no place,,
25.4.2024,Parndorf,MTE:Vieden 1,9,4,WIN,,,
25.4.2024,Parndorf,MTE:Vieden 2,10,2,WIN,,,
25.4.2024,Parndorf,MTE:Parndorf,6,1,WIN,,,
,,,,,,,,
Sombathely mini tournament,,,,,,no place,,
28.4.2024,Sombathely,MTE:Kiraly,3,2,WIN,,,
28.4.2024,Sombathely,MTE:Csorna,6,0,WIN,,,
28.4.2024,Sombathely,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
Turany Imre memorial,,,,,,1st place,,
4.5.2024,MTE,MTE:Rajka,10,0,WIN,group,,
4.5.2024,MTE,MTE:Dunaszeg,5,0,WIN,group,,
4.5.2024,MTE,MTE: Nebulo,7,0,WIN,group,,
4.5.2024,MTE,MTE: Papa ELC,2,1,WIN,group,,
4.5.2024,MTE,MTE: Csorna,3,0,WIN,semi final,,
4.5.2024,MTE,MTE: Pala ELC,4,0,WIN,final,,
,,,,,,,,
Gyor mini tournament,,,,,,no place,,
12.5.2024,Gyor ETO,MTE:Gyor,0,4,LOSS,,,
12.5.2024,Gyor ETO,MTE:Gyirmot,4,1,WIN,,,
12.5.2024,Gyor ETO,MTE:Tatabanya,9,1,WIN,,,
,,,,,,,,
Vezprem mini tournament,,,,,,no place,,
26.5.2024,Vezprem,MTE:Veszprem,2,2,DRAW,,,
26.5.2024,Vezprem,MTE:Gyirmot,7,1,WIN,,,
26.5.2024,Vezprem,MTE:ZTE,6,3,WIN,,,
,,,,,,,,
Brno Memorial Vaclava Michny,,,,,,1st place,,
08.06.2024,Brno,MTE:FC Dosta Bystrc,9,0,WIN,group,,
08.06.2024,Brno,MTE:WAF Brigittenau,6,2,WIN,group,,
08.06.2024,Brno,MTE:Heidenauer,10,0,WIN,group,,
08.06.2024,Brno,MTE:FC Zbrojovka Brno,9,0,WIN,group,,
08.06.2024,Brno,MTE:TJ Iskra Holic,10,3,WIN,group,,
08.06.2024,Brno,MTE:Banik OStrava,9,0,WIN,group,,
`;

const CSV_2024_2025 = `
Summer Preparation,Place,Teams,Our,Theirs,,no place,,
19.7.2024,MTE,MTE:Okos Foci,20,4,WIN,,,
Summer Preparation,,,,,,no place,,
7.8.2024,Gyirmot,MTE:Gyirmot,12,6,WIN,,,
Summer Preparation,,,,,,no place,,
23.8.2024,MTE,MTE:Papa,14,2,WIN,,,
31.8.2024,MTE,MTE: Petrzalka,3,1,WIN,,,
31.8.2024,MTE,MTE:Gyirmot,8,4,WIN,,,
Summer Preparation,,,,,,no place,,
3.9.2024,MITE,MTE:MITE,14,2,WIN,,,
Summer Preparation,,,,,,no place,,
4.9.2024,Pandorf,MTE:Pandorf,16,1,WIN,,,
,,,,,,,,
Kellen mini tournament,,,,,,no place,,
22.9.2024,Budapest Kelen,MTE:Meszoly,2,2,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Dunakeszi,4,4,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Kelen SC,2,4,LOSS,,,
22.9.2024,Budapest Kelen,MTE:Budai,8,1,WIN,,,
22.9.2024,Budapest Kelen,MTE:Budaros,2,1,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
29.9.2024,MTE,MTE:Sopron,5,0,WIN,,,
29.9.2024,MTE,MTE:Csorna,5,1,WIN,,,
29.9.2024,MTE,MTE:Gyor ETO,1,11,LOSS,,,
,,,,,,,,
Sopron mini tournament,,,,,,no place,,
2.10.2024,Sopron,MTE:Gyor ETO,2,1,WIN,,,
2.10.2024,Sopron,MTE:Sopron,4,3,WIN,,,
2.10.2024,Sopron,MTE:Csorna,7,0,WIN,,,
,,,,,,,,
Gyirmot mini tournament,,,,,,no place,,
13.10.2024,Gyirmot,MTE:Kiraly Academy,4,0,WIN,,,
13.10.2024,Gyirmot,MTE:Illes Academy,4,1,WIN,,,
13.10.2024,Gyirmot,MTE:MTK Budapest,2,0,WIN,,,
13.10.2024,Gyirmot,MTE:Gyirmot,1,3,LOSS,,,
,,,,,,,,
Csorna mini tournament,,,,,,no place,,
20.10.2024,Csorna,MTE:Csorna,2,3,LOSS,,,
20.10.2024,Csorna,MTE:Sopron,6,1,WIN,,,
20.10.2024,Csorna,MTE:Gyor ETO,3,0,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
10.11.2024,MTE,MTE:FC Petrzalka,3,2,WIN,,,
10.11.2024,MTE,MTE:Gyorulfalu,7,1,WIN,,,
10.11.2024,MTE,MTE:Inter Bratislava,9,2,WIN,,,
,,,,,,,,
Gyor mini tournament,,,,,,no place,,
17.11.2025,Gyor,MTE:Sopron,10,4,WIN,,,
17.11.2025,Gyor,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
23.11.2024,MTE,MTE:Zalaegerszeg MTE,6,0,WIN,,,
23.11.2024,MTE,MTE:Kiraly SE,5,3,WIN,,,
23.11.2024,MTE,MTE:Gyirmot,5,0,WIN,,,
,,,,,,,,
DAC mini tournament,,,,,,no place,,
30.11.2024,DAC Mol Academy,MTE:FC Nitra,5,2,WIN,,,
30.11.2024,DAC Mol Academy,MTE:DAC,7,3,WIN,,,
,,,,,,,,
Fonix Kupa Szekesfehervar,,,,,,2nd place,,
07.12.2024,Szekesfehervar,MTE: Sekszar,5,1,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Jaszfenyszaru,4,0,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Siofok,3,1,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Meszoly,0,1,LOSS,group,,
07.12.2024,Szekesfehervar,MTE:Kecskemet,0,2,LOSS,group,,
07.12.2024,Szekesfehervar,MTE:Ikarusz,5,2,WIN,group,,
,,,,,,,2.nd place in the group. Advance to Semi final,
07.12.2024,Szekesfehervar,MTE:Fonix,3,0,WIN,Semifinal,,
07.12.2024,Szekesfehervar,MTE:Kecskemet,1,2,LOSS,Final,,
,,,,,,,,
Tigris Kupa,,,,,,1st place,,
25.01.2025,Rep,MTE:ZTE,0,1,LOSS,group,,
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,group,,
25.01.2025,Repcelak,MTE:gyirmot,1,0,WIN,group,,
25.01.2025,Repcelak,MTE:Kiraly,2,1,WIN,group,penalty shootout,
25.01.2025,Repcelak,MTE:Sopron,1,0,WIN,group,,
,,,,,,,,
Petrzalka - training match,,,,,,no place,,
26.01.2025,Petrzalka,MTE:Petrzalka,3,7,LOSS,,"Not sure about the score, was not there. Guys were very tired after tournament day before",
,,,,,,,,
Tatabanya mini tournament,,,,,,2.nd place,,
02.02.2025,Tatabanya,MTE:Tatabanya,2,1,WIN,group,,
02.02.2025,Tatabanya,MTE:Kiraly SC,6,0,WIN,group,,
02.02.2025,Tatabanya,MTE:Komarno KFC,1,1,DRAW,group,,
02.02.2025,Tatabanya,MTE:Kelen SC,0,3,LOSS,group,,
,,,,,,,,
MTE friendly tournament,,,,,,no place,,
12.02.2025,MTE,MTE:Inter Bratislava,8,2,WIN,,,
15.02.2025,MTE,MTE:Kiraly,7,3,WIN,,,
,,,,,,,,
Gyorujfalu tournament,,,,,,3rd place,,
22.02.2025,Gyorujfalu ,MTE:Velky Meder,0,0,DRAW,group,,
22.02.2025,Gyorujfalu ,MTE:SC Sopron,1,3,LOSS,group,,
22.02.2025,Gyorujfalu ,MTE:Sarvar,3,0,WIN,group,,
22.02.2025,Gyorujfalu ,MTE:Gyorujfalu,0,1,LOSS,group,,
22.02.2025,Gyorujfalu ,MTE:Velky Meder,3,1,WIN,group,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
01.03.2025,MTE,MTE:Csorna,7,2,WIN,,,
01.03.2025,MTE,MTE:Parndorf,2,5,LOSS,,,
,,,,,,,,
Gyirmot U11 tournament,,,,,,6th place,,
15.03.2025,Gyirmot,MTE:Gyorujfalu U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Tatai AC U11,1,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Gyirmot U11,0,2,LOSS,group,,
15.03.2025,Gyirmot,MTE:Csorna U11,0,4,LOSS,group,,
15.03.2025,Gyirmot,MTE:Gyorujbarat U11,4,2,WIN,group,,
15.03.2025,Gyirmot,MTE:Utanpotlasert U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Lebeny U11,0,1,LOSS,match for 5th place,penalty shootout,
,,,,,,,,
MTE tournament,,,,,,no place,,
23.03.2025,MTE,MTE: Csorna,1,0,WIN,,,
23.03.2025,MTE,MTE:Gyor ETO,0,1,LOSS,,,
23.03.2025,MTE,MTE:Sopron,4,3,WIN,,,
,,,,,,,,
Turnaj Tatabanya,,,,,,no place,,
29.03.2025,MTE,MTE:Kiraly,3,1,WIN,,,
29.03.2025,MTE,MTE:Felcsot,0,0,DRAW,,,
29.03.2025,MTE,MTE:Tatabanya,5,3,WIN,,,
29.03.2025,MTE,MTE:Budafok,4,0,WIN,,,
29.03.2025,MTE,MTE:Paks,4,0,WIN,,,
,,,,,,,,
Sopron mini tournament,,,,,,no place,,
06.04.2025,MTE,MTE:Sopron,4,5,LOSS,,,
06.04.2025,MTE,MTE:Gyor ETO,3,1,WIN,,,
,,,,,,,,
Kellen tournament,,,,,,no place,,
13.04.2025,MTE,MTE:Vasas,0,0,DRAW,,,
13.04.2025,MTE,MTE:Budai,3,1,WIN,,,
13.04.2025,MTE,MTE:Kisvarda,2,0,WIN,,,
13.04.2025,MTE,MTE:Kellen,0,3,LOSS,,,
,,,,,,,,
Gyor ETO mini tournament,,,,,,no place,,
26.04.2025,Gyor,MTE:Sopron,5,3,WIN,,,
26.04.2025,Gyor,MTE:Csorna,5,2,WIN,,,
26.04.2025,Gyor,MTE:Gyor ETO,2,9,LOSS,,,
,,,,,,,,
MTE Turany Imre memorial,,,,,,1st place,,
03.05.2025,MTE,MTE:Mosonszentmiklos,5,1,WIN,group,,
03.05.2025,MTE,MTE:DAC UP FC,4,0,WIN,group,,
03.05.2025,MTE,MTE:Gyorszentivan,8,0,WIN,group,,
03.05.2025,MTE,MTE:Csorna,1,1,DRAW,group,,
03.05.2025,MTE,MTE:PELC,3,1,WIN,group,,
03.05.2025,MTE,MTE:Senec,7,0,WIN,group,,
03.05.2025,MTE,MTE:Kiraly,2,1,WIN,group,,
03.05.2025,MTE,MTE:Gyirmot,1,1,DRAW,group,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
10.05.2025,MTE,MTE:Gyorujfalu,11,0,WIN,,,
10.05.2025,MTE,MTE:Kellen,6,1,WIN,,,
10.05.2025,MTE,MTE:Kiraly,6,3,WIN,,,
`;


export const MOCK_SEASONS = ["2023/2024", "2024/2025"];
export let MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {};
export let MOCK_TOURNAMENTS: Record<string, Tournament> = {};
export let MOCK_TEAMS: Team[] = [{ id: OUR_TEAM_ID, name: OUR_TEAM_NAME }];

const allOpponentNamesGlobal = new Set<string>();
const opponentNameToIdMapGlobal = new Map<string, string>();

// Process 2023/2024 Season
const data2324 = processSeasonCsv(CSV_2023_2024, "2023/2024", OUR_TEAM_ID, OUR_TEAM_NAME, opponentNameToIdMapGlobal);
MOCK_MATCHES_BY_SEASON["2023/2024"] = data2324.matches;
MOCK_TOURNAMENTS = { ...MOCK_TOURNAMENTS, ...data2324.tournaments };
data2324.opponentTeamNames.forEach(name => allOpponentNamesGlobal.add(name));

// Process 2024/2025 Season
const data2425 = processSeasonCsv(CSV_2024_2025, "2024/2025", OUR_TEAM_ID, OUR_TEAM_NAME, opponentNameToIdMapGlobal);
MOCK_MATCHES_BY_SEASON["2024/2025"] = data2425.matches;
MOCK_TOURNAMENTS = { ...MOCK_TOURNAMENTS, ...data2425.tournaments };
data2425.opponentTeamNames.forEach(name => allOpponentNamesGlobal.add(name));


allOpponentNamesGlobal.forEach(name => {
    const normalizedName = normalizeTeamName(name);
    const teamId = opponentNameToIdMapGlobal.get(normalizedName.toLowerCase()) || generateTeamId(normalizedName);
    if (!MOCK_TEAMS.find(t => t.id === teamId)) {
        MOCK_TEAMS.push({ id: teamId, name: normalizedName });
    }
});

const ourTeamEntity = MOCK_TEAMS.find(t => t.id === OUR_TEAM_ID);
const otherTeams = MOCK_TEAMS.filter(t => t.id !== OUR_TEAM_ID).sort((a, b) => a.name.localeCompare(b.name));
if (ourTeamEntity) {
    MOCK_TEAMS.length = 0; 
    MOCK_TEAMS.push(ourTeamEntity, ...otherTeams);
}
// console.log("All Teams:", JSON.stringify(MOCK_TEAMS.map(t => t.name), null, 2));
// console.log("Tournaments:", JSON.stringify(Object.values(MOCK_TOURNAMENTS).map(t => ({name: t.name, season: t.season, final: t.finalStanding, notes: t.notes, start: t.startDate, end: t.endDate, place: t.place})), null, 2));
// console.log("2023/2024 Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"]?.length);
// console.log("2024/2025 Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"]?.length);

// const turnajTatabanya2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turnaj Tatabanya" && t.season === "2024/2025");
// if (turnajTatabanya2425) {
//   console.log(`Turnaj Tatabanya (24/25) (${turnajTatabanya2425.id}) final: ${turnajTatabanya2425.finalStanding}, notes: ${turnajTatabanya2425.notes}, place: ${turnajTatabanya2425.place}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === turnajTatabanya2425.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}, Place: ${match.place}`);
//   });
// }

// const gyorujfaluTournament2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyorujfalu tournament" && t.season === "2024/2025");
// if (gyorujfaluTournament2425) {
//   console.log(`Gyorujfalu tournament (24/25) (${gyorujfaluTournament2425.id}) final: ${gyorujfaluTournament2425.finalStanding}, notes: ${gyorujfaluTournament2425.notes}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyorujfaluTournament2425.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// }

// const tigrisKupa2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Tigris Kupa" && t.season === "2024/2025");
// if (tigrisKupa2425) {
//   console.log(`Tigris Kupa (24/25) (${tigrisKupa2425.id}) final: ${tigrisKupa2425.finalStanding}, notes: ${tigrisKupa2425.notes}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tigrisKupa2425.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// }

// const gyirmotU11_2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyirmot U11 tournament" && t.season === "2024/2025");
// if (gyirmotU11_2425) {
//   console.log(`Gyirmot U11 tournament (24/25) final: ${gyirmotU11_2425.finalStanding}, notes: ${gyirmotU11_2425.notes}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyirmotU11_2425.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// }

// const mteTurany2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "MTE Turany Imre memorial" && t.season === "2024/2025");
// if (mteTurany2425) {
//     console.log(`MTE Turany Imre memorial 24/25 (${mteTurany2425.id}) final: ${mteTurany2425.finalStanding}, notes: ${mteTurany2425.notes}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === mteTurany2425.id).forEach(match => {
//         console.log(`  Match: ${match.name} (${match.id}), Score: ${match.score}, Notes: ${match.notes}, Date: ${match.date}`);
//     });
// }

// const kellenTournament2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Kellen tournament" && t.season === "2024/2025" && t.startDate === "2025-04-13");
// if (kellenTournament2425) {
//     console.log(`Kellen tournament 13.04.2025 (${kellenTournament2425.id}) final: ${kellenTournament2425.finalStanding}, notes: ${kellenTournament2425.notes}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === kellenTournament2425.id).forEach(match => {
//         const opponent = MOCK_TEAMS.find(t => t.id === match.opponentTeamId);
//         console.log(`  Match: ${match.name} (Opponent: ${opponent?.name}), Score: ${match.score}, Notes: ${match.notes}`);
//     });
// }

// const kellenMiniTournament2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Kellen mini tournament" && t.season === "2024/2025" && t.startDate === "2024-09-22");
// if (kellenMiniTournament2425) {
//     console.log(`Kellen mini tournament 22.09.2024 (${kellenMiniTournament2425.id}) final: ${kellenMiniTournament2425.finalStanding}, notes: ${kellenMiniTournament2425.notes}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === kellenMiniTournament2425.id).forEach(match => {
//         const opponent = MOCK_TEAMS.find(t => t.id === match.opponentTeamId);
//         console.log(`  Match: ${match.name} (Opponent: ${opponent?.name}), Score: ${match.score}, Notes: ${match.notes}`);
//     });
// }

// const summerPrepTournaments2425 = Object.values(MOCK_TOURNAMENTS).filter(t => t.name === "Summer Preparation" && t.season === "2024/2025");
// summerPrepTournaments2425.forEach(t => {
//     console.log(`Summer Prep Tournament: ${t.id}, Date: ${t.startDate}, Place: ${t.place}, Final: ${t.finalStanding}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === t.id).forEach(match => {
//         console.log(`  Match: ${match.name}, Score: ${match.score}`);
//     });
// });

// const petrzalkaTrainingMatch = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Petrzalka - training match" && t.season === "2024/2025");
// if(petrzalkaTrainingMatch){
//     console.log(`Petrzalka Training Match: ${petrzalkaTrainingMatch.id}, Date: ${petrzalkaTrainingMatch.startDate}, Final: ${petrzalkaTrainingMatch.finalStanding}, Notes: ${petrzalkaTrainingMatch.notes}`);
//      MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === petrzalkaTrainingMatch.id).forEach(match => {
//         console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//     });
// }
