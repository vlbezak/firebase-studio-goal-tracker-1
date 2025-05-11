// src/data/mockData.ts
import type { Match, Tournament, Team } from '@/types/soccer';

// --- Helper functions and interfaces ---
const OUR_TEAM_ID = "mte";
const OUR_TEAM_NAME = "MTE";

// --- Helper functions (Copied from populate-firestore.ts for consistency) ---
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
    else if (/^Kiraly SC$/i.test(normalized) || /^Kiraly Academy$/i.test(normalized) || /^Kiraly SE$/i.test(normalized) || /^Kiraly$/i.test(normalized)) normalized = "Kiraly";
    else if (/^Kellen SC$/i.test(normalized) || /^Kellen$/i.test(normalized)) normalized = "Kellen"; 
    else if (/gy[oöő]r eto/i.test(normalized) || normalized.toLowerCase() === "gyor" || normalized.toLowerCase() === "goyr") normalized = "Gyor ETO";
    else if (/^Petrzalka$/i.test(normalized) || /^FC Petrzalka$/i.test(normalized)) normalized = "FC Petrzalka";
    else if (/papa elc \(pelc\)|pala elc|pelc/i.test(normalized)) normalized = "Papa ELC (PELC)"; 
    else if (/pandorf/i.test(normalized)) normalized = "Parndorf";
    else if (/felcs[oöő]t/i.test(normalized)) normalized = "Felcsut";
    else if (/zalaegerszeg \(zte\)|zte/i.test(normalized) && !normalized.toLowerCase().includes("mte")) normalized = "Zalaegerszeg (ZTE)";
    else if (normalized.toLowerCase() === "zalaegerszeg mte") normalized = "Zalaegerszeg"; 
    else if (normalized.toLowerCase() === "rep" && name.length <=3 ) normalized = "Repcelak";
    else if (normalized.toLowerCase() === "fk slovan ivanka") normalized = "FK Slovan Ivanka";
    else if (normalized.toLowerCase() === "gyorulfalu") normalized = "Gyorujfalu";
    else if (/^SC Sopron$/i.test(normalized) || /^Sopron SC$/i.test(normalized) || /^Sopron$/i.test(normalized)) normalized = "Sopron";

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
    opponentTeamIdsMap: Map<string, string>
): ProcessedSeasonOutput {
    const dataAsLines: string[] = csvData.trim().split(String.fromCharCode(10));
    const mappedLines = dataAsLines.map(line => line.split(',').map(cell => cell.trim()));
    const seasonMatches: Match[] = [];
    const seasonTournaments: Record<string, Tournament> = {};
    const uniqueOpponentNamesThisSeason = new Set<string>();

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
                currentTournamentInfo.matches.forEach(m => seasonMatches.push({...m, season: seasonYear}));

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

    for (const row of mappedLines) { 
        if (row.every(cell => cell === '')) continue;

        const firstCell = row[0]; 
        const potentialDateOrTournamentName = row[0];
        const potentialPlaceOrTeam = row[1];
        const potentialTeamsOrScore = row[2];
        const potentialFinalStandingRaw = row[6];

        if (potentialDateOrTournamentName && !parseCsvDate(potentialDateOrTournamentName) && (potentialFinalStandingRaw?.toLowerCase().includes("place") || potentialFinalStandingRaw?.toLowerCase() === "no place")) {
            finalizeCurrentTournament(); 

            let finalStanding: string | number | undefined = 'no place';
            if (potentialFinalStandingRaw) {
                const standingLower = potentialFinalStandingRaw.toLowerCase();
                if (standingLower.includes("1st")) finalStanding = 1;
                else if (standingLower.includes("2nd")) finalStanding = 2;
                else if (standingLower.includes("3rd")) finalStanding = 3;
                else {
                    const num = parseInt(standingLower.match(/\d+/)?.[0] || '', 10);
                    if (!isNaN(num)) finalStanding = num;
                    else if (standingLower !== "no place") finalStanding = potentialFinalStandingRaw;
                }
            }
            
            currentTournamentInfo = {
                id: `s${seasonYear.replace(/\//g, '')}-t${tournamentIdCounter++}`,
                name: potentialDateOrTournamentName,
                finalStanding,
                notes: row[7] ? [row[7]] : [],
                matches: [],
                startDate: undefined, 
                endDate: undefined,
                place: parseCsvDate(potentialPlaceOrTeam) ? undefined : potentialPlaceOrTeam || undefined,
            };
            
            if (parseCsvDate(potentialPlaceOrTeam)) {
                currentTournamentInfo.startDate = parseCsvDate(potentialPlaceOrTeam);
                currentTournamentInfo.place = potentialTeamsOrScore && !potentialTeamsOrScore.includes(':') ? potentialTeamsOrScore : undefined;
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

        let dateStr = potentialDateOrTournamentName;
        if (!dateStr && currentTournamentInfo && lastKnownDateForTournamentMatches) {
            dateStr = lastKnownDateForTournamentMatches;
        }

        const parsedDate = parseCsvDate(dateStr);
        if (!parsedDate && !currentTournamentInfo) continue; 
        if (parsedDate) lastKnownDateForTournamentMatches = dateStr;

        const place = parsedDate ? potentialPlaceOrTeam : (currentTournamentInfo ? currentTournamentInfo.place : undefined);
        const teamsStr = parsedDate ? potentialTeamsOrScore : potentialPlaceOrTeam;
        const ourScoreStr = parsedDate ? row[3] : row[2];
        const theirScoreStr = parsedDate ? row[4] : row[3];
        const resultStr = parsedDate ? row[5] : row[4];
        const stageOrNote1 = parsedDate ? row[6] : row[5];
        const note2 = parsedDate ? row[7] : row[6];
        

        if ((teamsStr || (ourScoreStr && theirScoreStr)) && resultStr) {
            let opponentNameForMatch = "";
            let ourScore = parseInt(ourScoreStr, 10);
            let opponentScore = parseInt(theirScoreStr, 10);
            let result = parseCsvResult(resultStr);

            if (teamsStr && teamsStr.includes(':')) {
                const [team1Raw, team2Raw] = teamsStr.split(':').map(s => s.trim());
                const normalizedTeam1 = normalizeTeamName(team1Raw);
                const normalizedTeam2 = normalizeTeamName(team2Raw);

                if (normalizedTeam1.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam1.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam2;
                } else if (normalizedTeam2.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam2.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam1;
                    const tempScore = ourScore;
                    ourScore = opponentScore;
                    opponentScore = tempScore;
                    if (result === 1) result = 0;
                    else if (result === 0) result = 1;
                } else {
                    console.warn(`MTE not found in teams string: ${teamsStr} for match on ${parsedDate || 'unknown date'}`);
                    continue;
                }
            } else if (teamsStr) {
                opponentNameForMatch = normalizeTeamName(teamsStr);
            } else {
                console.warn(`Missing teams string for match on ${parsedDate || 'unknown date'} with scores present.`);
                continue; 
            }
            
            if (!opponentNameForMatch) {
                 console.warn(`Could not determine opponent for match on ${parsedDate || 'unknown date'} with teamsStr: "${teamsStr}"`);
                continue;
            }
            
            const opponentNameNormalized = normalizeTeamName(opponentNameForMatch);
            uniqueOpponentNamesThisSeason.add(opponentNameNormalized); 
            
            let opponentId = opponentTeamIdsMap.get(opponentNameNormalized.toLowerCase());
            if (!opponentId) {
                opponentId = generateTeamId(opponentNameNormalized);
                opponentTeamIdsMap.set(opponentNameNormalized.toLowerCase(), opponentId);
            }

            if (isNaN(ourScore) || isNaN(opponentScore) || result === -1) {
                console.warn(`Invalid score or result for match: ${ourTeamDisplayName} vs ${opponentNameNormalized} on ${parsedDate}. Score: ${ourScoreStr}-${theirScoreStr}, Result: ${resultStr}`);
                continue;
            }

            let matchNamePrefix = "";
            const combinedNotesArray = [];

            if (stageOrNote1) {
                const stageLower = stageOrNote1.toLowerCase();
                if (stageLower.includes("group") || stageLower.includes("final") || stageLower.includes("semi final") || stageLower.includes("quarter final") || stageLower.includes("3rd place") || stageLower.includes("5th place") || stageLower.includes("match for") || stageLower.includes("playoff") || stageLower.includes("3. miesto") || stageLower.includes("po penaltach")) {
                    matchNamePrefix = `${stageOrNote1}: `;
                     if (stageOrNote1.toLowerCase().includes("po penaltach") || stageOrNote1.toLowerCase().includes("penalty shootout")) {
                        combinedNotesArray.push(stageOrNote1); // Keep as note
                        matchNamePrefix = ""; // Don't prefix match name with "penalty shootout"
                    }
                } else {
                    combinedNotesArray.push(stageOrNote1);
                }
            }
            if (note2) combinedNotesArray.push(note2);

            const matchName = `${matchNamePrefix}${OUR_TEAM_NAME} vs ${opponentNameNormalized}`;
            
            const match: Match = {
                id: `s${seasonYear.replace(/\//g, '')}-m${matchIdCounter++}`,
                date: parsedDate || (currentTournamentInfo?.startDate || '1970-01-01'),
                name: matchName,
                ourTeamId: ourTeamId,
                opponentTeamId: opponentId,
                ourScore,
                opponentScore,
                score: `${ourScore}-${opponentScore}`,
                result,
                place: place || currentTournamentInfo?.place || undefined,
                notes: combinedNotesArray.length > 0 ? combinedNotesArray.join('; ') : undefined,
                season: seasonYear, 
            };

            if (currentTournamentInfo) {
                match.tournamentId = currentTournamentInfo.id;
                currentTournamentInfo.matches.push(match);
                if (parsedDate) {
                    if (!currentTournamentInfo.startDate || new Date(parsedDate) < new Date(currentTournamentInfo.startDate)) {
                        currentTournamentInfo.startDate = parsedDate;
                    }
                    if (!currentTournamentInfo.endDate || new Date(parsedDate) > new Date(currentTournamentInfo.endDate)) {
                        currentTournamentInfo.endDate = parsedDate;
                    }
                }
                if (place && !currentTournamentInfo.place) currentTournamentInfo.place = place;
            } else {
                 if (potentialDateOrTournamentName && (potentialDateOrTournamentName.toLowerCase().includes("summer preparation") || potentialDateOrTournamentName.toLowerCase().includes("training match") || potentialDateOrTournamentName.toLowerCase().includes("friendly tournament"))) {
                    const implicitTournamentName = potentialDateOrTournamentName;
                    const implicitTournamentId = `s${seasonYear.replace(/\//g, '')}-it${tournamentIdCounter++}`;

                    let existingTournament = Object.values(seasonTournaments).find(
                        t => t.name === implicitTournamentName && t.startDate === parsedDate && t.place === (place || 'Unknown Location')
                    );

                    if (!existingTournament) {
                        const newTournament: Tournament = {
                            id: implicitTournamentId,
                            name: implicitTournamentName,
                            season: seasonYear,
                            startDate: parsedDate || '1970-01-01',
                            endDate: parsedDate || '1970-01-01',
                            place: place || 'Unknown Location',
                            finalStanding: 'no place', // Explicitly no place for these
                        };
                        seasonTournaments[newTournament.id] = newTournament;
                        match.tournamentId = newTournament.id;
                        // Create temporary tournament info to add this match, then finalize
                        currentTournamentInfo = {
                             id: newTournament.id, name: newTournament.name, matches: [match], notes: [],
                             startDate: newTournament.startDate, endDate: newTournament.endDate, place: newTournament.place,
                        };
                        finalizeCurrentTournament(); // Finalize immediately
                    } else {
                        match.tournamentId = existingTournament.id;
                         seasonMatches.push({...match, season: seasonYear}); // Add to matches that will be processed later if part of a larger tournament
                    }
                 } else {
                    seasonMatches.push({...match, season: seasonYear}); 
                 }
            }
        } else if (potentialDateOrTournamentName && !parseCsvDate(potentialDateOrTournamentName)) {
            // This is a new tournament header line
            finalizeCurrentTournament(); // Finalize any previous tournament
            currentTournamentInfo = {
                id: `s${seasonYear.replace(/\//g, '')}-t${tournamentIdCounter++}`,
                name: potentialDateOrTournamentName,
                finalStanding: 'no place', // Default, will be updated if final standing is in row[6]
                notes: [],
                matches: [],
                startDate: undefined, // Will be set by first match or specific date cell
                endDate: undefined,
                place: potentialPlaceOrTeam || undefined, // Place from row[1]
            };
        }
    }

    finalizeCurrentTournament(); // Finalize any remaining tournament at the end of the CSV

    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: uniqueOpponentNamesThisSeason };
}


const csvData2023_2024 = `
,,,,,,,,
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
4.5.2024,MTE,MTE: Papa ELC (PELC),2,1,WIN,group,,
4.5.2024,MTE,MTE: Csorna,3,0,WIN,semi final,,
4.5.2024,MTE,MTE: Papa ELC (PELC),4,0,WIN,final,,
,,,,,,,,
Gyor mini tournament,,,,,,no place,,
12.5.2024,Gyor ETO,MTE:Gyor ETO,0,4,LOSS,,,
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

const csvData2024_2025 = `
,,,,,,,,
Summer Preparation,Place,Teams,Our,Theirs,,no place,,
19.7.2024,MTE,MTE:Okos Foci,20,4,WIN,,,
Summer Preparation,,,,,,no place,,
7.8.2024,Gyirmot,MTE:Gyirmot,12,6,WIN,,,
Summer Preparation,,,,,,no place,,
23.8.2024,MTE,MTE:Papa,14,2,WIN,,,
Summer Preparation,,,,,,no place,,
31.8.2024,MTE,MTE: Petrzalka,3,1,WIN,,,
Summer Preparation,,,,,,no place,,
31.8.2024,MTE,MTE:Gyirmot,8,4,WIN,,,
Summer Preparation,,,,,,no place,,
3.9.2024,MITE,MTE:MITE,14,2,WIN,,,
Summer Preparation,,,,,,no place,,
4.9.2024,Pandorf,MTE:Parndorf,16,1,WIN,,,
,,,,,,,,
Kellen mini tournament,,,,,,no place,,
22.9.2024,Budapest Kelen,MTE:Meszoly,2,2,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Dunakeszi,4,4,DRAW,,,
22.9.2024,Budapest Kelen,MTE:Kellen SC,2,4,LOSS,,,
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
17.11.2024,Gyor ETO,MTE:Sopron,10,4,WIN,,,
17.11.2024,Gyor ETO,MTE:Csorna,4,2,WIN,,,
17.11.2024,Gyor ETO,MTE:Gyor ETO,2,4,LOSS,,,
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
07.12.2024,Szekesfehervar,MTE:Sekszar,5,1,WIN,group,,
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
25.01.2025,Repcelak,MTE:ZTE,0,1,LOSS,group,,
25.01.2025,Repcelak,MTE:Haladas,2,0,WIN,group,,
25.01.2025,Repcelak,MTE:Gyirmot,1,0,WIN,group,,
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
22.02.2025,Gyorujfalu ,MTE:Velky Meder,3,1,WIN,group,"match for 3rd place",
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


// --- Data Loading and Processing ---
const opponentTeamIdsGlobalMap = new Map<string, string>();
let combinedMatches: Match[] = [];
let combinedTournaments: Record<string, Tournament> = {};
const combinedOpponentNames = new Set<string>();

const seasonsToLoad = [
    { year: "2023/2024", csvString: csvData2023_2024 }, 
    { year: "2024/2025", csvString: csvData2024_2025 }, 
];

for (const season of seasonsToLoad) {
    try {
        const processed = processSeasonCsv(season.csvString, season.year, OUR_TEAM_ID, OUR_TEAM_NAME, opponentTeamIdsGlobalMap);
        
        combinedMatches = combinedMatches.concat(processed.matches);
        combinedTournaments = { ...combinedTournaments, ...processed.tournaments };
        processed.opponentTeamNames.forEach(name => combinedOpponentNames.add(name));
    } catch (error) {
        console.error(`Error processing CSV for ${season.year} in mockData.ts:`, error);
    }
}

// --- Export Data ---
export const MOCK_SEASONS: string[] = seasonsToLoad.map(s => s.year);

export const MOCK_MATCHES_BY_SEASON: Record<string, Match[]> = {};
MOCK_SEASONS.forEach(season => {
    MOCK_MATCHES_BY_SEASON[season] = combinedMatches.filter(match => match.season === season);
});

export const MOCK_TOURNAMENTS: Record<string, Tournament> = combinedTournaments;

// Create MOCK_TEAMS ensuring OUR_TEAM_NAME is "MTE" and not "MTE Eagles"
const teamsMap = new Map<string, Team>();
// Add our team first with the correct name
teamsMap.set(OUR_TEAM_ID, { id: OUR_TEAM_ID, name: OUR_TEAM_NAME }); 

combinedOpponentNames.forEach(normalizedName => {
    const id = opponentTeamIdsGlobalMap.get(normalizedName.toLowerCase()) || generateTeamId(normalizedName);
    if (!teamsMap.has(id)) {
        teamsMap.set(id, { id, name: normalizedName });
    }
});
export const MOCK_TEAMS: Team[] = Array.from(teamsMap.values());
