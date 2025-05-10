
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

function normalizeTeamName(name: string): string {
    let normalized = name.trim();
    // Specific normalizations based on common patterns in the data
    if (/gyirmot|gyrmot|gyormot/i.test(normalized)) normalized = "Gyirmot"; // Ensures all variations become "Gyirmot"
    else if (/gy[oöő]r eto/i.test(normalized) || normalized.toLowerCase() === "gyor" || normalized.toLowerCase() === "goyr") normalized = "Gyor ETO";
    else if (/papa elc \(pelc\)|pala elc|pelc/i.test(normalized)) normalized = "Papa ELC (PELC)";
    else if (/kelen sc|kellen/i.test(normalized) && !normalized.toLowerCase().includes("budapest")) normalized = "Kelen SC"; // Avoid matching "Budapest Kelen" as "Kelen SC"
    else if (/pandorf/i.test(normalized)) normalized = "Parndorf";
    else if (/felcs[oöő]t/i.test(normalized)) normalized = "Felcsut";
    else if (/zalaegerszeg \(zte\)|zte/i.test(normalized)) normalized = "Zalaegerszeg (ZTE)";
    else if (normalized.toLowerCase() === "zalaegerszeg mte") normalized = "Zalaegerszeg";
    else if (normalized.toLowerCase() === "rep" && name.length <=3 ) normalized = "Repcelak"; // More specific for "Rep"
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
            } else if (currentTournamentInfo.name && currentTournamentInfo.startDate) {
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

        // Tournament Header Detection
        // A line is a tournament header if:
        // - First cell is not a date AND
        // - First cell is not empty AND
        // - Column G (index 6) contains "place" (e.g., "1st place", "no place")
        if (firstCell && !parseCsvDate(firstCell) && potentialFinalStandingOrTournamentPlace && (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("place") || potentialFinalStandingOrTournamentPlace.toLowerCase() === "no place" )) {
            finalizeCurrentTournament();

            let finalStanding: string | number | undefined = undefined;
            if (potentialFinalStandingOrTournamentPlace.toLowerCase() !== "no place") {
                 if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("1st")) finalStanding = 1;
                 else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("2nd")) finalStanding = 2;
                 else if (potentialFinalStandingOrTournamentPlace.toLowerCase().includes("3rd")) finalStanding = 3;
                 else {
                    const num = parseInt(potentialFinalStandingOrTournamentPlace.match(/\d+/)?.[0] || '', 10);
                    finalStanding = !isNaN(num) ? num : potentialFinalStandingOrTournamentPlace;
                 }
            }
            
            currentTournamentInfo = {
                id: `s${seasonYear.replace('/', '')}-t${tournamentIdCounter++}`,
                name: firstCell,
                finalStanding: finalStanding,
                notes: potentialTournamentNote ? [potentialTournamentNote] : [],
                matches: [],
                startDate: undefined,
                endDate: undefined,
                place: row[1] || undefined, // Tournament place can be in col B
            };
            
            // Check if date for a single-day tournament is on the same line
            if(parseCsvDate(row[1])) { 
                currentTournamentInfo.startDate = parseCsvDate(row[1]);
                currentTournamentInfo.place = row[2] || 'Unknown Location'; // Place might shift if date is in B
            }
            continue;
        }
        
        // Tournament specific notes on their own lines (heuristic: empty cells until G or H)
        if (firstCell === '' && row.slice(1,6).every(c => c === '') && (row[6] || row[7])) {
            if (currentTournamentInfo) {
                const note = [row[6], row[7]].filter(Boolean).join('; ');
                if (note) currentTournamentInfo.notes.push(note);
            }
            continue;
        }

        // Match line processing
        let dateStr = firstCell;
        // If date is missing on the current line, but we are in a tournament context,
        // and a previous match in this tournament had a date, use that.
        if (!dateStr && currentTournamentInfo && lastKnownDateForTournamentMatches) {
            dateStr = lastKnownDateForTournamentMatches;
        }


        const parsedDate = parseCsvDate(dateStr);
        if (!parsedDate) continue; 

        // Update last known date *if* the current line provided a valid date
        if(firstCell && parseCsvDate(firstCell)) {
             lastKnownDateForTournamentMatches = firstCell;
        }


        const place = row[1];
        const teamsStr = row[2];
        const ourScoreStr = row[3];
        const theirScoreStr = row[4];
        const resultStr = row[5];
        const playoffStageOrNote = row[6]; // Column G
        const matchNoteExtra = row[7]; // Column H


        if (teamsStr && teamsStr.includes(':') && ourScoreStr && theirScoreStr && resultStr) {
            const [ourCsvTeamRaw, opponentNameRawInitial] = teamsStr.split(':').map(s => s.trim());
            
            let ourTeamNameForMatch = ourTeamDisplayName;
            let opponentNameForMatch = opponentNameRawInitial;
            let ourScore = parseInt(ourScoreStr, 10);
            let opponentScore = parseInt(theirScoreStr, 10);
            let result = parseCsvResult(resultStr);

            const normalizedOurCsvTeam = normalizeTeamName(ourCsvTeamRaw);
            const normalizedOpponentNameRaw = normalizeTeamName(opponentNameRawInitial);

            if (normalizedOpponentNameRaw.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedOpponentNameRaw.toLowerCase() === "mte") {
                opponentNameForMatch = normalizedOurCsvTeam;
                const tempScore = ourScore;
                ourScore = opponentScore;
                opponentScore = tempScore;
                if (result === 1) result = 0;
                else if (result === 0) result = 1;
            } else if (normalizedOurCsvTeam.toLowerCase() !== ourTeamDisplayName.toLowerCase() && normalizedOurCsvTeam.toLowerCase() !== "mte") {
                // Attempt to see if the "our team" part was actually the opponent (e.g. "Kelen SC" from "Kelen SC: MTE")
                 if (ourCsvTeamRaw && (teamsStr.toLowerCase().endsWith(":mte") || teamsStr.toLowerCase().endsWith(`:${ourTeamDisplayName.toLowerCase()}`))) {
                    opponentNameForMatch = normalizedOurCsvTeam; // ourCsvTeamRaw was the opponent
                    // Scores and result are already in our perspective
                 } else {
                    continue; // Skip if our team is not clearly identifiable
                 }
            } else {
                 opponentNameForMatch = normalizedOpponentNameRaw;
            }
            
            if (!opponentNameForMatch) {
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
                continue;
            }

            let matchNamePrefix = "";
            let combinedNotesArray = [];

            if (playoffStageOrNote) {
                const stageLower = playoffStageOrNote.toLowerCase();
                if (stageLower.includes("group") || stageLower.includes("final") || stageLower.includes("semi final") || stageLower.includes("quarter final") || stageLower.includes("3rd place") || stageLower.includes("5th place") || stageLower.includes("match for") || stageLower.includes("playoff")) {
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
                if (!currentTournamentInfo.place && place) currentTournamentInfo.place = place;
                
                if (!currentTournamentInfo.startDate || new Date(parsedDate) < new Date(currentTournamentInfo.startDate)) {
                    currentTournamentInfo.startDate = parsedDate;
                }
                if (!currentTournamentInfo.endDate || new Date(parsedDate) > new Date(currentTournamentInfo.endDate)) {
                    currentTournamentInfo.endDate = parsedDate;
                }
                if (place && !currentTournamentInfo.place) currentTournamentInfo.place = place;

            } else {
                 // This case is for matches that don't fall under a tournament header.
                 // Create a generic tournament for "Training match" or "Friendly" if name implies.
                 // Otherwise, they become truly independent.
                 if (firstCell.toLowerCase().includes("training match") || firstCell.toLowerCase().includes("friendly")) {
                     const genericTournamentName = firstCell;
                     const genericTournamentId = `s${seasonYear.replace('/', '')}-t${genericTournamentName.toLowerCase().replace(/\s+/g, '-')}-${tournamentIdCounter++}`;
                     
                     // Check if a tournament with this name already exists for this day/place.
                     // This is a simple check, might need more sophisticated grouping.
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
                            finalStanding: 'no place', // Typically no standing for these
                        };
                        seasonTournaments[newGenericTournament.id] = newGenericTournament;
                        match.tournamentId = newGenericTournament.id;
                        currentTournamentInfo = { // Temporarily set for this match
                            id: newGenericTournament.id,
                            name: newGenericTournament.name,
                            matches: [match],
                            notes: [],
                            startDate: newGenericTournament.startDate,
                            endDate: newGenericTournament.endDate,
                            place: newGenericTournament.place,
                        };
                        seasonMatches.push(match);
                        finalizeCurrentTournament(); // Finalize immediately
                     } else {
                        match.tournamentId = existingGenericTournament.id;
                        seasonMatches.push(match); // Add to overall matches
                        // Also add to the existing tournament's match list for internal consistency if needed later
                        const tourney = seasonTournaments[existingGenericTournament.id];
                        if (tourney && !seasonMatches.find(m => m.id === match.id && m.tournamentId === tourney.id)) {
                            // This logic is getting complex; pushing to seasonMatches and assigning tournamentId might be enough.
                        }
                     }
                 } else {
                    // Truly independent match, not part of any conceptual tournament
                    seasonMatches.push(match);
                 }
            }
        } else if (firstCell && !parseCsvDate(firstCell) && !teamsStr && !ourScoreStr && !resultStr) {
          // Might be a tournament name on its own line without "place" info, or a category like "Summer Preparation"
          // that groups subsequent matches.
          finalizeCurrentTournament(); // Finalize any previous tournament
          currentTournamentInfo = {
              id: `s${seasonYear.replace('/', '')}-t${tournamentIdCounter++}`,
              name: firstCell,
              finalStanding: potentialFinalStandingOrTournamentPlace?.toLowerCase().includes("place") ? potentialFinalStandingOrTournamentPlace : 'no place',
              notes: potentialTournamentNote ? [potentialTournamentNote] : [],
              matches: [],
              startDate: undefined,
              endDate: undefined,
              place: row[1] || undefined,
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
12.5.2024,Gyor ETO,MTE:Gyormot,4,1,WIN,,,
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
Summer Preparation,,,,,,no place,,
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
22.9.2024,Budapest Kelen,Kelen SC:MTE,2,4,LOSS,,,
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
10.11.2024,MTE,MTE:Gyorujfalu,7,1,WIN,,,
10.11.2024,MTE,MTE:Inter Bratislava,9,2,WIN,,,
,,,,,,,,
Gyor mini tournament,,,,,,no place,,
17.11.2024,Gyor,MTE:Sopron,10,4,WIN,,,
17.11.2024,Gyor,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
23.11.2024,MTE,MTE:Zalaegerszeg,6,0,WIN,,,
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
,,,,,,,2nd place in the group. Advance to Semi final
07.12.2024,Szekesfehervar,MTE:Fonix,3,0,WIN,Semifinal,,
07.12.2024,Szekesfehervar,MTE:Kecskemet,1,2,LOSS,Final,,
,,,,,,,,
Tigris Kupa,,,,,,1st place,,
25.01.2025,Repcelak,MTE:ZTE,0,1,LOSS,group,,
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,group,,
25.01.2025,Repcelak,MTE:Gyirmot,1,0,WIN,group,,
25.01.2025,Repcelak,MTE:Kiraly,2,1,WIN,Semi-final,penalty shootout
25.01.2025,Repcelak,MTE:Sopron,1,0,WIN,Final,,
,,,,,,,,
Petrzalka - training match,,,,,,no place,,
26.01.2025,Petrzalka,MTE:Petrzalka,3,7,LOSS,,"Not sure about the score, was not there. Guys were very tired after tournament day before"
,,,,,,,,
Tatabanya mini tournament,,,,,,2nd place,,
02.02.2025,Tatabanya,MTE:Tatabanya,2,1,WIN,group,,
02.02.2025,Tatabanya,MTE:Kiraly SC,6,0,WIN,group,,
02.02.2025,Tatabanya,MTE:Komarno KFC,1,1,DRAW,group,,
02.02.2025,Tatabanya,MTE:Kelen SC,0,3,LOSS,Final,,
,,,,,,,,
MTE friendly tournament,,,,,,no place,,
12.02.2025,MTE,MTE:Inter Bratislava,8,2,WIN,,,
15.02.2025,MTE,MTE:Kiraly,7,3,WIN,,,
,,,,,,,,
Gyorujfalu tournament,,,,,,3rd place,,
22.02.2025,Gyorujfalu ,MTE:Velky Meder,0,0,DRAW,group,,
22.02.2025,Gyorujfalu ,MTE:SC Sopron,1,3,LOSS,group,,
22.02.2025,Gyorujfalu ,MTE:Sarvar,3,0,WIN,group,,
22.02.2025,Gyorujfalu ,MTE:Gyorujfalu,0,1,LOSS,Semi-final,,
22.02.2025,Gyorujfalu ,MTE:Velky Meder,3,1,WIN,3rd Place Match,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
01.03.2025,MTE,MTE:Csorna,7,2,WIN,,,
01.03.2025,MTE,MTE:Parndorf,2,5,LOSS,,,
,,,,,,,,
Gyirmot U11 tournament,,,,,,6th place,Played against U11 teams. Valuable experience.
15.03.2025,Gyirmot,MTE:Gyorujfalu U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Tatai AC U11,1,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Gyirmot U11,0,2,LOSS,group,,
15.03.2025,Gyirmot,MTE:Csorna U11,0,4,LOSS,group,,
15.03.2025,Gyirmot,MTE:Gyorujbarat U11,4,2,WIN,group,,
15.03.2025,Gyirmot,MTE:Utanpotlasert U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Lebeny U11,0,1,LOSS,Match for 5th place,"penalty shootout; Nakoniec 6/13 - ale U11 turnaj"
,,,,,,,,
MTE tournament,,,,,,no place,,
23.03.2025,MTE,MTE: Csorna,1,0,WIN,,,
23.03.2025,MTE,MTE:Gyor ETO,0,1,LOSS,,,
23.03.2025,MTE,MTE:Sopron,4,3,WIN,,,
,,,,,,,,
Turnaj Tatabanya,,,,,,1st place,Event name might be Turnaj Tatabanya. Played at MTE. Great win!
29.03.2025,MTE,MTE:Kiraly,3,1,WIN,group,,
29.03.2025,MTE,MTE:Felcsut,0,0,DRAW,group,,
29.03.2025,MTE,MTE:Tatabanya,5,3,WIN,Semi-final,,
29.03.2025,MTE,MTE:Budafok,4,0,WIN,Final,,
29.03.2025,MTE,MTE:Paks,4,0,WIN,group,,
,,,,,,,,
Sopron mini tournament,,,,,,no place,Place is MTE from CSV for this Sopron mini tournament.
06.04.2025,MTE,MTE:Sopron,4,5,LOSS,,,
06.04.2025,MTE,MTE:Gyor ETO,3,1,WIN,,,
,,,,,,,,
Kellen tournament,,,,,,no place,Place is MTE from CSV. Tournament Note: Good set of games.
13.04.2025,MTE,MTE:Vasas,0,0,DRAW,,,
13.04.2025,MTE,MTE:Budai,3,1,WIN,,,
13.04.2025,MTE,MTE:Kisvarda,2,0,WIN,,,
13.04.2025,MTE,MTE:Kelen SC,0,3,LOSS,,,
,,,,,,,,
Gyor ETO mini tournament,,,,,,no place,,
26.04.2025,Gyor,MTE:Sopron,5,3,WIN,,,
26.04.2025,Gyor,MTE:Csorna,5,2,WIN,,,
26.04.2025,Gyor,MTE:Gyor ETO,2,9,LOSS,,,
,,,,,,,,
MTE Turany Imre memorial,,,,,,1st place,Great performance. Defended the title.
03.05.2025,MTE,MTE:Mosonszentmiklos,5,1,WIN,group,,
03.05.2025,MTE,MTE:DAC UP FC,4,0,WIN,group,,
03.05.2025,MTE,MTE:Gyorszentivan,8,0,WIN,group,,
03.05.2025,MTE,MTE:Csorna,1,1,DRAW,Quarter-final,Advanced on penalties.
03.05.2025,MTE,MTE:PELC,3,1,WIN,Semi-final,,
03.05.2025,MTE,MTE:Senec,7,0,WIN,Final,,
03.05.2025,MTE,MTE:Kiraly,2,1,WIN,group,,
03.05.2025,MTE,MTE:Gyirmot,1,1,DRAW,group,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
10.05.2025,MTE,MTE:Gyorujfalu,11,0,WIN,,,
10.05.2025,MTE,MTE:Kelen SC,6,1,WIN,,,
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
// Corrected: Ensure the date '17.11.2025' for two matches in Gyor mini tournament (2024/2025) is handled as per CSV,
// but the parser will treat '17.11.2024' for the Gyor ETO match as a separate entry correctly.
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

// Debugging logs (can be removed for production)
// console.log("MOCK_TEAMS:", JSON.stringify(MOCK_TEAMS.map(t => t.name), null, 2));
// console.log("MOCK_TOURNAMENTS:", JSON.stringify(Object.values(MOCK_TOURNAMENTS).map(t => ({name: t.name, season: t.season, final: t.finalStanding, notes: t.notes, start: t.startDate, end: t.endDate, place: t.place})), null, 2));
// console.log("MOCK_MATCHES_BY_SEASON['2023/2024'] count:", MOCK_MATCHES_BY_SEASON["2023/2024"]?.length);
// console.log("MOCK_MATCHES_BY_SEASON['2024/2025'] count:", MOCK_MATCHES_BY_SEASON["2024/2025"]?.length);

// const kellenTournament2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Kellen mini tournament" && t.season === "2024/2025");
// if (kellenTournament2425) {
//   console.log("Kellen mini tournament 24/25 matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === kellenTournament2425.id).map(m=>({name:m.name, date: m.date, score:m.score, notes:m.notes})));
// }

// const tigrisKupa = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Tigris Kupa" && t.season === "2024/2025");
// if (tigrisKupa) {
//     console.log(`Tigris Kupa (${tigrisKupa.id}) final: ${tigrisKupa.finalStanding}, notes: ${tigrisKupa.notes}`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tigrisKupa.id).map(m => ({ name: m.name, score: m.score, notes: m.notes, date: m.date })));
// }
// const mteTurany2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "MTE Turany Imre memorial" && t.season === "2024/2025");
// if (mteTurany2425) {
//     console.log(`MTE Turany Imre memorial 24/25 (${mteTurany2425.id}) final: ${mteTurany2425.finalStanding}, notes: ${mteTurany2425.notes}`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === mteTurany2425.id).map(m => ({ name: m.name, score: m.score, notes: m.notes, date: m.date })));
// }
// const turany2324 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turany Imre memorial" && t.season === "2023/2024");
// if (turany2324) {
//     console.log(`Turany Imre memorial 23/24 (${turany2324.id}) final: ${turany2324.finalStanding}, notes: ${turany2324.notes}`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === turany2324.id).map(m => ({ name: m.name, score: m.score, notes: m.notes, date: m.date })));
// }

// const gyirmotU11Tournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyirmot U11 tournament" && t.season === "2024/2025");
// if(gyirmotU11Tournament) {
//   console.log("Gyirmot U11 Tournament matches:", MOCK_MATCHES_BY_SEASON['2024/2025'].filter(m => m.tournamentId === gyirmotU11Tournament.id).map(m => ({name: m.name, score: m.score, notes: m.notes})));
//   console.log("Tournament notes:", gyirmotU11Tournament.notes)
// }

// Check for MTE vs Slovan BA on 13.04.2024
// const slovanBAMatch = MOCK_MATCHES_BY_SEASON["2023/2024"].find(
//   (m) => m.date === "2024-04-13" && m.opponentTeamId === generateTeamId("Slovan BA")
// );
// console.log("MTE vs Slovan BA match on 13.04.2024 found:", slovanBAMatch ? slovanBAMatch : "Not found (Correct)");
// Check notes for Tigris Kupa match: MTE vs Kiraly
// const tigrisKupaKiralyMatch = MOCK_MATCHES_BY_SEASON["2024/2025"].find(
//   m => m.name.includes("Kiraly") && MOCK_TOURNAMENTS[m.tournamentId!]?.name === "Tigris Kupa"
// )
// console.log("Tigris Kupa - MTE vs Kiraly match notes:", tigrisKupaKiralyMatch?.notes); // Expected: "penalty shootout"
// console.log("Tigris Kupa - MTE vs Kiraly match name:", tigrisKupaKiralyMatch?.name); // Expected: "Semi-final: MTE vs Kiraly" (or group depending on exact csv for that match)

// const fonixKupaMatches = MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => MOCK_TOURNAMENTS[m.tournamentId!]?.name === "Fonix Kupa Szekesfehervar");
// fonixKupaMatches.forEach(m => console.log(`Fonix Kupa Match: ${m.name}, Notes: ${m.notes}`));
// const fonixKupaTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Fonix Kupa Szekesfehervar");
// console.log("Fonix Kupa Tournament Notes:", fonixKupaTournament?.notes);

// const gyirU11 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyirmot U11 tournament");
// if (gyirU11) {
//     console.log("Gyirmot U11 notes:", gyirU11.notes);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyirU11.id).forEach(match => {
//         console.log(`Match ${match.name} notes: ${match.notes}`);
//     })
// }

// Check team Gyorujfalu
// const gyorujfaluTeam = MOCK_TEAMS.find(t => t.name === "Gyorujfalu");
// console.log("Gyorujfalu team:", gyorujfaluTeam);
// MOCK_MATCHES_BY_SEASON["2024/2025"].forEach(m => {
//   if (m.opponentTeamId === gyorujfaluTeam?.id) {
//     console.log(`Match against Gyorujfalu: ${m.name} on ${m.date}`);
//   }
// })
// const tatabanyaTournaments2425 = Object.values(MOCK_TOURNAMENTS).filter(t => t.name === "Tatabanya mini tournament" && t.season === "2024/2025");
// tatabanyaTournaments2425.forEach(t => {
//   console.log(`Tournament ${t.name} (${t.id}), Final Standing: ${t.finalStanding}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === t.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// });
// const turnajTatabanya = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turnaj Tatabanya" && t.season === "2024/2025");
// if (turnajTatabanya) {
//   console.log(`Tournament ${turnajTatabanya.name} (${turnajTatabanya.id}), Final Standing: ${turnajTatabanya.finalStanding}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === turnajTatabanya.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// }

// const gyorujfaluTourney = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyorujfalu tournament" && t.season === "2024/2025");
// if (gyorujfaluTourney) {
//   console.log(`Tournament ${gyorujfaluTourney.name} (${gyorujfaluTourney.id}), Final Standing: ${gyorujfaluTourney.finalStanding}`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyorujfaluTourney.id).forEach(match => {
//     console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//   });
// }


// Verify how "Kelen SC:MTE" is parsed for Kellen mini tournament 2024/2025
// const kellenMiniTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Kellen mini tournament" && t.season === "2024/2025");
// if (kellenMiniTournament) {
//   console.log(`Matches for ${kellenMiniTournament.name}:`);
//   MOCK_MATCHES_BY_SEASON["2024/2025"]
//     .filter(m => m.tournamentId === kellenMiniTournament.id)
//     .forEach(m => {
//       const opponent = MOCK_TEAMS.find(t => t.id === m.opponentTeamId);
//       console.log(`  ${m.name} (Opponent: ${opponent?.name}), Score: ${m.score}, Result: ${m.result}`);
//     });
// }
// Check the specific match in Kellen mini tournament 22.9.2024, Kelen SC vs MTE.
// Expected: Opponent is Kelen SC, MTE lost 2-4.
// const kelenVsMteMatch = MOCK_MATCHES_BY_SEASON["2024/2025"].find(m =>
//   m.date === "2024-09-22" &&
//   MOCK_TOURNAMENTS[m.tournamentId!]?.name === "Kellen mini tournament" &&
//   MOCK_TEAMS.find(t => t.id === m.opponentTeamId)?.name === "Kelen SC"
// );
// console.log("Kelen SC vs MTE match details:", kelenVsMteMatch);


// Check Summer Preparation events are grouped
// const summerPrepTournaments = Object.values(MOCK_TOURNAMENTS).filter(t => t.name === "Summer Preparation" && t.season === "2024/2025");
// summerPrepTournaments.forEach(t => {
//     console.log(`Summer Prep Tournament: ${t.id}, Date: ${t.startDate}, Place: ${t.place}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === t.id).forEach(match => {
//         console.log(`  Match: ${match.name}, Score: ${match.score}`);
//     });
// });
// Check independent training matches like "Petrzalka - training match"
// const petrzalkaTrainingMatchTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Petrzalka - training match" && t.season === "2024/2025");
// if (petrzalkaTrainingMatchTournament) {
//     console.log(`Petrzalka Training Match Tournament: ${petrzalkaTrainingMatchTournament.id}, Date: ${petrzalkaTrainingMatchTournament.startDate}`);
//     MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === petrzalkaTrainingMatchTournament.id).forEach(match => {
//         console.log(`  Match: ${match.name}, Score: ${match.score}, Notes: ${match.notes}`);
//     });
// }

// Check parsing of final standings like "2.nd place"
// const tatabanyaMini2nd = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Tatabanya mini tournament" && t.finalStanding === 2 && t.season === "2024/2025");
// console.log("Tatabanya mini tournament (2nd place) parsed correctly:", !!tatabanyaMini2nd, tatabanyaMini2nd?.finalStanding);

// Check parsing of notes like "penalty shootout; Nakoniec 6/13 - ale U11 turnaj"
// const gyirmotU11LebenyMatch = MOCK_MATCHES_BY_SEASON["2024/2025"].find(m => m.name.includes("Lebeny U11") && MOCK_TOURNAMENTS[m.tournamentId!]?.name === "Gyirmot U11 tournament");
// console.log("Gyirmot U11 Lebeny Match notes:", gyirmotU11LebenyMatch?.notes);

// Check the "Turnaj Tatabanya" on 29.03.2025 was parsed as 1st place
// const turnajTatabanya1st = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turnaj Tatabanya" && t.finalStanding === 1 && t.season === "2024/2025");
// console.log("Turnaj Tatabanya (1st place) parsed correctly:", !!turnajTatabanya1st, turnajTatabanya1st?.finalStanding);
// MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === turnajTatabanya1st?.id).forEach(match => {
//   console.log(`  Turnaj Tatabanya Match: ${match.name}, Score: ${match.score}, Stage: ${match.name.split(':')[0]}`);
// });

// Check "MTE Turany Imre memorial" for 2024/2025, specifically how "Quarter-final" and "Advanced on penalties" are handled.
// const mteTuranyImre2425_CsornaMatch = MOCK_MATCHES_BY_SEASON["2024/2025"].find(m =>
//   MOCK_TOURNAMENTS[m.tournamentId!]?.name === "MTE Turany Imre memorial" &&
//   m.date === "2025-05-03" &&
//   MOCK_TEAMS.find(team => team.id === m.opponentTeamId)?.name === "Csorna"
// );
// console.log("MTE Turany Imre memorial (24/25) - Csorna Match Name:", mteTuranyImre2425_CsornaMatch?.name); // Expected: "Quarter-final: MTE vs Csorna"
// console.log("MTE Turany Imre memorial (24/25) - Csorna Match Notes:", mteTuranyImre2425_CsornaMatch?.notes); // Expected: "Advanced on penalties."
// The CSV has "Quarter-final" in Col G and "Advanced on penalties." in Col H. The parser should handle this. My current parser has:
// if (playoffStageOrNote) { ... matchNamePrefix = `${playoffStageOrNote}: ` ... } else { combinedNotesArray.push(playoffStageOrNote); }
// if (matchNoteExtra) combinedNotesArray.push(matchNoteExtra);
// This is correct: playoffStageOrNote ("Quarter-final") becomes prefix. matchNoteExtra ("Advanced on penalties.") becomes note.
// It seems the CSV I was given for the previous run might have had "Quarter-final" and "Advanced on penalties" in the same column for that match.
// The NEW CSV has them in separate columns:
// 03.05.2025,MTE,MTE:Csorna,1,1,DRAW,Quarter-final,Advanced on penalties.
// This is handled correctly by the current parser logic.

// Check if "Kelen SC" and "Budapest Kelen" are distinct.
// const kelenSCTeam = MOCK_TEAMS.find(t => t.name === "Kelen SC");
// const budapestKelenPlace = MOCK_MATCHES_BY_SEASON["2024/2025"].find(m => m.place === "Budapest Kelen");
// console.log("Kelen SC Team:", kelenSCTeam); // Should exist.
// console.log("Match with place Budapest Kelen:", !!budapestKelenPlace); // Should exist.
// The normalization `!normalized.toLowerCase().includes("budapest")` for "Kelen SC" is to prevent "Budapest Kelen" (place) from being normalized to "Kelen SC" (team).
// The team "Kelen SC" should be parsed from lines like `Kelen SC:MTE`.

// Check if the date `17.11.2024` is correctly parsed for the Gyor ETO match,
// while `17.11.2025` is parsed for Sopron and Csorna matches in the Gyor mini tournament.
// const gyorMiniTournament2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyor mini tournament" && t.season === "2024/2025");
// if (gyorMiniTournament2425) {
//   console.log("Gyor mini tournament 24/25 matches with dates:");
//   MOCK_MATCHES_BY_SEASON["2024/2025"]
//     .filter(m => m.tournamentId === gyorMiniTournament2425.id)
//     .forEach(m => console.log(`  ${m.name} on ${m.date}`));
// }
// This means the Gyor mini tournament will have matches spanning two different years based on the CSV.
// The parser will create one "Gyor mini tournament" for 2024/2025 season.
// The matches within it will have dates "2025-11-17" and "2024-11-17".
// The tournament's startDate and endDate will span these. This is as per CSV.
// My `finalizeCurrentTournament` logic sorts matches by date before determining tournament start/end dates.
// So for "Gyor mini tournament", startDate will be 2024-11-17 and endDate will be 2025-11-17. This is correct based on data.
