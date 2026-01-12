'use client';

import { useState, useEffect } from 'react';
import { getMatchHistory, MatchData } from '@/services/db';

export function useMatchHistory(uid: string | null) {
  const [history, setHistory] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const loadHistory = async () => {
      try {
        const matches = await getMatchHistory(uid);
        setHistory(matches.sort((a, b) => {
          const aTime = a.lastMoveAt?.toMillis() || 0;
          const bTime = b.lastMoveAt?.toMillis() || 0;
          return bTime - aTime;
        }));
      } catch (error) {
        console.error('Error loading match history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [uid]);

  return { history, loading };
}
