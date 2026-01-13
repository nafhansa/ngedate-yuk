'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkConnect4Winner } from '@/utils/gameRules';
import toast from 'react-hot-toast';

interface Connect4Props {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

const ROWS = 6;
const COLS = 7;

export function Connect4({ match, makeMove }: Connect4Props) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Use grid directly from match state for real-time updates
  const grid = match.gameState?.grid || Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  const isMyTurn = match.turn === user.uid;
  const myPlayerId = user.uid;
  const opponentId = match.players.find(p => p !== user.uid) || '';

  const findLowestEmptyRow = (col: number): number | null => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (grid[row]?.[col] === null) {
        return row;
      }
    }
    return null;
  };

  const handleColumnClick = async (col: number) => {
    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }

    if (match.status !== 'playing') {
      toast.error('Game is not in progress');
      return;
    }

    const row = findLowestEmptyRow(col);
    if (row === null) {
      toast.error('This column is full!');
      return;
    }

    const newGrid = grid.map((r: (string | null)[]) => [...r]);
    newGrid[row][col] = myPlayerId;

    const winner = checkConnect4Winner(newGrid);
    const nextTurn = match.players.find(p => p !== user.uid) || match.turn;

    let updates: Partial<MatchData> = {
      gameState: {
        ...match.gameState,
        grid: newGrid,
      },
      turn: winner ? match.turn : nextTurn,
    };

    if (winner) {
      if (winner === 'draw') {
        updates.status = 'finished';
        updates.winnerUid = null;
      } else {
        updates.status = 'finished';
        updates.winnerUid = winner === myPlayerId ? user.uid : opponentId;
      }
    }

    try {
      await makeMove(updates);
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  const getCellColor = (cell: string | null) => {
    if (!cell) return 'bg-slate-100';
    if (cell === myPlayerId) return 'bg-blue-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-slate-300 p-2 rounded-xl">
        {/* Column buttons */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {Array.from({ length: COLS }).map((_, col) => (
            <button
              key={col}
              onClick={() => handleColumnClick(col)}
              disabled={!isMyTurn || match.status !== 'playing'}
              className={`
                h-12 rounded-lg font-bold text-white
                ${isMyTurn && match.status === 'playing' 
                  ? 'bg-rose-500 hover:bg-rose-600 cursor-pointer' 
                  : 'bg-slate-400 cursor-not-allowed'}
                transition-colors
              `}
            >
              ↓
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: ROWS }).map((_, row) =>
            Array.from({ length: COLS }).map((_, col) => {
              const cell = grid[row]?.[col] || null;
              return (
                <div
                  key={`${row}-${col}`}
                  className={`
                    aspect-square rounded-full ${getCellColor(cell)}
                    border-2 border-slate-400
                  `}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
