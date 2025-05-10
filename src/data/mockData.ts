
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

function generateTeamId(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface ProcessedSeasonOutput {
    matches: Match[];
    tournaments: Tournament[];
    opponentTeamNames: Set<string>;
}

function processSeasonCsv(
    csvData: string,
    seasonYear: string,
    ourTeamId: string,
    ourTeamDisplayName: string, // Use a different parameter for display name
    existingOpponentIds: Map<string, string>
): ProcessedSeasonOutput {
    const lines = csvData.trim().split('\n').map(line => line.split(',').map(cell => cell.trim()));
    const seasonMatches: Match[] = [];
    const seasonTournaments: Tournament[] = [];
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
        isPseudoTournament: boolean; // For headers like "Training match"
    } | null = null;

    let matchIdCounter = 0;
    let tournamentIdBase = 0;
    let lastKnownDate: string | null = null;

    const finalizeCurrentTournament = () => {
        if (currentTournamentInfo && currentTournamentInfo.matches.length > 0) {
            if (!currentTournamentInfo.isPseudoTournament) {
                const tournament: Tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate || currentTournamentInfo.matches[0].date,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.matches[currentTournamentInfo.matches.length - 1].date,
                    place: currentTournamentInfo.place || currentTournamentInfo.matches[0].place || 'Unknown',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : undefined,
                };
                seasonTournaments.push(tournament);
            }
            seasonMatches.push(...currentTournamentInfo.matches);
        }
        currentTournamentInfo = null;
        lastKnownDate = null; // Reset last known date when finalizing a tournament
    };

    for (const row of lines) {
        if (row.length < 2 || row.every(cell => cell === '')) continue; // Skip empty or too short lines
        if (["WINS", "LOSSES", "DRAWS", "SCORE"].some(keyword => row.join('').toUpperCase().includes(keyword))) continue; // Skip summary

        const firstCell = row[0];
        const secondCell = row[1];

        // Potential tournament header or pseudo-tournament header (like "Training match")
        if (firstCell && !parseCsvDate(firstCell) && (secondCell === '' || !parseCsvDate(secondCell))) {
            finalizeCurrentTournament(); // Finalize previous one before starting a new one

            const tournamentName = firstCell;
            const standingRaw = row[5] || row[6]; // Common columns for standing
            let finalStanding: string | number | undefined;
            if (standingRaw) {
                if (standingRaw.toLowerCase().includes("1st")) finalStanding = 1;
                else if (standingRaw.toLowerCase().includes("2nd")) finalStanding = 2;
                else if (standingRaw.toLowerCase().includes("3rd")) finalStanding = 3;
                else {
                    const num = parseInt(standingRaw.match(/\d+/)?.[0] || '', 10);
                    finalStanding = !isNaN(num) ? num : standingRaw;
                }
            }
            
            const isPseudo = /training match|summer preparation|friendly tournament/i.test(tournamentName);

            currentTournamentInfo = {
                id: `s${seasonYear.replace('/', '')}-t${tournamentIdBase++}`,
                name: tournamentName,
                finalStanding: finalStanding,
                notes: [],
                matches: [],
                isPseudoTournament: isPseudo,
            };
            if (row.slice(1,5).every(c => c === '')) { // If it looks like a simple header with just name and standing
                 const headerNote = row.filter((cell, idx) => idx > 0 && cell && !(idx === 5 && standingRaw)).join('; ');
                 if(headerNote) currentTournamentInfo.notes.push(headerNote);
            }
            continue;
        }

        // Match line processing
        let dateStr = firstCell;
        // If the date in the first cell is empty, but we are in a tournament, use the tournament's start date (if single day) or last match's date.
        if (!dateStr && currentTournamentInfo && currentTournamentInfo.matches.length > 0) {
            dateStr = currentTournamentInfo.matches[currentTournamentInfo.matches.length -1].date; // take date from previous match
        } else if (!dateStr && currentTournamentInfo && currentTournamentInfo.startDate) {
             dateStr = currentTournamentInfo.startDate; // fallback to tournament start date
        } else if (!dateStr && lastKnownDate){
            dateStr = lastKnownDate; // fallback to last known date if not in tournament context
        }


        const place = secondCell;
        const teamsStr = row[2];
        const ourScoreStr = row[3];
        const theirScoreStr = row[4];
        const resultStr = row[5];
        const note1 = row[6];
        const note2 = row[7]; // Additional notes like "Semifinal"

        if (dateStr && teamsStr && teamsStr.includes(':') && ourScoreStr && theirScoreStr && resultStr) {
            const parsedDate = parseCsvDate(dateStr);
            if (!parsedDate) {
                // console.warn("Skipping row due to invalid date:", row, "Original date string:", dateStr);
                continue;
            }
            lastKnownDate = dateStr; // Use the raw form for inheritance within the same tournament day if only time differs

            const [ourCsvTeam, opponentNameRaw] = teamsStr.split(':').map(s => s.trim());
            // If opponent name is empty, or our team is not MTE, skip
            if (!opponentNameRaw || (ourCsvTeam.toLowerCase() !== "mte" && ourCsvTeam.toLowerCase() !== ourTeamDisplayName.toLowerCase() && !teamsStr.toLowerCase().includes(ourTeamDisplayName.toLowerCase()+":") )) {
                 // Check if the format is Opponent:MTE
                if(opponentNameRaw.toLowerCase() === "mte" || opponentNameRaw.toLowerCase() === ourTeamDisplayName.toLowerCase()){
                    // This means the format was Opponent:MTE, so ourCsvTeam is the opponent
                    const tempOpponentName = ourCsvTeam;
                    // ourCsvTeam remains "MTE" implicitly
                    // opponentNameRaw becomes tempOpponentName
                    const opponentName = tempOpponentName.trim();
                    seasonOpponentNames.add(opponentName);
                    let opponentId = existingOpponentIds.get(opponentName.toLowerCase());
                    if (!opponentId) {
                        opponentId = generateTeamId(opponentName);
                        existingOpponentIds.set(opponentName.toLowerCase(), opponentId);
                    }

                    // Scores are swapped
                    const opponentScore = parseInt(ourScoreStr, 10);
                    const ourScore = parseInt(theirScoreStr, 10);
                    let result = parseCsvResult(resultStr);
                     // Result needs to be flipped
                    if (result === 1) result = 0; // Win becomes Loss
                    else if (result === 0) result = 1; // Loss becomes Win

                    if (isNaN(ourScore) || isNaN(opponentScore) || result === -1) continue;

                    let matchName = `${ourTeamDisplayName} vs ${opponentName}`;
                    let matchNotes = [note1, note2].filter(Boolean).join('; ').trim();
                    const playoffStages = ["Quarter-final", "Semi-final", "Final", "Group Stage", "Group:", "3rd Place Match", "5th Place Match", "3. Miesto"];
                    if (note1 && playoffStages.some(stage => note1.toLowerCase().startsWith(stage.toLowerCase()))) {
                        matchName = `${note1}: ${ourTeamDisplayName} vs ${opponentName}`;
                        matchNotes = note2 || ''; 
                    } else if (note2 && playoffStages.some(stage => note2.toLowerCase().startsWith(stage.toLowerCase()))) {
                        matchName = `${note2}: ${ourTeamDisplayName} vs ${opponentName}`;
                        matchNotes = note1 || ''; 
                    }
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
                        notes: matchNotes || undefined,
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
                    } else {
                        seasonMatches.push(match);
                    }
                    continue; // Continue to next row after processing swapped teams
                }
                // console.warn("Skipping row due to unrecognized team or empty opponent:", row);
                continue;
            }
            
            const opponentName = opponentNameRaw.trim();
            seasonOpponentNames.add(opponentName);
            let opponentId = existingOpponentIds.get(opponentName.toLowerCase());
            if (!opponentId) {
                opponentId = generateTeamId(opponentName);
                existingOpponentIds.set(opponentName.toLowerCase(), opponentId);
            }
            

            const ourScore = parseInt(ourScoreStr, 10);
            const opponentScore = parseInt(theirScoreStr, 10);
            const result = parseCsvResult(resultStr);

            if (isNaN(ourScore) || isNaN(opponentScore) || result === -1) continue;

            let matchName = `${ourTeamDisplayName} vs ${opponentName}`;
            let matchNotes = [note1, note2].filter(Boolean).join('; ').trim();

            const playoffStages = ["Quarter-final", "Semi-final", "Final", "Group Stage", "Group:", "3rd Place Match", "5th Place Match", "3. Miesto"];
             if (note1 && playoffStages.some(stage => note1.toLowerCase().startsWith(stage.toLowerCase()))) {
                matchName = `${note1}: ${ourTeamDisplayName} vs ${opponentName}`;
                matchNotes = note2 || ''; 
            } else if (note2 && playoffStages.some(stage => note2.toLowerCase().startsWith(stage.toLowerCase()))) {
                matchName = `${note2}: ${ourTeamDisplayName} vs ${opponentName}`;
                matchNotes = note1 || ''; 
            }


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
                notes: matchNotes || undefined,
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
            } else {
                // Match not under any specific tournament header from CSV - truly independent
                seasonMatches.push(match);
            }
        } else if (currentTournamentInfo && !row.slice(0, 5).some(c => c) && row.slice(5).some(c => c)) {
            // If first few columns are empty but there are notes in later columns, assume it's a tournament note
            const tournamentNote = row.slice(5).filter(Boolean).join('; ');
            if (tournamentNote) currentTournamentInfo.notes.push(tournamentNote);
        }
    }

    finalizeCurrentTournament(); // Finalize any remaining tournament at the end of CSV

    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: seasonOpponentNames };
}
// --- END Helper functions ---

