import { useState, useEffect } from 'react';
import { MOCK_SEASONS, MOCK_MATCHES_BY_SEASON, MOCK_TEAMS, MOCK_TOURNAMENTS } from '@/data/mockData';
import type { Match, Team, Tournament, MatchesBySeason } from '@/types/soccer';
import { db } from '@/lib/firebase'; // Your Firebase instance
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface SoccerData {
  seasons: string[];
  matchesBySeason: MatchesBySeason;
  teams: Team[];
  tournaments: Tournament[]; // Added tournaments
  loading: boolean;
  error: Error | null;
}

// Helper to structure matches by season from a flat list
const structureMatchesBySeason = (allMatches: Match[]): MatchesBySeason => {
  const matchesBySeason: MatchesBySeason = {};
  allMatches.forEach(match => {
    if (!match.season) return; // Should not happen if data is clean
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]); // Added tournaments state
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
          setTournaments(Object.values(MOCK_TOURNAMENTS)); // Convert MOCK_TOURNAMENTS object to array
          setLoading(false);
        } else {
          console.log("Production/Test mode: Fetching data from Firestore for useSoccerData hook.");
          
          // Fetch Seasons (Assuming a 'seasons' collection with documents having a 'name' field or use a predefined list)
          // For this example, let's assume seasons are predefined or fetched from a specific document.
          // If you have a 'seasons' collection:
          // const seasonsSnapshot = await getDocs(collection(db, 'seasons'));
          // const firestoreSeasons = seasonsSnapshot.docs.map(doc => doc.data().name as string);
          // For now, using mock seasons for structure, replace with actual Firestore fetch
          const firestoreSeasons = MOCK_SEASONS; // Replace with actual fetch
          setSeasons(firestoreSeasons);

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

          setLoading(false);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
        setError(e as Error);
        // Fallback to mock data in case of error during prod fetch to prevent app crash
        // You might want a more robust error handling or display strategy here
        setSeasons(MOCK_SEASONS);
        setMatchesBySeason(MOCK_MATCHES_BY_SEASON);
        setTeams(MOCK_TEAMS);
        setTournaments(Object.values(MOCK_TOURNAMENTS));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { seasons, matchesBySeason, teams, tournaments, loading, error };
}
