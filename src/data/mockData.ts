
import type { Match, Tournament, Team } from '@/types/soccer';

const OUR_TEAM_ID = "mte";
const OUR_TEAM_NAME = "MTE"; // Corrected team name

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
    if (/gy[ioöő]rmot/i.test(normalized)) normalized = "Gyirmot";
    else if (/gy[oöő]r eto/i.test(normalized) || normalized.toLowerCase() === "gyor" || normalized.toLowerCase() === "goyr") normalized = "Gyor ETO";
    else if (/papa elc \(pelc\)|pala elc|pelc/i.test(normalized)) normalized = "Papa ELC (PELC)";
    else if (/kelen sc|kellen/i.test(normalized)) normalized = "Kelen SC";
    else if (/pandorf/i.test(normalized)) normalized = "Parndorf";
    else if (/felcs[oöő]t/i.test(normalized)) normalized = "Felcsut";
    else if (/zalaegerszeg \(zte\)|zte/i.test(normalized)) normalized = "Zalaegerszeg (ZTE)";
    else if (normalized.toLowerCase() === "zalaegerszeg mte") normalized = "Zalaegerszeg"; // If MTE is opponent, it's just Zalaegerszeg
    else if (normalized.toLowerCase() === "rep") normalized = "Repcelak"; // Contextual, assume Repcelak if seen in tournament
    else if (normalized.toLowerCase() === "fk slovan ivanka") normalized = "FK Slovan Ivanka";

    // General cleanup
    normalized = normalized.replace(/\(zte\)/i, '(ZTE)').trim(); // Standardize (ZTE)
    return normalized;
}


