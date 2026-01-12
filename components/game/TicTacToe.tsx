'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData, updateMatch } from '@/services/db';
import { checkTicTacToeWinner } from '@/utils/gameRules';
import toast from 'react-hot-toast';

interface TicTacToeProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

export function TicTacToe({ match, makeMove }: TicTacToeProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Use board directly from match state for real-time updates
  const board = match.gameState?.board || Array(9).fill(null);
  const isMyTurn = match.turn === user.uid;
  const mySymbol = match.players[0] === user.uid ? 'X' : 'O';
  const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

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
      if (winner === 'draw') {
        updates.status = 'finished';
        updates.winnerUid = null;
      } else {
        updates.status = 'finished';
        updates.winnerUid = winner === mySymbol ? user.uid : match.players.find(p => p !== user.uid) || null;
      }
    }

    try {
      console.log('Making move:', updates);
      await makeMove(updates);
      console.log('Move successful');
    } catch (error) {
      console.error('Move failed:', error);
      toast.error('Failed to make move');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="grid grid-cols-3 gap-2 aspect-square">
        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isMyTurn || cell !== null || match.status !== 'playing'}
            className={`
              aspect-square bg-white rounded-xl shadow-md text-4xl font-bold
              transition-all hover:scale-105 active:scale-95
              ${cell === 'X' ? 'text-blue-500' : cell === 'O' ? 'text-red-500' : 'text-slate-300'}
              ${!isMyTurn || cell !== null || match.status !== 'playing' 
                ? 'cursor-not-allowed opacity-50' 
                : 'cursor-pointer hover:shadow-lg hover:bg-rose-50'}
            `}
          >
            {cell || ''}
          </button>
        ))}
      </div>
    </div>
  );
}
