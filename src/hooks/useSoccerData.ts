import { useState, useEffect } from 'react';
import { MOCK_SEASONS, MOCK_MATCHES_BY_SEASON, MOCK_TEAMS, MOCK_TOURNAMENTS } from '@/data/mockData';
import type { Match, Team, Tournament, MatchesBySeason } from '@/types/soccer';
import { db } from '@/lib/firebase'; // Your Firebase instance
import { collection, getDocs } from 'firebase/firestore'; // Removed unused query, where

export interface SoccerData {
  seasons: string[];
  matchesBySeason: MatchesBySeason;
  teams: Team[];
  tournaments: Tournament[];
  loading: boolean;
  error: Error | null;
}

const structureMatchesBySeason = (allMatches: Match[]): MatchesBySeason => {
  const matchesBySeason: MatchesBySeason = {};
  allMatches.forEach(match => {
    if (!match.season) return;
    if (!matchesBySeason[match.season]) {
      matchesBySeason[match.season] = [];
    }
    matchesBySeason[match.season].push(match);
  });
  return matchesBySeason;
};

export function useSoccerData(): SoccerData {
  const [seasons, setSeasons] = useState<string[]>([]);
  const [matchesBySeason, setMatchesBySeason] = useState<MatchesBySeason>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("Development mode: Using mock data for useSoccerData hook.");
          setSeasons(MOCK_SEASONS);
          setMatchesBySeason(MOCK_MATCHES_BY_SEASON);
          setTeams(MOCK_TEAMS);
          setTournaments(Object.values(MOCK_TOURNAMENTS));
          setLoading(false);
        } else {
          console.log("Production/Test mode: Fetching data from Firestore for useSoccerData hook.");

          // Fetch Teams
          const teamsSnapshot = await getDocs(collection(db, 'teams'));
          const firestoreTeams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
          setTeams(firestoreTeams);

          // Fetch All Matches
          const matchesSnapshot = await getDocs(collection(db, 'matches'));
          const firestoreMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
          setMatchesBySeason(structureMatchesBySeason(firestoreMatches));
          
          // Fetch All Tournaments
          const tournamentsSnapshot = await getDocs(collection(db, 'tournaments'));
          const firestoreTournaments = tournamentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
          setTournaments(firestoreTournaments);

          // Derive seasons from matches and tournaments
          const seasonSet = new Set<string>();
          firestoreMatches.forEach(match => {
            if (match.season) {
              seasonSet.add(match.season);
            }
          });
          firestoreTournaments.forEach(tournament => {
            if (tournament.season) {
              seasonSet.add(tournament.season);
            }
          });
          
          const derivedSeasons = Array.from(seasonSet).sort((a, b) => b.localeCompare(a)); // Sorts reverse chronologically for "YYYY/YYYY" or "YYYY-YYYY"
          setSeasons(derivedSeasons);

          setLoading(false);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        setError(e as Error);
        setSeasons(MOCK_SEASONS); // Fallback
        setMatchesBySeason(MOCK_MATCHES_BY_SEASON); // Fallback
        setTeams(MOCK_TEAMS); // Fallback
        setTournaments(Object.values(MOCK_TOURNAMENTS)); // Fallback
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { seasons, matchesBySeason, teams, tournaments, loading, error };
}