function generateTeamId(name: string): string {
    return normalizeTeamName(name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

interface ProcessedSeasonOutput {
    matches: Match[];
    tournaments: Record<string, Tournament>; // Changed to Record for easier lookup by ID
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
                // Sort matches by date before assigning start/end date from them
                currentTournamentInfo.matches.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const tournament: Tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate || currentTournamentInfo.matches[0].date,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.matches[currentTournamentInfo.matches.length - 1].date,
                    place: currentTournamentInfo.place || currentTournamentInfo.matches[0]?.place || 'Unknown',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : undefined,
                };
                seasonTournaments[tournament.id] = tournament;
                seasonMatches.push(...currentTournamentInfo.matches);
            } else if (currentTournamentInfo.name && currentTournamentInfo.startDate) { // Tournament with no matches but details
                 const tournament: Tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.startDate,
                    place: currentTournamentInfo.place || 'Unknown',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : `Awaiting match details for ${currentTournamentInfo.name}.`,
                };
                seasonTournaments[tournament.id] = tournament;
            }
        }
        currentTournamentInfo = null;
        lastKnownDateForTournamentMatches = null;
    };

    for (const row of lines) {
        if (row.every(cell => cell === '')) continue; // Skip empty lines

        const firstCell = row[0];
        const potentialFinalStanding = row[6];
        const potentialTournamentNote = row[7];

        // Identify tournament header: Name in col 0, "place" or "no place" in col 6
        if (firstCell && !parseCsvDate(firstCell) && (potentialFinalStanding?.toLowerCase().includes("place") || potentialFinalStanding?.toLowerCase() === "no place")) {
            finalizeCurrentTournament();

            let finalStanding: string | number | undefined = undefined;
            if (potentialFinalStanding && potentialFinalStanding.toLowerCase() !== "no place") {
                 if (potentialFinalStanding.toLowerCase().includes("1st")) finalStanding = 1;
                 else if (potentialFinalStanding.toLowerCase().includes("2nd")) finalStanding = 2;
                 else if (potentialFinalStanding.toLowerCase().includes("3rd")) finalStanding = 3;
                 else {
                    const num = parseInt(potentialFinalStanding.match(/\d+/)?.[0] || '', 10);
                    finalStanding = !isNaN(num) ? num : potentialFinalStanding;
                 }
            }

            currentTournamentInfo = {
                id: `s${seasonYear.replace('/', '')}-t${tournamentIdCounter++}`,
                name: firstCell,
                finalStanding: finalStanding,
                notes: potentialTournamentNote ? [potentialTournamentNote] : [],
                matches: [],
                // Placeholder dates/place, will be updated by first match or if explicitly set
                startDate: undefined, 
                endDate: undefined,
                place: row[1] || undefined, // Tournament place can be in col 1
            };
            // Try to get date from first match if it's on the same line or next one for single day tournaments
            if(parseCsvDate(row[1])) { // If date is in col 1 for tournament header
                currentTournamentInfo.startDate = parseCsvDate(row[1]);
                currentTournamentInfo.place = row[2] || 'Unknown'; // Place might shift
            }
            continue;
        }
        
        // Tournament specific notes on their own lines
        if (firstCell === '' && row.slice(1,6).every(c => c === '') && (row[6] || row[7])) {
            if (currentTournamentInfo) {
                const note = [row[6], row[7]].filter(Boolean).join('; ');
                if (note) currentTournamentInfo.notes.push(note);
            }
            continue;
        }

        // Match line processing
        let dateStr = firstCell;
        if (!dateStr && currentTournamentInfo && lastKnownDateForTournamentMatches) {
            dateStr = lastKnownDateForTournamentMatches; // Inherit date for multi-match tournament entries on same day
        }

        const parsedDate = parseCsvDate(dateStr);
        if (!parsedDate) continue; // Skip if no valid date

        lastKnownDateForTournamentMatches = dateStr; // Update last known date for current tournament context

        const place = row[1];
        const teamsStr = row[2];
        const ourScoreStr = row[3];
        const theirScoreStr = row[4];
        const resultStr = row[5];
        const playoffStageOrNote = row[6];
        const matchNoteExtra = row[7];

        if (teamsStr && teamsStr.includes(':') && ourScoreStr && theirScoreStr && resultStr) {
            const [ourCsvTeamRaw, opponentNameRawInitial] = teamsStr.split(':').map(s => s.trim());
            
            let ourTeamNameForMatch = ourTeamDisplayName;
            let opponentNameForMatch = opponentNameRawInitial;
            let ourScore = parseInt(ourScoreStr, 10);
            let opponentScore = parseInt(theirScoreStr, 10);
            let result = parseCsvResult(resultStr);

            // Handle Opponent:MTE case
            const normalizedOurCsvTeam = normalizeTeamName(ourCsvTeamRaw);
            const normalizedOpponentNameRaw = normalizeTeamName(opponentNameRawInitial);

            if (normalizedOpponentNameRaw.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedOpponentNameRaw.toLowerCase() === "mte") {
                 // This means the format was Opponent:MTE, so ourCsvTeamRaw is the opponent
                opponentNameForMatch = normalizedOurCsvTeam; // ourCsvTeamRaw was the opponent
                // ourTeamNameForMatch remains ourTeamDisplayName
                
                // Scores are swapped
                const tempScore = ourScore;
                ourScore = opponentScore;
                opponentScore = tempScore;
                
                // Result needs to be flipped
                if (result === 1) result = 0; // Win becomes Loss
                else if (result === 0) result = 1; // Loss becomes Win
            } else if (normalizedOurCsvTeam.toLowerCase() !== ourTeamDisplayName.toLowerCase() && normalizedOurCsvTeam.toLowerCase() !== "mte") {
                // Neither part of teamStr seems to be our team, skip
                // console.warn(`Skipping match, our team ${ourTeamDisplayName} not found in teams string: ${teamsStr}`, row);
                continue;
            } else {
                 opponentNameForMatch = normalizedOpponentNameRaw;
            }
            
            if (!opponentNameForMatch) {
                // console.warn("Skipping row due to empty opponent name:", row);
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
                // console.warn("Skipping row due to invalid score or result:", row);
                continue;
            }

            let matchNamePrefix = "";
            let combinedNotes = [];

            if (playoffStageOrNote) {
                const stageLower = playoffStageOrNote.toLowerCase();
                if (stageLower.includes("group") || stageLower.includes("final") || stageLower.includes("semi") || stageLower.includes("quarter") || stageLower.includes("3rd place") || stageLower.includes("5th place") || stageLower.includes("match for")) {
                    matchNamePrefix = `${playoffStageOrNote}: `;
                } else {
                    combinedNotes.push(playoffStageOrNote);
                }
            }
            if (matchNoteExtra) combinedNotes.push(matchNoteExtra);


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
                notes: combinedNotes.length > 0 ? combinedNotes.join('; ') : (Math.random() < 0.1 ? 'Competitive game.' : undefined), // Add random note sometimes
            };

            if (currentTournamentInfo) {
                match.tournamentId = currentTournamentInfo.id;
                currentTournamentInfo.matches.push(match);
                if (!currentTournamentInfo.place && place) currentTournamentInfo.place = place;
                
                // Update tournament start/end dates
                if (!currentTournamentInfo.startDate || new Date(parsedDate) < new Date(currentTournamentInfo.startDate)) {
                    currentTournamentInfo.startDate = parsedDate;
                }
                if (!currentTournamentInfo.endDate || new Date(parsedDate) > new Date(currentTournamentInfo.endDate)) {
                    currentTournamentInfo.endDate = parsedDate;
                }
                 // If match place is set, and tournament place isn't, set it.
                if (place && !currentTournamentInfo.place) currentTournamentInfo.place = place;

            } else {
                // Match not under any specific tournament header - treat as independent
                // Or, if it's part of "Summer Preparation" like series, group it.
                // For now, let's assume if no currentTournamentInfo, it's truly independent for simplicity with current CSV
                 seasonMatches.push(match); // This path might be hit less if headers are consistent
            }
        }
    }

    finalizeCurrentTournament();

    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: seasonOpponentNames };
}