const CSV_2023_2024 = `
,,,,,,,,
,,,,,,,WINS,42
,,,,,,,LOSSES,4
,,,,,,,DRAWS,2
,,,,,,,SCORE,282:83
,MTE,,,,,,,
,,,,,,,,
Senect CUP,,,,,,1st place,,Tournament Note: Great team effort to win the cup.
9.3.2024,Senec,MTE:Stupava,3,0,WIN,,,
9.3.2024,Senec,MTE:Domino,3,1,WIN,,,
9.3.2024,Senec,MTE:Inter Bratislava,5,1,WIN,,,
9.3.2024,Senec,MTE:FK Slovan Ivanka,2,1,WIN,,,
9.3.2024,Senec,MTE:Senec1,3,0,WIN,,,
9.3.2024,Senec,MTE:Senec2,4,2,WIN,,,
9.3.2024,Senec,MTE:Senec1,3,1,WIN,Final,, Note: This was a repeat match against Senec1 in the final. Tough game!
,,,,,,,,
DAC tournament,,,,,,1st place,,Another fantastic win for the team.
16.3.2024,DAC,MTE:DAC1,5,4,WIN,,,
16.3.2024,DAC,MTE:DAC2,9,4,WIN,,,
16.3.2024,DAC,MTE:Kecskemet,4,3,WIN,,,
16.3.2024,DAC,MTE:Fehervar,6,3,WIN,,,
,,,,,,,,
ZTE tournament,,,,,,3rd place,,Good performance, but fell short in semis.
23.3.2024,Zalaegerszeg,MTE:Gyrmot,3,2,WIN,Group Stage,,
23.3.2024,Zalaegerszeg,MTE:Zalaegerszeg (ZTE),1,2,LOSS,Group Stage,,
23.3.2024,Zalaegerszeg,MTE:Veszprem,10,1,WIN,Group Stage,, Note: Strong offensive performance.
23.3.2024,Zalaegerszeg,MTE:Another Team,2,2,DRAW,Semi-final,, Lost on penalties.
23.3.2024,Zalaegerszeg,MTE:Gyrmot,4,1,WIN,3rd Place Match,, Secured the bronze.
,,,,,,,,
Training match,,,,,,,,
27.3.2024,MITE,MTE:MITE,20,1,WIN,,, Good practice session. Focused on passing.
,,,,,,,,
MTE mini tournament,,,,,,1st,,
06.4.2024,MTE,MTE:Gyrmot,5,2,WIN,,,
06.4.2024,MTE,MTE:Tatabanya,8,1,WIN,,,
06.4.2024,MTE,MTE:Gyor ETO,6,5,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,2nd,,
13.4.2024,MTE,MTE:Csorna,12,2,WIN,,,
13.4.2024,MTE,MTE:Zalaegerszeg,4,4,DRAW,,,
13.4.2024,MTE,MTE:Karlova Ves,5,2,WIN,,,
13.4.2024,MTE,MTE:Slovan BA,1,3,LOSS,Final,, Unlucky loss in the final.
,,,,,,,,
Gyirmot mini torunament,,,,,,,,Tournament Note: Good experience against tough opponents.
20.4.2024,Gyrmot,MTE:Gyrmot,4,1,WIN,,,
20.4.2024,Gyrmot,MTE:Veszprem,7,0,WIN,,,
20.4.2024,Gyrmot,MTE:Gyor ETO,2,9,LOSS,,, Tough opponent. Showed us areas to improve.
,,,,,,,,
Parndorf mini tournament,,,,,,1st,,Solid wins across the board.
25.4.2024,Parndorf,MTE:Vieden 1,9,4,WIN,,,
25.4.2024,Parndorf,MTE:Vieden 2,10,2,WIN,,,
25.4.2024,Parndorf,MTE:Parndorf,6,1,WIN,,,
,,,,,,,,
Sombathely mini tournament,,,,,,,,
28.4.2024,Sombathely,MTE:Kiraly,3,2,WIN,,,
28.4.2024,Sombathely,MTE:Csorna,6,0,WIN,,,
28.4.2024,Sombathely,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
Turany Imre memorial,,,,,,1st place,,Great tournament win! Dedicated to Imre.
4.5.2024,MTE,MTE:Rajka,10,0,WIN,Group Stage,,
4.5.2024,MTE,MTE:Dunaszeg,5,0,WIN,Group Stage,,
4.5.2024,MTE,MTE:Nebulo,7,0,WIN,Group Stage,,
4.5.2024,MTE,MTE:Papa ELC (PELC),2,1,WIN,Semi-final,,
4.5.2024,MTE,MTE:Csorna,3,0,WIN,Final,,
,,,,,,,,
Gyor mini tournament,,,,,,,,Tournament Note: One tough loss but overall good.
12.5.2024,Gyor ETO,MTE:Gyor,0,4,LOSS,,, Opponent name correction needed for 'Goyr'. Assuming 'Gyor'. Hard match.
12.5.2024,Gyor ETO,MTE:Gyrmot,4,1,WIN,,, Corrected typo 'Gyormot' to 'Gyrmot'.
12.5.2024,Gyor ETO,MTE:Tatabanya,9,1,WIN,,,
,,,,,,,,
Vezprem mini tournament,,,,,,,,
26.5.2024,Vezprem,MTE:Veszprem,2,2,DRAW,,,
26.5.2024,Vezprem,MTE:Gyirmot,7,1,WIN,,,
26.5.2024,Vezprem,MTE:ZTE,6,3,WIN,,,
,,,,,,,,
Brno Memorial Vaclava Michny,,,,,,1st place,,Dominant performance. Proud of the team.
08.06.2024,Brno,MTE:FC Dosta Bystrc,9,0,WIN,Group Stage,,
08.06.2024,Brno,MTE:WAF Brigittenau,6,2,WIN,Group Stage,,
08.06.2024,Brno,MTE:Heidenauer,10,0,WIN,Group Stage,,
08.06.2024,Brno,MTE:FC Zbrojovka Brno,9,0,WIN,Quarter-final,,
08.06.2024,Brno,MTE:TJ Iskra Holic,10,3,WIN,Semi-final,,
08.06.2024,Brno,MTE:Banik Ostrava,9,0,WIN,Final,, Flawless victory.
,,,,,,,,
Friendly Match,,,,,,,,
15.06.2024,Home Stadium,MTE:Local Rivals,2,1,WIN,,,Good competitive game to end season prep.
`;

