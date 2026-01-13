'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkTicTacToeWinner } from '@/utils/gameRules'; // Pastikan fungsi ini juga diupdate
import toast from 'react-hot-toast';

interface TicTacToeProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

export function TicTacToe({ match, makeMove }: TicTacToeProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Menggunakan 25 slot untuk grid 5x5
  const board = match.gameState?.board || Array(25).fill(null);
  const isMyTurn = match.turn === user.uid;
  const mySymbol = match.players[0] === user.uid ? 'X' : 'O';

  const handleCellClick = async (index: number) => {
    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }

    if (board[index] !== null) {
      toast.error('This cell is already taken!');
      return;
    }

    if (match.status !== 'playing') {
      toast.error('Game is not in progress');
      return;
    }

    const newBoard = [...board];
    newBoard[index] = mySymbol;

    // Penting: Fungsi checkTicTacToeWinner harus mendukung grid 5x5
    const winner = checkTicTacToeWinner(newBoard);
    const nextTurn = match.players.find(p => p !== user.uid) || match.turn;

    let updates: Partial<MatchData> = {
      gameState: {
        ...match.gameState,
        board: newBoard,
      },
      turn: winner ? match.turn : nextTurn,
    };

    if (winner) {
      updates.status = 'finished';
      if (winner === 'draw') {
        updates.winnerUid = null;
      } else {
        updates.winnerUid = winner === mySymbol ? user.uid : (match.players.find(p => p !== user.uid) || null);
      }
    }

    try {
      await makeMove(updates);
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  return (
    <div className="max-w-xl mx-auto"> {/* Lebar ditambah sedikit untuk 5 kolom */}
      <div className="grid grid-cols-5 gap-2 aspect-square"> {/* grid-cols-5 adalah kunci */}
        {board.map((cell: string | null, index: number) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isMyTurn || cell !== null || match.status !== 'playing'}
            className={`
              aspect-square bg-white rounded-lg shadow-sm text-2xl font-bold
              transition-all hover:scale-105 active:scale-95
              ${cell === 'X' ? 'text-blue-500' : cell === 'O' ? 'text-red-500' : 'text-slate-300'}
              ${!isMyTurn || cell !== null || match.status !== 'playing' 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:shadow-md hover:bg-blue-50'}
            `}
          >
            {cell || ''}
          </button>
        ))}
      </div>
    </div>
  );
}