const CSV_2023_2024 = `
Senect CUP,,,,,,1st place,Tournament Note: Great team effort to win the cup.
9.3.2024,Senec,MTE:Stupava,3,0,WIN,group,,
9.3.2024,Senec,MTE:Domino,3,1,WIN,group,,
9.3.2024,Senec,MTE:Inter Bratislava,5,1,WIN,group,,
9.3.2024,Senec,MTE: FK Slovan Ivanka,2,1,WIN,group,,
9.3.2024,Senec,MTE:Senec1,3,0,WIN,group,,
9.3.2024,Senec,MTE:Senec2,4,2,WIN,semi final,,
9.3.2024,Senec,MTE:Senec1,3,1,WIN,final,Tough game!
,,,,,,,,
DAC tournament,,,,,,1st place,Another fantastic win for the team.
16.3.2024,DAC,MTE:DAC1,5,4,WIN,group,,
16.3.2024,DAC,MTE:DAC2,9,4,WIN,group,,
16.3.2024,DAC,MTE:Kecskemet,4,3,WIN,group,,
16.3.2024,DAC,MTE:Fehervar,6,3,WIN,group,,
,,,,,,,,
ZTE tournament,,,,,,no place,Good performance, but fell short in semis for a higher rank.
23.3.2024,Zalaegerszeg,MTE:Gyrmot,3,2,WIN,,,
23.3.2024,Zalaegerszeg,MTE:Zalaegerszeg (ZTE),1,2,LOSS,,,
23.3.2024,Zalaegerszeg,MTE:Veszprem,10,1,WIN,Strong offensive performance.,
,,,,,,,,
Training match,,,,,,no place,Good practice session.
27.3.2024,MITE,MTE:MITE,20,1,WIN,Focused on passing.,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
06.4.2024,MTE,MTE:Gyrmot,5,2,WIN,,,
06.4.2024,MTE,MTE:Tatabanya,8,1,WIN,,,
06.4.2024,MTE,MTE:Gyor ETO,6,5,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,Unlucky loss in the final match of this set.
13.4.2024,MTE,MTE:Csorna,12,2,WIN,,,
13.4.2024,MTE,MTE:Zalaegerszeg,4,4,DRAW,,,
13.4.2024,MTE,MTE:Karlova Ves,5,2,WIN,,,
13.4.2024,MTE,MTE:Slovan BA,1,3,LOSS,Final,,
,,,,,,,,
Gyirmot mini torunament,,,,,,no place,Good experience against tough opponents.
20.4.2024,Gyrmot,MTE:Gyrmot,4,1,WIN,,,
20.4.2024,Gyrmot,MTE:Veszprem,7,0,WIN,,,
20.4.2024,Gyrmot,MTE:Gyor ETO,2,9,LOSS,Tough opponent. Showed us areas to improve.,
,,,,,,,,
Parndorf mini tournament,,,,,,no place,Solid wins across the board.
25.4.2024,Parndorf,MTE:Vieden 1,9,4,WIN,,,
25.4.2024,Parndorf,MTE:Vieden 2,10,2,WIN,,,
25.4.2024,Parndorf,MTE:Parndorf,6,1,WIN,,,
,,,,,,,,
Sombathely mini tournament,,,,,,no place,,
28.4.2024,Sombathely,MTE:Kiraly,3,2,WIN,,,
28.4.2024,Sombathely,MTE:Csorna,6,0,WIN,,,
28.4.2024,Sombathely,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
Turany Imre memorial,,,,,,1st place,Great tournament win! Dedicated to Imre.
4.5.2024,MTE,MTE:Rajka,10,0,WIN,group,,
4.5.2024,MTE,MTE:Dunaszeg,5,0,WIN,group,,
4.5.2024,MTE,MTE: Nebulo,7,0,WIN,group,,
4.5.2024,MTE,MTE: Papa ELC,2,1,WIN,group,, Note: PELC is Papa ELC.
4.5.2024,MTE,MTE: Csorna,3,0,WIN,semi final,,
4.5.2024,MTE,MTE: Pala ELC,4,0,WIN,final,, Note: Pala ELC is Papa ELC.
,,,,,,,,
Gyor mini tournament,,,,,,no place,One tough loss but overall good.
12.5.2024,Gyor ETO,MTE:Gyor,0,4,LOSS,Opponent name corrected (was Goyr). Hard match.,
12.5.2024,Gyor ETO,MTE:Gyormot,4,1,WIN,Corrected typo (was Gyormot).,
12.5.2024,Gyor ETO,MTE:Tatabanya,9,1,WIN,,,
,,,,,,,,
Vezprem mini tournament,,,,,,no place,,
26.5.2024,Vezprem,MTE:Veszprem,2,2,DRAW,,,
26.5.2024,Vezprem,MTE:Gyirmot,7,1,WIN,,,
26.5.2024,Vezprem,MTE:ZTE,6,3,WIN,,,
,,,,,,,,
Brno Memorial Vaclava Michny,,,,,,1st place,Dominant performance. Proud of the team.
08.06.2024,Brno,MTE:FC Dosta Bystrc,9,0,WIN,group,,
08.06.2024,Brno,MTE:WAF Brigittenau,6,2,WIN,group,,
08.06.2024,Brno,MTE:Heidenauer,10,0,WIN,group,,
08.06.2024,Brno,MTE:FC Zbrojovka Brno,9,0,WIN,group,,
08.06.2024,Brno,MTE:TJ Iskra Holic,10,3,WIN,group,,
08.06.2024,Brno,MTE:Banik Ostrava,9,0,WIN,group,Flawless victory in all group matches to secure 1st., Note: This implies all matches were part of a round-robin or group leading to 1st.
`;

