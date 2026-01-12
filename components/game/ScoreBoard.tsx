'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { getUser } from '@/services/db';
import { useEffect, useState } from 'react';

interface ScoreBoardProps {
  match: MatchData;
}

export function ScoreBoard({ match }: ScoreBoardProps) {
  const { user } = useAuth();
  const [opponentName, setOpponentName] = useState<string>('Opponent');
  const [currentPlayerName, setCurrentPlayerName] = useState<string>('You');

  useEffect(() => {
    const loadNames = async () => {
      if (!user || !match) return;

      const opponentUid = match.players.find(p => p !== user.uid);
      if (opponentUid) {
        try {
          const opponentData = await getUser(opponentUid);
          if (opponentData) {
            setOpponentName(opponentData.displayName);
          }
        } catch (error) {
          console.error('Error loading opponent name:', error);
        }
      }
    };

    loadNames();
  }, [user, match]);

  if (!user || !match) return null;

  const isMyTurn = match.turn === user.uid;

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mb-4">
      <div className="flex justify-between items-center">
        <div className={`flex-1 text-center p-3 rounded-lg ${isMyTurn ? 'bg-rose-100 border-2 border-rose-500' : 'bg-slate-50'}`}>
          <p className="text-sm font-medium text-slate-600">You</p>
          <p className="text-lg font-semibold text-slate-800">{currentPlayerName}</p>
          {isMyTurn && <p className="text-xs text-rose-600 mt-1">● Your turn</p>}
        </div>
        <div className="px-4 text-slate-400">VS</div>
        <div className={`flex-1 text-center p-3 rounded-lg ${!isMyTurn ? 'bg-rose-100 border-2 border-rose-500' : 'bg-slate-50'}`}>
          <p className="text-sm font-medium text-slate-600">Opponent</p>
          <p className="text-lg font-semibold text-slate-800">{opponentName}</p>
          {!isMyTurn && <p className="text-xs text-rose-600 mt-1">● Their turn</p>}
        </div>
      </div>
    </div>
  );
}