const CSV_2024_2025 = `
,,,,,,,,
,,,,,,,WINS,66
,,,,,,,LOSSES,21
,,,,,,,DRAWS,8
,,,,,,,SCORE,371:165
,,,,,,,,
Summer Preparation,,,,,,,,Tournament Note: Getting ready for the new season.
19.7.2024,MTE,MTE:Okos Foci,20,4,WIN,,,Focus on fitness.
7.8.2024,Gyirmot,MTE:Gyirmot,12,6,WIN,,,Tactical drills.
23.8.2024,MTE,MTE:Papa,14,2,WIN,,,Team bonding.
31.8.2024,MTE,MTE:Petrzalka,3,1,WIN,,,
31.8.2024,MTE,MTE:Gyirmot,8,4,WIN,,,
3.9.2024,MITE,MTE:MITE,14,2,WIN,,,
4.9.2024,Pandorf,MTE:Pandorf,16,1,WIN,,,
,,,,,,,,
Kellen mini tournament,,,,,,4th Place,,Mixed results, learning experience.
22.9.2024,Budapest Kelen,MTE:Meszoly,2,2,DRAW,Group Stage,,
22.9.2024,Budapest Kelen,MTE:Dunakeszi,4,4,DRAW,Group Stage,,
22.9.2024,Budapest Kelen,Kelen SC:MTE,4,2,LOSS,Group Stage,,Team was Kelen SC. Tough game. MTE is second team in this line
22.9.2024,Budapest Kelen,MTE:Budai,8,1,WIN,Group Stage,,
22.9.2024,Budapest Kelen,MTE:Budaros,2,1,WIN,Playoff for 3rd/4th,,Lost on penalties after this.
,,,,,,,,
MTE mini tournament,,,,,,,,Tournament Note: Disappointing result against ETO.
29.9.2024,MTE,MTE:Sopron,5,0,WIN,,,
29.9.2024,MTE,MTE:Csorna,5,1,WIN,,,
29.9.2024,MTE,MTE:Gyor ETO,1,11,LOSS,,, Heavy loss. Need to analyze this.
,,,,,,,,
Sopron mini tournament,,,,,,1st Place,,Good bounce back.
2.10.2024,Sopron,MTE:Gyor ETO,2,1,WIN,,,
2.10.2024,Sopron,MTE:Sopron,4,3,WIN,,,
2.10.2024,Sopron,MTE:Csorna,7,0,WIN,,,
,,,,,,,,
Gyirmot mini tournament,,,,,,2nd Place,,Strong showing.
13.10.2024,Gyirmot,MTE:Kiraly Academy,4,0,WIN,,,
13.10.2024,Gyirmot,MTE:Illes Academy,4,1,WIN,,,
13.10.2024,Gyirmot,MTE:MTK Budapest,2,0,WIN,,,
13.10.2024,Gyirmot,MTE:Gyirmot,1,3,LOSS,Final,,Close final match.
,,,,,,,,
Csorna mini tournament,,,,,,,,
20.10.2024,Csorna,MTE:Csorna,2,3,LOSS,,,
20.10.2024,Csorna,MTE:Sopron,6,1,WIN,,,
20.10.2024,Csorna,MTE:Gyor ETO,3,0,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,,, Tournament Note: Good home performance.
10.11.2024,MTE,MTE:FC Petrzalka,3,2,WIN,,,
10.11.2024,MTE,MTE:Gyorujfalu,7,1,WIN,,, Corrected typo 'Gyorulfalu'.
10.11.2024,MTE,MTE:Inter Bratislava,9,2,WIN,,,
,,,,,,,,
Gyor mini tournament,,,,,,,,
17.11.2024,Gyor,MTE:Sopron,10,4,WIN,,, Note: Date was corrected from 2025.
17.11.2024,Gyor,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
MTE mini tournament,,,,,,,,
23.11.2024,MTE,MTE:Zalaegerszeg,6,0,WIN,,, Corrected opponent: Zalaegerszeg not Zalaegerszeg MTE
23.11.2024,MTE,MTE:Kiraly SE,5,3,WIN,,,
23.11.2024,MTE,MTE:Gyirmot,5,0,WIN,,,
,,,,,,,,
DAC mini tournament,,,,,,,,
30.11.2024,DAC Mol Academy,MTE:FC Nitra,5,2,WIN,,,
30.11.2024,DAC Mol Academy,MTE:DAC,7,3,WIN,,,
,,,,,,,,
Fonix Kupa Szekesfehervar,,,,,,2nd place,,Tournament Note: Overall good performance, reached final. Showed great fighting spirit.
07.12.2024,Szekesfehervar,MTE:Sekszar,5,1,WIN,Group Stage,,
07.12.2024,Szekesfehervar,MTE:Jaszfenyszaru,4,0,WIN,Group Stage,,
07.12.2024,Szekesfehervar,MTE:Siofok,3,1,WIN,Group Stage,,
07.12.2024,Szekesfehervar,MTE:Meszoly,0,1,LOSS,Group Stage,,Unlucky goal conceded.
07.12.2024,Szekesfehervar,MTE:Kecskemet,0,2,LOSS,Group Stage,,
07.12.2024,Szekesfehervar,MTE:Ikarusz,5,2,WIN,Group Stage,,
,,,,,,2nd place in the group. Advance to Semi final,,
07.12.2024,Szekesfehervar,MTE:Fonix,3,0,WIN,Semifinal,,Great semi-final win.
07.12.2024,Szekesfehervar,MTE:Kecskemet,1,2,LOSS,Final,,Heartbreaking loss in the final.
,,,,,,,,
Tigris Kupa,,,,,,1st place,,Tournament Note: Won the cup! Excellent defending.
25.01.2025,Repcelak,MTE:ZTE,0,1,LOSS,Group Stage,, Note: Rep is Repcelak. Early setback.
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,Group Stage,,
25.01.2025,Repcelak,MTE:Gyirmot,1,0,WIN,Group Stage,, Typo: gyirmot.
25.01.2025,Repcelak,MTE:Kiraly,2,1,WIN,Semi-final,penalty shootout,Nail-biting win.
25.01.2025,Repcelak,MTE:Sopron,1,0,WIN,Final,,Champions!
,,,,,,,,
Petrzalka - training match,,,,,,,,
26.01.2025,Petrzalka,MTE:Petrzalka,3,7,LOSS,"Not sure about the score, was not there. Guys were very tired after tournament day before",,Fatigue showed.
,,,,,,,,
Tatabanya mini tournament,,,,,,2nd place,,Good effort.
02.02.2025,Tatabanya,MTE:Tatabanya,2,1,WIN,,,
02.02.2025,Tatabanya,MTE:Kiraly SC,6,0,WIN,,,
02.02.2025,Tatabanya,MTE:Komarno KFC,1,1,DRAW,,,
02.02.2025,Tatabanya,MTE:Kelen SC,0,3,LOSS,Final,,Lost to a strong Kelen team.
,,,,,,,,
MTE friendly tournament,,,,,,,,Tournament Note: Useful friendlies.
12.02.2025,MTE,MTE:Inter Bratislava,8,2,WIN,,,Good attacking display.
15.02.2025,MTE,MTE:Kiraly,7,3,WIN,,,Solid performance.
,,,,,,,,
Gyorujfalu tournament,,,,,,3rd Place,,
22.02.2025,Gyorujfalu,MTE:Velky Meder,0,0,DRAW,Group Stage,,
22.02.2025,Gyorujfalu,MTE:SC Sopron,1,3,LOSS,Group Stage,,
22.02.2025,Gyorujfalu,MTE:Sarvar,3,0,WIN,Group Stage,,
22.02.2025,Gyorujfalu,MTE:Gyorujfalu,0,1,LOSS,Semi-final,,Close game.
22.02.2025,Gyorujfalu,MTE:Velky Meder,3,1,WIN,3rd Place Match,,Finished strong.
,,,,,,,,
MTE mini tournament,,,,,,,,
01.03.2025,MTE,MTE:Csorna,7,2,WIN,,,
01.03.2025,MTE,MTE:Parndorf,2,5,LOSS,,,Unexpected loss.
,,,,,,,,
Gyirmot U11 tournament,,,,,,6th out of 13,,Tournament Note: Played against U11 teams. Finished 6th out of 13. Valuable experience.
15.03.2025,Gyirmot,MTE:Gyorujfalu U11,3,0,WIN,,,
15.03.2025,Gyirmot,MTE:Tatai AC U11,1,0,WIN,,,
15.03.2025,Gyirmot,MTE:Gyirmot U11,0,2,LOSS,,,
15.03.2025,Gyirmot,MTE:Csorna U11,0,4,LOSS,,,
15.03.2025,Gyirmot,MTE:Gyorujbarat U11,4,2,WIN,,,
15.03.2025,Gyirmot,MTE:Utanpotlasert U11,3,0,WIN,,,
15.03.2025,Gyirmot,MTE:Lebeny U11,0,1,LOSS,Playoff Match,Po penaltach,Nakoniec 6/13 - ale U11 turnaj
,,,,,,,,
MTE tournament,,,,,,,,
23.03.2025,MTE,MTE:Csorna,1,0,WIN,,,
23.03.2025,MTE,MTE:Gyor ETO,0,1,LOSS,,,
23.03.2025,MTE,MTE:Sopron,4,3,WIN,,,
,,,,,,,,
Turnaj Tatabanya,,,,,,1st Place,, Event name might be Turnaj Tatabanya, played at MTE? Place MTE from CSV. Great win!
29.03.2025,MTE,MTE:Kiraly,3,1,WIN,Group Stage,,
29.03.2025,MTE,MTE:Felcsut,0,0,DRAW,Group Stage,, Corrected typo 'Felcsot'.
29.03.2025,MTE,MTE:Tatabanya,5,3,WIN,Semi-final,,
29.03.2025,MTE,MTE:Budafok,4,0,WIN,Final,,
,,,,,,,,
Sopron mini tournament,,,,,,,, Place is MTE from CSV for this Sopron mini tournament.
06.04.2025,MTE,MTE:Sopron,4,5,LOSS,,,
06.04.2025,MTE,MTE:Gyor ETO,3,1,WIN,,,
,,,,,,,,
Kellen tournament,,,,,,,, Place is MTE from CSV. Tournament Note: Good set of games.
13.04.2025,MTE,MTE:Vasas,0,0,DRAW,,,
13.04.2025,MTE,MTE:Budai,3,1,WIN,,,
13.04.2025,MTE,MTE:Kisvarda,2,0,WIN,,,
13.04.2025,MTE,MTE:Kelen,0,3,LOSS,,, Note: Assuming Kelen SC.
,,,,,,,,
Gyor ETO mini tournament,,,,,,,,
26.04.2025,Gyor,MTE:Sopron,5,3,WIN,,,
26.04.2025,Gyor,MTE:Csorna,5,2,WIN,,,
26.04.2025,Gyor,MTE:Gyor ETO,2,9,LOSS,,,
,,,,,,,,
MTE Turany Imre memorial,,,,,,1st place,, Great performance. Defended the title.
03.05.2025,MTE,MTE:Mosonszentmiklos,5,1,WIN,Group Stage,,
03.05.2025,MTE,MTE:DAC UP FC,4,0,WIN,Group Stage,,
03.05.2025,MTE,MTE:Gyorszentivan,8,0,WIN,Group Stage,,
03.05.2025,MTE,MTE:Csorna,1,1,DRAW,Quarter-final,, Advanced on penalties.
03.05.2025,MTE,MTE:PELC,3,1,WIN,Semi-final,,
03.05.2025,MTE,MTE:Senec,7,0,WIN,Final,,
`;


