'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { MatchData, updateMatch } from '@/services/db';

export function useGameLogic(matchId: string | null) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setLoading(false);
      return;
    }

    const unsubscribe: Unsubscribe = onSnapshot(
      doc(db, 'matches', matchId),
      (snapshot) => {
        if (snapshot.exists()) {
          const matchData = snapshot.data() as MatchData;
          setMatch(matchData);
          setError(null);
          console.log('Match updated:', matchData.matchId, 'Status:', matchData.status, 'Turn:', matchData.turn, 'GameState:', matchData.gameState);
        } else {
          setError('Match not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to match:', err);
        setError('Failed to load match');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  const makeMove = async (updates: Partial<MatchData>) => {
    if (!matchId) return;
    try {
      await updateMatch(matchId, updates);
    } catch (err) {
      console.error('Error making move:', err);
      throw err;
    }
  };

  return { match, loading, error, makeMove };
}