const CSV_2024_2025 = `
Summer Preparation,,,,,,no place,Getting ready for the new season.
19.7.2024,MTE,MTE:Okos Foci,20,4,WIN,Focus on fitness.,
Summer Preparation,,,,,,no place,,
7.8.2024,Gyirmot,MTE:Gyirmot,12,6,WIN,Tactical drills.,
Summer Preparation,,,,,,no place,,
23.8.2024,MTE,MTE:Papa,14,2,WIN,Team bonding.,
31.8.2024,MTE,MTE: Petrzalka,3,1,WIN,,,
31.8.2024,MTE,MTE:Gyirmot,8,4,WIN,,,
Summer Preparation,,,,,,no place,,
3.9.2024,MITE,MTE:MITE,14,2,WIN,,,
Summer Preparation,,,,,,no place,,
4.9.2024,Pandorf,MTE:Pandorf,16,1,WIN,,,
,,,,,,,,
Kellen mini tournament,,,,,,no place,Mixed results, learning experience.
22.9.2024,Budapest Kelen,MTE:Meszoly,2,2,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Dunakeszi,4,4,DRAW,,,
22.9.2024,Budapest Kelen,Kelen SC:MTE,4,2,LOSS,Team was Kelen SC. Tough game. MTE is second team in this line.,
22.9.2024,Budapest Kelen,MTE:Budai,8,1,WIN,,,
22.9.2024,Budapest Kelen,MTE:Budaros,2,1,WIN,Lost on penalties after this for placement.,
,,,,,,,,
MTE mini tournament,,,,,,no place,Disappointing result against ETO.
29.9.2024,MTE,MTE:Sopron,5,0,WIN,,,
29.9.2024,MTE,MTE:Csorna,5,1,WIN,,,
29.9.2024,MTE,MTE:Gyor ETO,1,11,LOSS,Heavy loss. Need to analyze this.,
,,,,,,,,
Sopron mini tournament,,,,,,no place,Good bounce back.
2.10.2024,Sopron,MTE:Gyor ETO,2,1,WIN,,,
2.10.2024,Sopron,MTE:Sopron,4,3,WIN,,,
2.10.2024,Sopron,MTE:Csorna,7,0,WIN,,,
,,,,,,,,
Gyirmot mini tournament,,,,,,2nd place,Strong showing.
13.10.2024,Gyirmot,MTE:Kiraly Academy,4,0,WIN,group,,
13.10.2024,Gyirmot,MTE:Illes Academy,4,1,WIN,group,,
13.10.2024,Gyirmot,MTE:MTK Budapest,2,0,WIN,group,,
13.10.2024,Gyirmot,MTE:Gyirmot,1,3,LOSS,Final,Close final match.
,,,,,,,,
Csorna mini tournament,,,,,,no place,,
20.10.2024,Csorna,MTE:Csorna,2,3,LOSS,,,
20.10.2024,Csorna,MTE:Sopron,6,1,WIN,,,
20.10.2024,Csorna,MTE:Gyor ETO,3,0,WIN,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,Good home performance.
10.11.2024,MTE,MTE:FC Petrzalka,3,2,WIN,,,
10.11.2024,MTE,MTE:Gyorujfalu,7,1,WIN,Corrected typo (was Gyorulfalu).,
10.11.2024,MTE,MTE:Inter Bratislava,9,2,WIN,,,
,,,,,,,,
Gyor mini tournament,,,,,,no place,Date for first two matches was 17.11.2024 not 2025.
17.11.2024,Gyor,MTE:Sopron,10,4,WIN,,,
17.11.2024,Gyor,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor,MTE:Gyor ETO,2,4,LOSS,,,
,,,,,,,,
MTE mini tournament,,,,,,no place,,
23.11.2024,MTE,MTE:Zalaegerszeg,6,0,WIN,Corrected opponent (was Zalaegerszeg MTE).,
23.11.2024,MTE,MTE:Kiraly SE,5,3,WIN,,,
23.11.2024,MTE,MTE:Gyirmot,5,0,WIN,,,
,,,,,,,,
DAC mini tournament,,,,,,no place,,
30.11.2024,DAC Mol Academy,MTE:FC Nitra,5,2,WIN,,,
30.11.2024,DAC Mol Academy,MTE:DAC,7,3,WIN,,,
,,,,,,,,
Fonix Kupa Szekesfehervar,,,,,,2nd place,Overall good performance, reached final. Showed great fighting spirit.
07.12.2024,Szekesfehervar,MTE: Sekszar,5,1,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Jaszfenyszaru,4,0,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Siofok,3,1,WIN,group,,
07.12.2024,Szekesfehervar,MTE:Meszoly,0,1,LOSS,group,Unlucky goal conceded.
07.12.2024,Szekesfehervar,MTE:Kecskemet,0,2,LOSS,group,,
07.12.2024,Szekesfehervar,MTE:Ikarusz,5,2,WIN,group,,
,,,,,,,2nd place in the group. Advance to Semi final,
07.12.2024,Szekesfehervar,MTE:Fonix,3,0,WIN,Semifinal,Great semi-final win.
07.12.2024,Szekesfehervar,MTE:Kecskemet,1,2,LOSS,Final,Heartbreaking loss in the final.
,,,,,,,,
Tigris Kupa,,,,,,1st place,Won the cup! Excellent defending.
25.01.2025,Repcelak,MTE:ZTE,0,1,LOSS,group,Early setback. Note: Rep is Repcelak.
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,group,,
25.01.2025,Repcelak,MTE:Gyirmot,1,0,WIN,group,Typo: gyirmot.
25.01.2025,Repcelak,MTE:Kiraly,2,1,WIN,Semi-final,penalty shootout; Nail-biting win.
25.01.2025,Repcelak,MTE:Sopron,1,0,WIN,Final,Champions!
,,,,,,,,
Petrzalka - training match,,,,,,no place,Fatigue showed.
26.01.2025,Petrzalka,MTE:Petrzalka,3,7,LOSS,"Not sure about the score, was not there. Guys were very tired after tournament day before",,
,,,,,,,,
Tatabanya mini tournament,,,,,,2nd place,Good effort.
02.02.2025,Tatabanya,MTE:Tatabanya,2,1,WIN,group,,
02.02.2025,Tatabanya,MTE:Kiraly SC,6,0,WIN,group,,
02.02.2025,Tatabanya,MTE:Komarno KFC,1,1,DRAW,group,,
02.02.2025,Tatabanya,MTE:Kelen SC,0,3,LOSS,Final,Lost to a strong Kelen team.
,,,,,,,,
MTE friendly tournament,,,,,,no place,Useful friendlies.
12.02.2025,MTE,MTE:Inter Bratislava,8,2,WIN,Good attacking display.,
15.02.2025,MTE,MTE:Kiraly,7,3,WIN,Solid performance.,
,,,,,,,,
Gyorujfalu tournament,,,,,,3rd place,,
22.02.2025,Gyorujfalu,MTE:Velky Meder,0,0,DRAW,group,,
22.02.2025,Gyorujfalu,MTE:SC Sopron,1,3,LOSS,group,,
22.02.2025,Gyorujfalu,MTE:Sarvar,3,0,WIN,group,,
22.02.2025,Gyorujfalu,MTE:Gyorujfalu,0,1,LOSS,Semi-final,Close game.
22.02.2025,Gyorujfalu,MTE:Velky Meder,3,1,WIN,3rd Place Match,Finished strong.
,,,,,,,,
MTE mini tournament,,,,,,no place,,
01.03.2025,MTE,MTE:Csorna,7,2,WIN,,,
01.03.2025,MTE,MTE:Parndorf,2,5,LOSS,Unexpected loss.,
,,,,,,,,
Gyirmot U11 tournament,,,,,,6th place,Played against U11 teams. Valuable experience.
15.03.2025,Gyirmot,MTE:Gyorujfalu U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Tatai AC U11,1,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Gyirmot U11,0,2,LOSS,group,,
15.03.2025,Gyirmot,MTE:Csorna U11,0,4,LOSS,group,,
15.03.2025,Gyirmot,MTE:Gyorujbarat U11,4,2,WIN,group,,
15.03.2025,Gyirmot,MTE:Utanpotlasert U11,3,0,WIN,group,,
15.03.2025,Gyirmot,MTE:Lebeny U11,0,1,LOSS,Match for 5th place,"penalty shootout; Nakoniec 6/13 - ale U11 turnaj",
,,,,,,,,
MTE tournament,,,,,,no place,,
23.03.2025,MTE,MTE: Csorna,1,0,WIN,,,
23.03.2025,MTE,MTE:Gyor ETO,0,1,LOSS,,,
23.03.2025,MTE,MTE:Sopron,4,3,WIN,,,
,,,,,,,,
Turnaj Tatabanya,,,,,,1st place,Event name might be Turnaj Tatabanya. Played at MTE. Great win!
29.03.2025,MTE,MTE:Kiraly,3,1,WIN,group,,
29.03.2025,MTE,MTE:Felcsut,0,0,DRAW,group,Corrected typo (was Felcsot).
29.03.2025,MTE,MTE:Tatabanya,5,3,WIN,Semi-final,,
29.03.2025,MTE,MTE:Budafok,4,0,WIN,Final,,
29.03.2025,MTE,MTE:Paks,4,0,WIN,group,, Note: Added as group as per tournament structure.
,,,,,,,,
Sopron mini tournament,,,,,,no place,Place is MTE from CSV for this Sopron mini tournament.
06.04.2025,MTE,MTE:Sopron,4,5,LOSS,,,
06.04.2025,MTE,MTE:Gyor ETO,3,1,WIN,,,
,,,,,,,,
Kellen tournament,,,,,,no place,Place is MTE from CSV. Tournament Note: Good set of games.
13.04.2025,MTE,MTE:Vasas,0,0,DRAW,,,
13.04.2025,MTE,MTE:Budai,3,1,WIN,,,
13.04.2025,MTE,MTE:Kisvarda,2,0,WIN,,,
13.04.2025,MTE,MTE:Kelen SC,0,3,LOSS,Note: Assuming Kelen SC.,
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
03.05.2025,MTE,MTE:Kiraly,2,1,WIN,group,, Note: Adding this as group match as per tournament structure.
03.05.2025,MTE,MTE:Gyirmot,1,1,DRAW,group,, Note: Adding this as group match as per tournament structure.
,,,,,,,,
MTE mini tournament,,,,,,no place,,
10.05.2025,MTE,MTE:Gyorujfalu,11,0,WIN,,,
10.05.2025,MTE,MTE:Kelen SC,6,1,WIN,,,
10.05.2025,MTE,MTE:Kiraly,6,3,WIN,,,
`;