export const MOCK_SEASONS = ["2023/2024", "2024/2025"];
export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {};
export const MOCK_TOURNAMENTS: Record<string, Tournament> = {};
export const MOCK_TEAMS: Team[] = [{ id: OUR_TEAM_ID, name: OUR_TEAM_NAME }];

const allOpponentNames = new Set<string>();
const opponentNameToIdMap = new Map<string, string>();

// Process 2023/2024 Season
const data2324 = processSeasonCsv(CSV_2023_2024, "2023/2024", OUR_TEAM_ID, OUR_TEAM_NAME, opponentNameToIdMap);
MOCK_MATCHES_BY_SEASON["2023/2024"] = data2324.matches;
data2324.tournaments.forEach(t => MOCK_TOURNAMENTS[t.id] = t);
data2324.opponentTeamNames.forEach(name => allOpponentNames.add(name));

// Process 2024/2025 Season
const data2425 = processSeasonCsv(CSV_2024_2025, "2024/2025", OUR_TEAM_ID, OUR_TEAM_NAME, opponentNameToIdMap);
MOCK_MATCHES_BY_SEASON["2024/2025"] = data2425.matches;
data2425.tournaments.forEach(t => MOCK_TOURNAMENTS[t.id] = t);
data2425.opponentTeamNames.forEach(name => allOpponentNames.add(name));


