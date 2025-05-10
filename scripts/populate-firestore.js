"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/populate-firestore.ts
var firebase_1 = require("../src/lib/firebase"); // Adjust path as necessary
var firestore_1 = require("firebase/firestore");
var fs_1 = require("fs");
var path_1 = require("path");
// ----- Start: Copied/adapted from src/data/mockData.ts -----
var OUR_TEAM_ID = "mte";
var OUR_TEAM_NAME = "MTE";
function parseCsvDate(dateStr) {
    if (!dateStr || !/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(dateStr.trim()))
        return '';
    var parts = dateStr.trim().split('.');
    return "".concat(parts[2], "-").concat(parts[1].padStart(2, '0'), "-").concat(parts[0].padStart(2, '0'));
}
function parseCsvResult(resultStr) {
    if (!resultStr)
        return -1;
    switch (resultStr.trim().toUpperCase()) {
        case 'WIN': return 1;
        case 'LOSS': return 0;
        case 'DRAW': return 0.5;
        default: return -1;
    }
}
function normalizeTeamName(name) {
    if (name === undefined)
        return "";
    var normalized = name.trim();
    if (/gyirmot|gyrmot/i.test(normalized))
        normalized = "Gyirmot";
    else if (/^Kiraly SC$/i.test(normalized) || /^Kiraly Academy$/i.test(normalized) || /^Kiraly SE$/i.test(normalized) || /^Kiraly$/i.test(normalized))
        normalized = "Kiraly";
    else if (/^Kellen SC$/i.test(normalized) || /^Kellen$/i.test(normalized))
        normalized = "Kellen";
    else if (/gy[oöő]r eto/i.test(normalized) || normalized.toLowerCase() === "gyor" || normalized.toLowerCase() === "goyr")
        normalized = "Gyor ETO";
    else if (/^Petrzalka$/i.test(normalized) || /^FC Petrzalka$/i.test(normalized))
        normalized = "FC Petrzalka";
    else if (/papa elc \(pelc\)|pala elc|pelc/i.test(normalized))
        normalized = "Papa ELC (PELC)";
    else if (/pandorf/i.test(normalized))
        normalized = "Parndorf";
    else if (/felcs[oöő]t/i.test(normalized))
        normalized = "Felcsut";
    else if (/zalaegerszeg \(zte\)|zte/i.test(normalized) && !normalized.toLowerCase().includes("mte"))
        normalized = "Zalaegerszeg (ZTE)";
    else if (normalized.toLowerCase() === "zalaegerszeg mte")
        normalized = "Zalaegerszeg";
    else if (normalized.toLowerCase() === "rep" && name.length <= 3)
        normalized = "Repcelak";
    else if (normalized.toLowerCase() === "fk slovan ivanka")
        normalized = "FK Slovan Ivanka";
    else if (normalized.toLowerCase() === "gyorulfalu")
        normalized = "Gyorujfalu";
    else if (/^SC Sopron$/i.test(normalized) || /^Sopron SC$/i.test(normalized) || /^Sopron$/i.test(normalized))
        normalized = "Sopron";
    normalized = normalized.replace(/\(zte\)/i, '(ZTE)').trim();
    return normalized;
}
function generateTeamId(name) {
    return normalizeTeamName(name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function processSeasonCsv(csvData, seasonYear, ourTeamId, ourTeamDisplayName, opponentTeamIdsMap) {
    var _a;
    var lines = csvData.trim().split(', ').map(line => line.split(', ').map(cell => cell.trim())); // Corrected line);
    var seasonMatches = [];
    var seasonTournaments = {};
    var uniqueOpponentNamesThisSeason = new Set();
    var currentTournamentInfo = null;
    var matchIdCounter = 0;
    var tournamentIdCounter = 0;
    var lastKnownDateForTournamentMatches = null;
    var finalizeCurrentTournament = function () {
        var _a;
        if (currentTournamentInfo) {
            if (currentTournamentInfo.matches.length > 0) {
                currentTournamentInfo.matches.sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); });
                var tournament = {
                    id: currentTournamentInfo.id,
                    name: currentTournamentInfo.name,
                    season: seasonYear,
                    startDate: currentTournamentInfo.startDate || currentTournamentInfo.matches[0].date,
                    endDate: currentTournamentInfo.endDate || currentTournamentInfo.matches[currentTournamentInfo.matches.length - 1].date,
                    place: currentTournamentInfo.place || ((_a = currentTournamentInfo.matches[0]) === null || _a === void 0 ? void 0 : _a.place) || 'Unknown Location',
                    finalStanding: currentTournamentInfo.finalStanding,
                    notes: currentTournamentInfo.notes.length > 0 ? currentTournamentInfo.notes.join('; ') : undefined,
                };
                seasonTournaments[tournament.id] = tournament;
                currentTournamentInfo.matches.forEach(function (m) { return seasonMatches.push(__assign(__assign({}, m), { season: seasonYear })); });
            }
            else if (currentTournamentInfo.name && currentTournamentInfo.startDate) {
                var tournament = {
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
    var _loop_1 = function (row) {
        if (row.every(function (cell) { return cell === ''; }))
            return "continue";
        var firstCell = row[0];
        var potentialDateOrTournamentName = row[0];
        var potentialPlaceOrTeam = row[1];
        var potentialTeamsOrScore = row[2];
        var potentialFinalStandingRaw = row[6];
        if (potentialDateOrTournamentName && !parseCsvDate(potentialDateOrTournamentName) && ((potentialFinalStandingRaw === null || potentialFinalStandingRaw === void 0 ? void 0 : potentialFinalStandingRaw.toLowerCase().includes("place")) || (potentialFinalStandingRaw === null || potentialFinalStandingRaw === void 0 ? void 0 : potentialFinalStandingRaw.toLowerCase()) === "no place")) {
            finalizeCurrentTournament();
            var finalStanding = 'no place';
            if (potentialFinalStandingRaw) {
                var standingLower = potentialFinalStandingRaw.toLowerCase();
                if (standingLower.includes("1st"))
                    finalStanding = 1;
                else if (standingLower.includes("2nd"))
                    finalStanding = 2;
                else if (standingLower.includes("3rd"))
                    finalStanding = 3;
                else {
                    var num = parseInt(((_a = standingLower.match(/\d+/)) === null || _a === void 0 ? void 0 : _a[0]) || '', 10);
                    if (!isNaN(num))
                        finalStanding = num;
                    else if (standingLower !== "no place")
                        finalStanding = potentialFinalStandingRaw;
                }
            }
            currentTournamentInfo = {
                id: "s".concat(seasonYear.replace(/\//g, ''), "-t").concat(tournamentIdCounter++),
                name: potentialDateOrTournamentName,
                finalStanding: finalStanding,
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
            return "continue";
        }
        if (firstCell === '' && row.slice(1, 6).every(function (c) { return c === ''; }) && (row[6] || row[7])) {
            if (currentTournamentInfo) {
                var note = [row[6], row[7]].filter(Boolean).join('; ');
                if (note)
                    currentTournamentInfo.notes.push(note);
            }
            return "continue";
        }
        var dateStr = potentialDateOrTournamentName;
        if (!dateStr && currentTournamentInfo && lastKnownDateForTournamentMatches) {
            dateStr = lastKnownDateForTournamentMatches;
        }
        var parsedDate = parseCsvDate(dateStr);
        if (!parsedDate && !currentTournamentInfo)
            return "continue";
        if (parsedDate)
            lastKnownDateForTournamentMatches = dateStr;
        var place = parsedDate ? potentialPlaceOrTeam : (currentTournamentInfo ? currentTournamentInfo.place : undefined);
        var teamsStr = parsedDate ? potentialTeamsOrScore : potentialPlaceOrTeam;
        var ourScoreStr = parsedDate ? row[3] : row[2];
        var theirScoreStr = parsedDate ? row[4] : row[3];
        var resultStr = parsedDate ? row[5] : row[4];
        var stageOrNote1 = parsedDate ? row[6] : row[5];
        var note2 = parsedDate ? row[7] : row[6];
        if ((teamsStr || (ourScoreStr && theirScoreStr)) && resultStr) {
            var opponentNameForMatch = "";
            var ourScore = parseInt(ourScoreStr, 10);
            var opponentScore = parseInt(theirScoreStr, 10);
            var result = parseCsvResult(resultStr);
            if (teamsStr && teamsStr.includes(':')) {
                var _b = teamsStr.split(':').map(function (s) { return s.trim(); }), team1Raw = _b[0], team2Raw = _b[1];
                var normalizedTeam1 = normalizeTeamName(team1Raw);
                var normalizedTeam2 = normalizeTeamName(team2Raw);
                if (normalizedTeam1.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam1.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam2;
                }
                else if (normalizedTeam2.toLowerCase() === ourTeamDisplayName.toLowerCase() || normalizedTeam2.toLowerCase() === "mte") {
                    opponentNameForMatch = normalizedTeam1;
                    var tempScore = ourScore;
                    ourScore = opponentScore;
                    opponentScore = tempScore;
                    if (result === 1)
                        result = 0;
                    else if (result === 0)
                        result = 1;
                }
                else {
                    console.warn("MTE not found in teams string: ".concat(teamsStr, " for match on ").concat(parsedDate || 'unknown date'));
                    return "continue";
                }
            }
            else if (teamsStr) {
                opponentNameForMatch = normalizeTeamName(teamsStr);
            }
            else {
                console.warn("Missing teams string for match on ".concat(parsedDate || 'unknown date', " with scores present."));
                return "continue";
            }
            if (!opponentNameForMatch) {
                console.warn("Could not determine opponent for match on ".concat(parsedDate || 'unknown date', " with teamsStr: \"").concat(teamsStr, "\""));
                return "continue";
            }
            var opponentNameNormalized = normalizeTeamName(opponentNameForMatch);
            uniqueOpponentNamesThisSeason.add(opponentNameNormalized);
            var opponentId = opponentTeamIdsMap.get(opponentNameNormalized.toLowerCase());
            if (!opponentId) {
                opponentId = generateTeamId(opponentNameNormalized);
                opponentTeamIdsMap.set(opponentNameNormalized.toLowerCase(), opponentId);
            }
            if (isNaN(ourScore) || isNaN(opponentScore) || result === -1) {
                console.warn("Invalid score or result for match: ".concat(ourTeamDisplayName, " vs ").concat(opponentNameNormalized, " on ").concat(parsedDate, ". Score: ").concat(ourScoreStr, "-").concat(theirScoreStr, ", Result: ").concat(resultStr));
                return "continue";
            }
            var matchNamePrefix = "";
            var combinedNotesArray = [];
            if (stageOrNote1) {
                var stageLower = stageOrNote1.toLowerCase();
                if (stageLower.includes("group") || stageLower.includes("final") || stageLower.includes("semi final") || stageLower.includes("quarter final") || stageLower.includes("3rd place") || stageLower.includes("5th place") || stageLower.includes("match for") || stageLower.includes("playoff") || stageLower.includes("3. miesto") || stageLower.includes("po penaltach")) {
                    matchNamePrefix = "".concat(stageOrNote1, ": ");
                    if (stageOrNote1.toLowerCase().includes("po penaltach") || stageOrNote1.toLowerCase().includes("penalty shootout")) {
                        combinedNotesArray.push(stageOrNote1);
                        matchNamePrefix = "";
                    }
                }
                else {
                    combinedNotesArray.push(stageOrNote1);
                }
            }
            if (note2)
                combinedNotesArray.push(note2);
            var matchName = "".concat(matchNamePrefix).concat(OUR_TEAM_NAME, " vs ").concat(opponentNameNormalized);
            var match = {
                id: "s".concat(seasonYear.replace(/\//g, ''), "-m").concat(matchIdCounter++),
                date: parsedDate || ((currentTournamentInfo === null || currentTournamentInfo === void 0 ? void 0 : currentTournamentInfo.startDate) || '1970-01-01'),
                name: matchName,
                ourTeamId: ourTeamId,
                opponentTeamId: opponentId,
                ourScore: ourScore,
                opponentScore: opponentScore,
                score: "".concat(ourScore, "-").concat(opponentScore),
                result: result,
                place: place || (currentTournamentInfo === null || currentTournamentInfo === void 0 ? void 0 : currentTournamentInfo.place) || undefined,
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
                if (place && !currentTournamentInfo.place)
                    currentTournamentInfo.place = place;
            }
            else {
                if (potentialDateOrTournamentName && (potentialDateOrTournamentName.toLowerCase().includes("summer preparation") || potentialDateOrTournamentName.toLowerCase().includes("training match") || potentialDateOrTournamentName.toLowerCase().includes("friendly tournament"))) {
                    var implicitTournamentName_1 = potentialDateOrTournamentName;
                    var implicitTournamentId = "s".concat(seasonYear.replace(/\//g, ''), "-it").concat(tournamentIdCounter++);
                    var existingTournament = Object.values(seasonTournaments).find(function (t) { return t.name === implicitTournamentName_1 && t.startDate === parsedDate && t.place === (place || 'Unknown Location'); });
                    if (!existingTournament) {
                        var newTournament = {
                            id: implicitTournamentId,
                            name: implicitTournamentName_1,
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
                    }
                    else {
                        match.tournamentId = existingTournament.id;
                        seasonMatches.push(__assign(__assign({}, match), { season: seasonYear }));
                    }
                }
                else {
                    seasonMatches.push(__assign(__assign({}, match), { season: seasonYear }));
                }
            }
        }
        else if (potentialDateOrTournamentName && !parseCsvDate(potentialDateOrTournamentName)) {
            finalizeCurrentTournament();
            currentTournamentInfo = {
                id: "s".concat(seasonYear.replace(/\//g, ''), "-t").concat(tournamentIdCounter++),
                name: potentialDateOrTournamentName,
                finalStanding: 'no place',
                notes: [],
                matches: [],
                startDate: undefined,
                endDate: undefined,
                place: potentialPlaceOrTeam || undefined,
            };
        }
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var row = lines_1[_i];
        _loop_1(row);
    }
    finalizeCurrentTournament();
    return { matches: seasonMatches, tournaments: seasonTournaments, opponentTeamNames: uniqueOpponentNamesThisSeason };
}
// --- Main script logic ---
function populateFirestore() {
    return __awaiter(this, void 0, void 0, function () {
        var opponentTeamIdsGlobalMap, allMatches, allTournaments, allOpponentNames, seasons, _i, seasons_1, season, csvPath, csvData, processed, teamsMap, finalTeams, batch, teamsCollection, tournamentsCollection, matchesCollection, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    opponentTeamIdsGlobalMap = new Map();
                    allMatches = [];
                    allTournaments = {};
                    allOpponentNames = new Set();
                    seasons = [
                        { year: "2023/2024", filePath: "../data/csv/2023-2024.csv" },
                        { year: "2024/2025", filePath: "../data/csv/2024-2025.csv" },
                    ];
                    for (_i = 0, seasons_1 = seasons; _i < seasons_1.length; _i++) {
                        season = seasons_1[_i];
                        csvPath = path_1.default.join(__dirname, season.filePath);
                        try {
                            csvData = fs_1.default.readFileSync(csvPath, 'utf-8');
                            processed = processSeasonCsv(csvData, season.year, OUR_TEAM_ID, OUR_TEAM_NAME, opponentTeamIdsGlobalMap);
                            allMatches = allMatches.concat(processed.matches);
                            allTournaments = __assign(__assign({}, allTournaments), processed.tournaments);
                            processed.opponentTeamNames.forEach(function (name) { return allOpponentNames.add(name); });
                            console.log("Processed data for season ".concat(season.year));
                        }
                        catch (error) {
                            console.error("Error reading or processing CSV for ".concat(season.year, ":"), error);
                            return [2 /*return*/]; // Stop if one file fails
                        }
                    }
                    teamsMap = new Map();
                    teamsMap.set(OUR_TEAM_ID, { id: OUR_TEAM_ID, name: OUR_TEAM_NAME });
                    allOpponentNames.forEach(function (normalizedName) {
                        var id = opponentTeamIdsGlobalMap.get(normalizedName.toLowerCase()) || generateTeamId(normalizedName);
                        if (!teamsMap.has(id)) {
                            teamsMap.set(id, { id: id, name: normalizedName });
                        }
                    });
                    finalTeams = Array.from(teamsMap.values());
                    batch = (0, firestore_1.writeBatch)(firebase_1.db);
                    teamsCollection = (0, firestore_1.collection)(firebase_1.db, 'teams');
                    finalTeams.forEach(function (team) {
                        var teamRef = (0, firestore_1.doc)(teamsCollection, team.id);
                        batch.set(teamRef, team);
                    });
                    console.log("Preparing to write ".concat(finalTeams.length, " teams..."));
                    tournamentsCollection = (0, firestore_1.collection)(firebase_1.db, 'tournaments');
                    Object.values(allTournaments).forEach(function (tournament) {
                        var tournamentRef = (0, firestore_1.doc)(tournamentsCollection, tournament.id);
                        // Convert date strings to Firestore Timestamps if necessary, or store as ISO strings
                        // For simplicity, storing as ISO strings as per interface. Convert in app if needed.
                        batch.set(tournamentRef, __assign({}, tournament));
                    });
                    console.log("Preparing to write ".concat(Object.values(allTournaments).length, " tournaments..."));
                    matchesCollection = (0, firestore_1.collection)(firebase_1.db, 'matches');
                    allMatches.forEach(function (match) {
                        var matchRef = (0, firestore_1.doc)(matchesCollection, match.id);
                        batch.set(matchRef, __assign({}, match));
                    });
                    console.log("Preparing to write ".concat(allMatches.length, " matches..."));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, batch.commit()];
                case 2:
                    _a.sent();
                    console.log('Successfully populated Firestore with teams, tournaments, and matches!');
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error writing batch to Firestore:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
populateFirestore().catch(console.error);
