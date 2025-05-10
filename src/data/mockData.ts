
import type { Match, Tournament, Team } from '@/types/soccer';

const OUR_TEAM_ID = "eagles";
const OUR_TEAM_NAME = "MTE Eagles";

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
    ourTeamName: string,
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
        lastKnownDate = null;
    };

    for (const row of lines) {
        if (row.length < 2 || row.every(cell => cell === '')) continue; // Skip empty or too short lines
        if (["WINS", "LOSSES", "DRAWS", "SCORE"].some(keyword => row.join('').includes(keyword))) continue; // Skip summary

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
        const dateStr = firstCell || lastKnownDate;
        const place = secondCell;
        const teamsStr = row[2];
        const ourScoreStr = row[3];
        const theirScoreStr = row[4];
        const resultStr = row[5];
        const note1 = row[6];
        const note2 = row[7]; // Additional notes like "Semifinal"

        if (dateStr && teamsStr && teamsStr.includes(':') && ourScoreStr && theirScoreStr && resultStr) {
            const parsedDate = parseCsvDate(dateStr);
            if (!parsedDate) continue;
            lastKnownDate = dateStr; // Use the raw form for inheritance within the same tournament day if only time differs

            const [ourCsvTeam, opponentNameRaw] = teamsStr.split(':').map(s => s.trim());
            // If opponent name is empty, or our team is not MTE, skip
            if (!opponentNameRaw || ourCsvTeam.toLowerCase() !== "mte") continue;
            
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

            let matchName = `${ourTeamName} vs ${opponentName}`;
            let matchNotes = [note1, note2].filter(Boolean).join('; ').trim();

            const playoffStages = ["Quarter-final", "Semi-final", "Final", "Group Stage", "Group:", "3rd Place Match", "5th Place Match", "3. Miesto"];
             if (note1 && playoffStages.some(stage => note1.toLowerCase().startsWith(stage.toLowerCase()))) {
                matchName = `${note1}: ${ourTeamName} vs ${opponentName}`;
                matchNotes = note2 || ''; // Use second note if first was stage
            } else if (note2 && playoffStages.some(stage => note2.toLowerCase().startsWith(stage.toLowerCase()))) {
                matchName = `${note2}: ${ourTeamName} vs ${opponentName}`;
                matchNotes = note1 || ''; // Use first note if second was stage
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
                if (!currentTournamentInfo.place) currentTournamentInfo.place = place;
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
Senect CUP,,,,,,1st place,,
9.3.2024,Senec,MTE:Stupava,3,0,WIN,,,
9.3.2024,Senec,MTE:Domino,3,1,WIN,,,
9.3.2024,Senec,MTE:Inter Bratislava,5,1,WIN,,,
9.3.2024,Senec,MTE:FK Slovan Ivanka,2,1,WIN,,,
9.3.2024,Senec,MTE:Senec1,3,0,WIN,,,
9.3.2024,Senec,MTE:Senec2,4,2,WIN,,,
9.3.2024,Senec,MTE:Senec1,3,1,WIN,Final,, Note: This was a repeat match against Senec1 in the final.
,,,,,,,,
DAC tournament,,,,,,1st place,,
16.3.2024,DAC,MTE:DAC1,5,4,WIN,,,
16.3.2024,DAC,MTE:DAC2,9,4,WIN,,,
16.3.2024,DAC,MTE:Kecskemet,4,3,WIN,,,
16.3.2024,DAC,MTE:Fehervar,6,3,WIN,,,
,,,,,,,,
ZTE tournament,,,,,,,,
23.3.2024,Zalaegerszeg,MTE:Gyrmot,3,2,WIN,,,
23.3.2024,Zalaegerszeg,MTE:Zalaegerszeg (ZTE),1,2,LOSS,,,
23.3.2024,Zalaegerszeg,MTE:Veszprem,10,1,WIN,,, Note: Strong offensive performance.
,,,,,,,,
Training match,,,,,,,,
27.3.2024,MITE,MTE:MITE,20,1,WIN,,, Good practice session.
,,,,,,,,
MTE mini tournament,,,,,,,,
06.4.2024,MTE,MTE:Gyrmot,5,2,WIN,,,
06.4.2024,MTE,MTE:Tatabanya,8,1,WIN,,,
06.4.2024,MTE,MTE:Gyor ETO,6,5,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,,,
13.4.2024,MTE,MTE:Csorna,12,2,WIN,,,
13.4.2024,MTE,MTE:Zalaegerszeg,4,4,DRAW,,,
13.4.2024,MTE,MTE:Karlova Ves,5,2,WIN,,,
,,,,,,,,
Gyirmot mini torunament,,,,,,,,
20.4.2024,Gyrmot,MTE:Gyrmot,4,1,WIN,,,
20.4.2024,Gyrmot,MTE:Veszprem,7,0,WIN,,,
20.4.2024,Gyrmot,MTE:Gyor ETO,2,9,LOSS,,, Tough opponent.
,,,,,,,,
Parndorf mini tournament,,,,,,,,
25.4.2024,Parndorf,MTE:Vieden 1,9,4,WIN,,,
25.4.2024,Parndorf,MTE:Vieden 2,10,2,WIN,,,
25.4.2024,Parndorf,MTE:Parndorf,6,1,WIN,,,
,,,,,,,,
Sombathely mini tournament,,,,,,,,
28.4.2024,Sombathely,MTE:Kiraly,3,2,WIN,,,
28.4.2024,Sombathely,MTE:Csorna,6,0,WIN,,,
28.4.2024,Sombathely,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
Turany Imre memorial,,,,,,1st place,,
4.5.2024,MTE,MTE:Rajka,10,0,WIN,,,
4.5.2024,MTE,MTE:Dunaszeg,5,0,WIN,,,
4.5.2024,MTE,MTE:Nebulo,7,0,WIN,,,
4.5.2024,MTE,MTE:Papa ELC (PELC),2,1,WIN,,,
4.5.2024,MTE,MTE:Csorna,3,0,WIN,,,
4.5.2024,MTE,MTE:Pala ELC (PELC),4,0,WIN,Final,, Great tournament win!
,,,,,,,,
Gyor mini tournament,,,,,,,,
12.5.2024,Gyor ETO,MTE:Gyor,0,4,LOSS,,, Note: Opponent name correction needed for 'Goyr'. Assuming 'Gyor'.
12.5.2024,Gyor ETO,MTE:Gyrmot,4,1,WIN,,, Note: Corrected typo 'Gyormot' to 'Gyrmot'.
12.5.2024,Gyor ETO,MTE:Tatabanya,9,1,WIN,,,
,,,,,,,,
Vezprem mini tournament,,,,,,,,
26.5.2024,Vezprem,MTE:Veszprem,2,2,DRAW,,,
26.5.2024,Vezprem,MTE:Gyirmot,7,1,WIN,,,
26.5.2024,Vezprem,MTE:ZTE,6,3,WIN,,,
,,,,,,,,
Brno Memorial Vaclava Michny,,,,,,1st place,,
08.06.2024,Brno,MTE:FC Dosta Bystrc,9,0,WIN,,,
08.06.2024,Brno,MTE:WAF Brigittenau,6,2,WIN,,,
08.06.2024,Brno,MTE:Heidenauer,10,0,WIN,,,
08.06.2024,Brno,MTE:FC Zbrojovka Brno,9,0,WIN,,,
08.06.2024,Brno,MTE:TJ Iskra Holic,10,3,WIN,,,
08.06.2024,Brno,MTE:Banik Ostrava,9,0,WIN,Final,, Dominant performance.
`;

const CSV_2024_2025 = `
,,,,,,,,
,,,,,,,WINS,66
,,,,,,,LOSSES,21
,,,,,,,DRAWS,8
,,,,,,,SCORE,371:165
,,,,,,,,
Summer Preparation,Place,Teams,Our,Theirs,,,,
19.7.2024,MTE,MTE:Okos Foci,20,4,WIN,,,
7.8.2024,Gyirmot,MTE:Gyirmot,12,6,WIN,,,
23.8.2024,MTE,MTE:Papa,14,2,WIN,,,
31.8.2024,MTE,MTE:Petrzalka,3,1,WIN,,,
31.8.2024,MTE,MTE:Gyirmot,8,4,WIN,,,
3.9.2024,MITE,MTE:MITE,14,2,WIN,,,
4.9.2024,Pandorf,MTE:Pandorf,16,1,WIN,,,
,,,,,,,,
Kellen mini tournament,,,,,,,,
22.9.2024,Budapest Kelen,MTE:Meszoly,2,2,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Dunakeszi,4,4,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Kelen SC,2,4,LOSS,,, Team was Kelen SC.
22.9.2024,Budapest Kelen,MTE:Budai,8,1,WIN,,,
22.9.2024,Budapest Kelen,MTE:Budaros,2,1,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,,,
29.9.2024,MTE,MTE:Sopron,5,0,WIN,,,
29.9.2024,MTE,MTE:Csorna,5,1,WIN,,,
29.9.2024,MTE,MTE:Gyor ETO,1,11,LOSS,,, Heavy loss.
,,,,,,,,
Sopron mini tournament,,,,,,,,
2.10.2024,Sopron,MTE:Gyor ETO,2,1,WIN,,,
2.10.2024,Sopron,MTE:Sopron,4,3,WIN,,,
2.10.2024,Sopron,MTE:Csorna,7,0,WIN,,,
,,,,,,,,
Gyirmot mini tournament,,,,,,,,
13.10.2024,Gyirmot,MTE:Kiraly Academy,4,0,WIN,,,
13.10.2024,Gyirmot,MTE:Illes Academy,4,1,WIN,,,
13.10.2024,Gyirmot,MTE:MTK Budapest,2,0,WIN,,,
13.10.2024,Gyirmot,MTE:Gyirmot,1,3,LOSS,,,
,,,,,,,,
Csorna mini tournament,,,,,,,,
20.10.2024,Csorna,MTE:Csorna,2,3,LOSS,,,
20.10.2024,Csorna,MTE:Sopron,6,1,WIN,,,
20.10.2024,Csorna,MTE:Gyor ETO,3,0,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,,,
10.11.2024,MTE,MTE:FC Petrzalka,3,2,WIN,,,
10.11.2024,MTE,MTE:Gyorujfalu,7,1,WIN,,, Corrected typo 'Gyorulfalu'.
10.11.2024,MTE,MTE:Inter Bratislava,9,2,WIN,,,
,,,,,,,,
Gyor mini tournament,,,,,,,,
17.11.2024,Gyor,MTE:Sopron,10,4,WIN,,, Note: Date might be 17.11.2024
17.11.2024,Gyor,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
MTE mini tournament,,,,,,,,
23.11.2024,MTE,MTE:Zalaegerszeg MTE,6,0,WIN,,, Corrected opponent: Zalaegerszeg
23.11.2024,MTE,MTE:Kiraly SE,5,3,WIN,,,
23.11.2024,MTE,MTE:Gyirmot,5,0,WIN,,,
,,,,,,,,
DAC mini tournament,,,,,,,,
30.11.2024,DAC Mol Academy,MTE:FC Nitra,5,2,WIN,,,
30.11.2024,DAC Mol Academy,MTE:DAC,7,3,WIN,,,
,,,,,,,,
Fonix Kupa Szekesfehervar,,,,,,2nd place,, Tournament Note: Overall good performance, reached final.
07.12.2024,Szekesfehervar,MTE:Sekszar,5,1,WIN,,,Group Stage
07.12.2024,Szekesfehervar,MTE:Jaszfenyszaru,4,0,WIN,,,Group Stage
07.12.2024,Szekesfehervar,MTE:Siofok,3,1,WIN,,,Group Stage
07.12.2024,Szekesfehervar,MTE:Meszoly,0,1,LOSS,,,Group Stage
07.12.2024,Szekesfehervar,MTE:Kecskemet,0,2,LOSS,,,Group Stage
07.12.2024,Szekesfehervar,MTE:Ikarusz,5,2,WIN,,,Group Stage
,,,,,,2.nd place in the group. Advance to Semi final,,
07.12.2024,Szekesfehervar,MTE:Fonix,3,0,WIN,Semifinal,,
07.12.2024,Szekesfehervar,MTE:Kecskemet,1,2,LOSS,Final,,
,,,,,,,,
Tigris Kupa,,,,,,1st place,,
25.01.2025,Repcelak,MTE:ZTE,0,1,LOSS,,, Note: Rep is Repcelak
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,,,
25.01.2025,Repcelak,MTE:Gyirmot,1,0,WIN,,, Typo: gyirmot
25.01.2025,Repcelak,MTE:Kiraly,2,1,WIN,penalty shootout,,
25.01.2025,Repcelak,MTE:Sopron,1,0,WIN,Final,,
,,,,,,,,
Petrzalka - training match,,,,,,,,
26.01.2025,Petrzalka,MTE:Petrzalka,3,7,LOSS,"Not sure about the score, was not there. Guys were very tired after tournament day before",,
,,,,,,,,
Tatabanya mini tournament,,,,,,2nd place,,
02.02.2025,Tatabanya,MTE:Tatabanya,2,1,WIN,,,
02.02.2025,Tatabanya,MTE:Kiraly SC,6,0,WIN,,,
02.02.2025,Tatabanya,MTE:Komarno KFC,1,1,DRAW,,,
02.02.2025,Tatabanya,MTE:Kelen SC,0,3,LOSS,,,
,,,,,,,,
MTE friendly tournament,,,,,,,,
12.02.2025,MTE,MTE:Inter Bratislava,8,2,WIN,,,
15.02.2025,MTE,MTE:Kiraly,7,3,WIN,,,
,,,,,,,,
Gyorujfalu tournament,,,,,,,,
22.02.2025,Gyorujfalu,MTE:Velky Meder,0,0,DRAW,,,
22.02.2025,Gyorujfalu,MTE:SC Sopron,1,3,LOSS,,,
22.02.2025,Gyorujfalu,MTE:Sarvar,3,0,WIN,,,
22.02.2025,Gyorujfalu,MTE:Gyorujfalu,0,1,LOSS,,,
22.02.2025,Gyorujfalu,MTE:Velky Meder,3,1,WIN,3. Miesto,, Match for 3rd place
,,,,,,,,
MTE mini tournament,,,,,,,,
01.03.2025,MTE,MTE:Csorna,7,2,WIN,,,
01.03.2025,MTE,MTE:Parndorf,2,5,LOSS,,,
,,,,,,,,
Gyirmot U11 tournament,,,,,,,, Tournament Note: Played against U11 teams. Finished 6th out of 13.
15.03.2025,Gyirmot,MTE:Gyorujfalu U11,3,0,WIN,,,
15.03.2025,Gyirmot,MTE:Tatai AC U11,1,0,WIN,,,
15.03.2025,Gyirmot,MTE:Gyirmot U11,0,2,LOSS,,,
15.03.2025,Gyirmot,MTE:Csorna U11,0,4,LOSS,,,
15.03.2025,Gyirmot,MTE:Gyorujbarat U11,4,2,WIN,,,
15.03.2025,Gyirmot,MTE:Utanpotlasert U11,3,0,WIN,,,
15.03.2025,Gyirmot,MTE:Lebeny U11,0,1,LOSS,Po penaltach,Nakoniec 6/13 - ale U11 turnaj
,,,,,,,,
MTE tournament,,,,,,,,
23.03.2025,MTE,MTE:Csorna,1,0,WIN,,,
23.03.2025,MTE,MTE:Gyor ETO,0,1,LOSS,,,
23.03.2025,MTE,MTE:Sopron,4,3,WIN,,,
,,,,,,,,
Turnaj Tatabanya,,,,,,,,
29.03.2025,MTE,MTE:Kiraly,3,1,WIN,,, Event name might be Turnaj Tatabanya, played at MTE? Place MTE from CSV.
29.03.2025,MTE,MTE:Felcsut,0,0,DRAW,,, Corrected typo 'Felcsot'.
29.03.2025,MTE,MTE:Tatabanya,5,3,WIN,,,
29.03.2025,MTE,MTE:Budafok,4,0,WIN,,,
29.03.2025,MTE,MTE:Paks,4,0,WIN,,,
,,,,,,,,
Sopron mini tournament,,,,,,,,
06.04.2025,MTE,MTE:Sopron,4,5,LOSS,,, Place is MTE from CSV for this Sopron mini tournament.
06.04.2025,MTE,MTE:Gyor ETO,3,1,WIN,,,
,,,,,,,,
Kellen tournament,,,,,,,,
13.04.2025,MTE,MTE:Vasas,0,0,DRAW,,, Place is MTE from CSV.
13.04.2025,MTE,MTE:Budai,3,1,WIN,,,
13.04.2025,MTE,MTE:Kisvarda,2,0,WIN,,,
13.04.2025,MTE,MTE:Kelen,0,3,LOSS,,, Note: Assuming Kelen SC.
,,,,,,,,
Gyor ETO mini tournament,,,,,,,,
26.04.2025,Gyor,MTE:Sopron,5,3,WIN,,,
26.04.2025,Gyor,MTE:Csorna,5,2,WIN,,,
26.04.2025,Gyor,MTE:Gyor ETO,2,9,LOSS,,,
,,,,,,,,
MTE Turany Imre memorial,,,,,,1st place,,
03.05.2025,MTE,MTE:Mosonszentmiklos,5,1,WIN,,,
03.05.2025,MTE,MTE:DAC UP FC,4,0,WIN,,,
03.05.2025,MTE,MTE:Gyorszentivan,8,0,WIN,,,
03.05.2025,MTE,MTE:Csorna,1,1,DRAW,,,
03.05.2025,MTE,MTE:PELC,3,1,WIN,,,
03.05.2025,MTE,MTE:Senec,7,0,WIN,,,
03.05.2025,MTE,MTE:Kiraly,2,1,WIN,,,
03.05.2025,MTE,MTE:Gyirmot,1,1,DRAW,Final,, Great performance.
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
// Correcting date for one match as per CSV "17.11.2025" which is likely a typo for 2024
const corrected_CSV_2024_2025 = CSV_2024_2025.replace(/17\.11\.2025/g, "17.11.2024");
const data2425 = processSeasonCsv(corrected_CSV_2024_2025, "2024/2025", OUR_TEAM_ID, OUR_TEAM_NAME, opponentNameToIdMap);
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

// Sort MOCK_TEAMS by name for consistency, keeping MTE Eagles first
const mteEaglesTeam = MOCK_TEAMS.find(t => t.id === OUR_TEAM_ID);
const otherTeams = MOCK_TEAMS.filter(t => t.id !== OUR_TEAM_ID).sort((a, b) => a.name.localeCompare(b.name));
if (mteEaglesTeam) {
    MOCK_TEAMS.length = 0; // Clear array while keeping reference
    MOCK_TEAMS.push(mteEaglesTeam, ...otherTeams);
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