// Populate MOCK_TEAMS from all unique opponent names collected
allOpponentNames.forEach(name => {
    const teamId = opponentNameToIdMap.get(name.toLowerCase()) || generateTeamId(name);
    if (!MOCK_TEAMS.find(t => t.id === teamId)) {
        MOCK_TEAMS.push({ id: teamId, name: name });
    }
});

// Sort MOCK_TEAMS by name for consistency, keeping our team first
const ourTeamEntity = MOCK_TEAMS.find(t => t.id === OUR_TEAM_ID);
const otherTeams = MOCK_TEAMS.filter(t => t.id !== OUR_TEAM_ID).sort((a, b) => a.name.localeCompare(b.name));
if (ourTeamEntity) {
    MOCK_TEAMS.length = 0; // Clear array while keeping reference
    MOCK_TEAMS.push(ourTeamEntity, ...otherTeams);
}


// Data verification (Optional, for debugging)
// console.log("MOCK_TEAMS:", JSON.stringify(MOCK_TEAMS, null, 2));
// console.log("MOCK_TOURNAMENTS:", JSON.stringify(MOCK_TOURNAMENTS, null, 2));
// console.log("MOCK_MATCHES_BY_SEASON['2023/2024'] length:", MOCK_MATCHES_BY_SEASON["2023/2024"]?.length);
// console.log("MOCK_MATCHES_BY_SEASON['2024/2025'] length:", MOCK_MATCHES_BY_SEASON["2024/2025"]?.length);