export const MOCK_SEASONS = ["2023/2024", "2024/2025"];
export let MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {};
export let MOCK_TOURNAMENTS: Record<string, Tournament> = {}; // Changed to Record
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


// Populate MOCK_TEAMS from all unique opponent names collected
allOpponentNamesGlobal.forEach(name => {
    const normalizedName = normalizeTeamName(name); // Ensure we use normalized name for ID map lookup
    const teamId = opponentNameToIdMapGlobal.get(normalizedName.toLowerCase()) || generateTeamId(normalizedName);
    if (!MOCK_TEAMS.find(t => t.id === teamId)) {
        MOCK_TEAMS.push({ id: teamId, name: normalizedName });
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
// const exampleTournamentId = Object.keys(MOCK_TOURNAMENTS).find(id => MOCK_TOURNAMENTS[id]?.name === "Senect CUP");
// if (exampleTournamentId) {
//   console.log(`Matches for tournament ${exampleTournamentId} (${MOCK_TOURNAMENTS[exampleTournamentId]?.name}):`,
//     MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === exampleTournamentId).map(m=> ({name:m.name, date:m.date, score:m.score, notes:m.notes}))
//   );
// }

// const fonixKupa = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Fonix Kupa Szekesfehervar");
// if (fonixKupa) {
//     console.log(`Fonix Kupa (${fonixKupa.id}) notes: ${fonixKupa.notes}`);
//     console.log("Fonix Kupa Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === fonixKupa.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const turanyImre2324 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Turany Imre memorial" && t.season === "2023/2024");
// if (turanyImre2324) {
//     console.log(`Turany Imre memorial 23/24 (${turanyImre2324.id})`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === turanyImre2324.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const brnoMem = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Brno Memorial Vaclava Michny" && t.season === "2023/2024");
// if (brnoMem) {
//     console.log(`Brno Memorial Vaclava Michny (${brnoMem.id})`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => m.tournamentId === brnoMem.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }

// const gyirmotU11 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Gyirmot U11 tournament" && t.season === "2024/2025");
// if (gyirmotU11) {
//     console.log(`Gyirmot U11 tournament (${gyirmotU11.id}) final: ${gyirmotU11.finalStanding}`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === gyirmotU11.id).map(m => ({ name: m.name, notes: m.notes, date: m.date })));
// }
// const tigrisKupa = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "Tigris Kupa" && t.season === "2024/2025");
// if (tigrisKupa) {
//     console.log(`Tigris Kupa (${tigrisKupa.id}) final: ${tigrisKupa.finalStanding}`);
//     console.log("Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tigrisKupa.id).map(m => ({ name: m.name, score: m.score, notes: m.notes, date: m.date })));
// }

// const mteTuranyImre2425 = Object.values(MOCK_TOURNAMENTS).find(t => t.name === "MTE Turany Imre memorial" && t.season === "2024/2025");
// if (mteTuranyImre2425) {
//      console.log(`MTE Turany Imre memorial 24/25 (${mteTuranyImre2425.id}) final: ${mteTuranyImre2425.finalStanding}`);
//      console.log("Matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === mteTuranyImre2425.id).map(m => ({ name: m.name, score: m.score, notes: m.notes, date: m.date })));
// }

// console.log("Summer prep tournaments:", Object.values(MOCK_TOURNAMENTS).filter(t => t.name === "Summer Preparation" && t.season === "2024/2025"));
// console.log("Summer prep matches:", MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => MOCK_TOURNAMENTS[m.tournamentId!]?.name === "Summer Preparation"));
// console.log("Final Team List:", MOCK_TEAMS.map(t => t.name));

// const kellenTournaments = Object.values(MOCK_TOURNAMENTS).filter(t => t.name.toLowerCase().includes("kellen") && t.season === "2024/2025");
// kellenTournaments.forEach(tournament => {
//   console.log(`Tournament: ${tournament.name} (${tournament.id}), Place: ${tournament.place}, Final Standing: ${tournament.finalStanding}`);
//   const matches = MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tournament.id);
//   console.log("Matches: ", matches.map(m => ({name: m.name, score: m.score, date: m.date})));
// });

// const tatabanyaTournaments = Object.values(MOCK_TOURNAMENTS).filter(t => t.name.toLowerCase().includes("tatabanya") && t.season === "2024/2025");
// tatabanyaTournaments.forEach(tournament => {
//   console.log(`Tournament: ${tournament.name} (${tournament.id}), Place: ${tournament.place}, Final Standing: ${tournament.finalStanding}`);
//   const matches = MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => m.tournamentId === tournament.id);
//   console.log("Matches: ", matches.map(m => ({name: m.name, score: m.score, date: m.date, notes: m.notes})));
// });
// console.log("Opponent Name to ID Map:", opponentNameToIdMapGlobal);
// const problematicTeam = MOCK_TEAMS.find(t => t.name === "FK Slovan Ivanka");
// console.log("Problematic team found:", problematicTeam);
// const specificMatch = MOCK_MATCHES_BY_SEASON["2023/2024"].find(m => m.name.includes("FK Slovan Ivanka"));
// console.log("Specific match:", specificMatch);

// const allMatches20242025 = MOCK_MATCHES_BY_SEASON["2024/2025"];
// console.log("Number of matches 2024/2025:", allMatches20242025.length);
// const matchesByTournament20242025: Record<string, any[]> = {};
// allMatches20242025.forEach(match => {
//   const tName = match.tournamentId ? MOCK_TOURNAMENTS[match.tournamentId]?.name : "Independent";
//   if (!matchesByTournament20242025[tName]) {
//     matchesByTournament20242025[tName] = [];
//   }
//   matchesByTournament20242025[tName].push({name: match.name, score: match.score});
// });
// console.log("Matches per tournament 2024/2025:", matchesByTournament20242025);

// const allMatches20232024 = MOCK_MATCHES_BY_SEASON["2023/2024"];
// console.log("Number of matches 2023/2024:", allMatches20232024.length);
// const matchesByTournament20232024: Record<string, any[]> = {};
// allMatches20232024.forEach(match => {
//   const tName = match.tournamentId ? MOCK_TOURNAMENTS[match.tournamentId]?.name : "Independent";
//   if (!matchesByTournament20232024[tName]) {
//     matchesByTournament20232024[tName] = [];
//   }
//   matchesByTournament20232024[tName].push({name: match.name, score: match.score});
// });
// console.log("Matches per tournament 2023/2024:", matchesByTournament20232024);
// console.log("Total Tournaments Parsed:", Object.keys(MOCK_TOURNAMENTS).length);
// console.log("Total Teams Parsed:", MOCK_TEAMS.length);

// Check for any matches not assigned to a tournament to ensure all are captured
// const independentMatches2324 = MOCK_MATCHES_BY_SEASON["2023/2024"].filter(m => !m.tournamentId);
// console.log("Independent matches 2023/2024:", independentMatches2324.map(m => m.name));
// const independentMatches2425 = MOCK_MATCHES_BY_SEASON["2024/2025"].filter(m => !m.tournamentId);
// console.log("Independent matches 2024/2025:", independentMatches2425.map(m => m.name));
// Check for tournaments with no matches
// Object.values(MOCK_TOURNAMENTS).forEach(t => {
//   const hasMatches = Object.values(MOCK_MATCHES_BY_SEASON).flat().some(m => m.tournamentId === t.id);
//   if (!hasMatches) {
//     console.log(`Tournament with no matches: ${t.name} (Season: ${t.season}, ID: ${t.id})`);
//   }
// });
