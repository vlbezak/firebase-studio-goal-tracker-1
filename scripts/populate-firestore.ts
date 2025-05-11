import 'dotenv/config'; // Load .env file
// scripts/populate-firestore.ts
import { db } from '../src/lib/firebase'; // Adjust path as necessary
import { collection, writeBatch, doc } from 'firebase/firestore'; // Removed Timestamp as it's not used now
import fs from 'fs';
import path from 'path';

// ----- Start: Copied/adapted from src/data/mockData.ts -----
const OUR_TEAM_ID = "mte";
const OUR_TEAM_NAME = "MTE";

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  date: string; 
  name: string;
  ourTeamId: string;
  opponentTeamId: string;
  ourScore: number;
  opponentScore: number;
  score: string;
  result: number; 
  place?: string;
  notes?: string;
  tournamentId?: string;
  season: string; 
}

interface Tournament {
  id: string;
  name: string;
  season: string;
  startDate: string; 
  endDate: string;   
  place?: string;
  finalStanding?: string | number;
  notes?: string;
}

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
    else if (/^Kellen SC$/i.test(normalized) || /^Kellen$/i.test(normalized) || /^Kelen SC$/i.test(normalized) || /^Kelen$/i.test(normalized)) normalized = "Kellen"; 
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
                    // console.warn(`MTE not found in teams string: ${teamsStr} for match on ${parsedDate || 'unknown date'}`);
                    continue;
                }
            } else if (teamsStr) {
                opponentNameForMatch = normalizeTeamName(teamsStr);
            } else {
                // console.warn(`Missing teams string for match on ${parsedDate || 'unknown date'} with scores present.`);
                continue; 
            }
            
            if (!opponentNameForMatch) {
                //  console.warn(`Could not determine opponent for match on ${parsedDate || 'unknown date'} with teamsStr: "${teamsStr}"`);
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
                // console.warn(`Invalid score or result for match: ${ourTeamDisplayName} vs ${opponentNameNormalized} on ${parsedDate}. Score: ${ourScoreStr}-${theirScoreStr}, Result: ${resultStr}`);
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
                            finalStanding: 'no place', 
                        };
                        seasonTournaments[newTournament.id] = newTournament;
                        match.tournamentId = newTournament.id;
                        currentTournamentInfo = {
                             id: newTournament.id, name: newTournament.name, matches: [match], notes: [],
                             startDate: newTournament.startDate, endDate: newTournament.endDate, place: newTournament.place,
                        };
                        finalizeCurrentTournament(); 
                    } else {
                        match.tournamentId = existingTournament.id;
                         seasonMatches.push({...match, season: seasonYear}); 
                    }
                 } else {
                    seasonMatches.push({...match, season: seasonYear}); 
                 }
            }
        } else if (potentialDateOrTournamentName && !parseCsvDate(potentialDateOrTournamentName)) {
            finalizeCurrentTournament();
            currentTournamentInfo = {
                id: `s${seasonYear.replace(/\//g, '')}-t${tournamentIdCounter++}`,
                name: potentialDateOrTournamentName,
                finalStanding: 'no place', 
                notes: [],
                matches: [],
                startDate: undefined,
                endDate: undefined,
                place: potentialPlaceOrTeam || undefined,
            };
        }
    }

    finalizeCurrentTournament(); 

    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: uniqueOpponentNamesThisSeason };
}

// --- Main script logic ---
async function populateFirestore() {
    const opponentTeamIdsGlobalMap = new Map<string, string>();
    let allMatches: Match[] = [];
    let allTournaments: Record<string, Tournament> = {};
    const allOpponentNames = new Set<string>();

    const seasons = [
        { year: "2023/2024", filePath: "../data/csv/2023-2024.csv" },
        { year: "2024/2025", filePath: "../data/csv/2024-2025.csv" },
    ];

    for (const season of seasons) {
        const csvPath = path.join(__dirname, season.filePath);
        try {
            const csvData = fs.readFileSync(csvPath, 'utf-8');
            const processed = processSeasonCsv(csvData, season.year, OUR_TEAM_ID, OUR_TEAM_NAME, opponentTeamIdsGlobalMap);
            
            allMatches = allMatches.concat(processed.matches);
            allTournaments = { ...allTournaments, ...processed.tournaments };
            processed.opponentTeamNames.forEach(name => allOpponentNames.add(name));
            console.log(`Processed data for season ${season.year}`);
        } catch (error) {
            console.error(`Error reading or processing CSV for ${season.year}:`, error);
            return; // Stop if one file fails
        }
    }

    // Prepare teams
    const teamsMap = new Map<string, Team>();
    teamsMap.set(OUR_TEAM_ID, { id: OUR_TEAM_ID, name: OUR_TEAM_NAME });
    allOpponentNames.forEach(normalizedName => {
        const id = opponentTeamIdsGlobalMap.get(normalizedName.toLowerCase()) || generateTeamId(normalizedName);
        if (!teamsMap.has(id)) {
            teamsMap.set(id, { id, name: normalizedName });
        }
    });
    const finalTeams: Team[] = Array.from(teamsMap.values());

    // Write to Firestore using batch writes
    const batch = writeBatch(db);

    // Add Teams
    const teamsCollection = collection(db, 'teams');
    finalTeams.forEach(team => {
        const teamRef = doc(teamsCollection, team.id);
        batch.set(teamRef, team);
    });
    console.log(`Preparing to write ${finalTeams.length} teams...`);

    // Add Tournaments
    const tournamentsCollection = collection(db, 'tournaments');
    Object.values(allTournaments).forEach(t => {
        const tournamentRef = doc(tournamentsCollection, t.id);
        const tournamentData: any = { ...t };
        if (tournamentData.notes === undefined) delete tournamentData.notes;
        if (tournamentData.place === undefined) delete tournamentData.place;
        if (tournamentData.finalStanding === undefined) delete tournamentData.finalStanding;
        batch.set(tournamentRef, tournamentData);
    });
    console.log(`Preparing to write ${Object.values(allTournaments).length} tournaments...`);

    // Add Matches
    const matchesCollection = collection(db, 'matches');
    allMatches.forEach(m => {
        const matchRef = doc(matchesCollection, m.id);
        const matchData: any = { ...m };
        if (matchData.notes === undefined) delete matchData.notes;
        if (matchData.place === undefined) delete matchData.place;
        if (matchData.tournamentId === undefined) delete matchData.tournamentId;
        batch.set(matchRef, matchData);
    });
    console.log(`Preparing to write ${allMatches.length} matches...`);

    try {
        await batch.commit();
        console.log('Successfully populated Firestore with teams, tournaments, and matches!');
    } catch (error) {
        console.error('Error writing batch to Firestore:', error);
    }
}

populateFirestore().catch(console.error);