// Example verification for a specific tournament's matches:
// const exampleTournamentId = Object.keys(MOCK_TOURNAMENTS)[0];
// if (exampleTournamentId) {
//   console.log(`Matches for tournament ${exampleTournamentId} (${MOCK_TOURNAMENTS[exampleTournamentId]?.name}):`,
//     Object.values(MOCK_MATCHES_BY_SEASON).flat().filter(m => m.tournamentId === exampleTournamentId)
//   );
// }
// Example: Find tournament by name
// const targetTournamentName = "Fonix Kupa Szekesfehervar";
// const foundTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === targetTournamentName);
// if (foundTournament) {
//     console.log(`Found Tournament: ${foundTournament.name} (ID: ${foundTournament.id})`);
//     const tournamentMatches = Object.values(MOCK_MATCHES_BY_SEASON).flat().filter(m => m.tournamentId === foundTournament.id);
//     console.log("Matches for this tournament:", tournamentMatches.map(m => ({name: m.name, date: m.date, score: m.score, notes: m.notes})));
// } else {
//     console.log(`Tournament "${targetTournamentName}" not found.`);
// }

// Check for matches with "MTE" in the opponent name (should not happen if parsing is correct)
// const mteAsOpponent = MOCK_TEAMS.filter(team => team.name.toUpperCase().includes("MTE") && team.id !== OUR_TEAM_ID);
// if(mteAsOpponent.length > 0) {
//     console.warn("Teams found with MTE in name that are not the primary OUR_TEAM_ID:", mteAsOpponent);
// }
// Object.values(MOCK_MATCHES_BY_SEASON).flat().forEach(match => {
//     const opponent = MOCK_TEAMS.find(t => t.id === match.opponentTeamId);
//     if (opponent && opponent.name.toUpperCase().includes("MTE")) {
//         console.warn("Match found where opponent name includes MTE:", match, "Opponent:", opponent);
//     }
// });
// console.log("Final list of MOCK_TEAMS:", MOCK_TEAMS.map(t => t.name));
// console.log("Final MOCK_TOURNAMENTS:", MOCK_TOURNAMENTS);
// console.log("Final MOCK_MATCHES_BY_SEASON['2024/2025']:", MOCK_MATCHES_BY_SEASON['2024/2025'].filter(m => m.tournamentId === 's202425-t8').map(m=> ({name: m.name, date: m.date, score:m.score})));
// console.log("Kellen SC team:", MOCK_TEAMS.find(t => t.name.toLowerCase().includes("kelen sc")));
// const kellenTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Kellen mini tournament" && t.season === "2024/2025");
// if (kellenTournament) {
//   console.log("Kellen Mini Tournament Matches (2024/2025):", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === kellenTournament.id).map(m => `${m.name} ${m.score}`));
// }
// const fonixKupa = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Fonix Kupa Szekesfehervar");
// if (fonixKupa) {
//     console.log("Fonix Kupa Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === fonixKupa.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const senecCup = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Senect CUP");
// if (senecCup) {
//      console.log("Senec CUP Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === senecCup.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const zteTournament = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "ZTE tournament");
// if (zteTournament) {
//      console.log("ZTE Tournament Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === zteTournament.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const turanyImreMemorial2324 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turany Imre memorial" && t.season === "2023/2024");
// if (turanyImreMemorial2324) {
//      console.log("Turany Imre Memorial 23/24 Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === turanyImreMemorial2324.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const brnoMemorial = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Brno Memorial Vaclava Michny");
// if (brnoMemorial) {
//      console.log("Brno Memorial Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === brnoMemorial.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const tatabanya2ndPlace = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Tatabanya mini tournament" && t.season === "2024/2025" && t.finalStanding === "2nd place");
// if (tatabanya2ndPlace) {
//      console.log("Tatabanya mini tournament (2nd place) Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tatabanya2ndPlace.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const gyorujfalu3rdPlace = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyorujfalu tournament" && t.season === "2024/2025");
// if (gyorujfalu3rdPlace) {
//      console.log("Gyorujfalu tournament (3rd Place) Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyorujfalu3rdPlace.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const gyirmotU11 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyirmot U11 tournament");
// if (gyirmotU11) {
//      console.log("Gyirmot U11 tournament Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyirmotU11.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const turnajTatabanya1st = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turnaj Tatabanya" && t.season === "2024/2025");
// if (turnajTatabanya1st) {
//      console.log("Turnaj Tatabanya (1st Place) Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === turnajTatabanya1st.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const mteTuranyImreMemorial2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "MTE Turany Imre memorial" && t.season === "2024/2025");
// if (mteTuranyImreMemorial2425) {
//      console.log("MTE Turany Imre memorial (24/25) Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === mteTuranyImreMemorial2425.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
