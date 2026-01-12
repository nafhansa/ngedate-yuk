'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { generateSeaBattleBoard } from '@/utils/gameRules';
import toast from 'react-hot-toast';

interface SeaBattleProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

const GRID_SIZE = 10;

export function SeaBattle({ match, makeMove }: SeaBattleProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Use state directly from match for real-time updates
  const p1Board = match.gameState?.p1Board || null;
  const p2Board = match.gameState?.p2Board || null;
  const p1Shots = match.gameState?.p1Shots || [];
  const p2Shots = match.gameState?.p2Shots || [];
  const p1Ready = match.gameState?.p1Ready || false;
  const p2Ready = match.gameState?.p2Ready || false;
  const setupPhase = !(p1Ready && p2Ready);

  const isMyTurn = match.turn === user.uid;
  const myIndex = match.players.indexOf(user.uid);
  const isPlayer1 = myIndex === 0;
  const myBoard = isPlayer1 ? p1Board : p2Board;
  const enemyBoard = isPlayer1 ? p2Board : p1Board;
  const myShots = isPlayer1 ? p1Shots : p2Shots;
  const enemyShots = isPlayer1 ? p2Shots : p1Shots;
  const iAmReady = isPlayer1 ? p1Ready : p2Ready;

  const handleReady = async () => {
    if (!myBoard) {
      // Generate board if not set
      const board = generateSeaBattleBoard();
      const newGameState = {
        ...match.gameState,
        [isPlayer1 ? 'p1Board' : 'p2Board']: board,
        [isPlayer1 ? 'p1Ready' : 'p2Ready']: true,
      };
      
      // Check if both players are now ready
      const willBeReady = newGameState.p1Ready && newGameState.p2Ready;
      
      const updates: Partial<MatchData> = {
        gameState: newGameState,
      };
      
      // If both players are ready, start the game with player 1's turn
      if (willBeReady && match.status === 'waiting') {
        updates.status = 'playing';
        updates.turn = match.players[0];
      }

      try {
        await makeMove(updates);
        toast.success('You are ready!');
      } catch (error) {
        toast.error('Failed to set ready');
      }
    } else {
      const newGameState = {
        ...match.gameState,
        [isPlayer1 ? 'p1Ready' : 'p2Ready']: true,
      };
      
      // Check if both players are now ready
      const willBeReady = newGameState.p1Ready && newGameState.p2Ready;
      
      const updates: Partial<MatchData> = {
        gameState: newGameState,
      };
      
      // If both players are ready, start the game with player 1's turn
      if (willBeReady && match.status === 'waiting') {
        updates.status = 'playing';
        updates.turn = match.players[0];
      }

      try {
        await makeMove(updates);
        toast.success('You are ready!');
      } catch (error) {
        toast.error('Failed to set ready');
      }
    }
  };

  const handleShot = async (x: number, y: number) => {
    if (!isMyTurn || setupPhase) {
      toast.error("It's not your turn or setup phase is not complete!");
      return;
    }

    if (match.status !== 'playing') {
      toast.error('Game is not in progress');
      return;
    }

    // Check if already shot
    if (myShots.some(shot => shot.x === x && shot.y === y)) {
      toast.error('You already shot here!');
      return;
    }

    if (!enemyBoard) {
      toast.error('Enemy board not ready');
      return;
    }

    const hit = enemyBoard[y][x] === 1;
    const newShots = [...myShots, { x, y, hit }];

    // Check for winner
    const allShipsHit = enemyBoard.every((row, rowY) =>
      row.every((cell, colX) => {
        if (cell === 1) {
          return newShots.some(shot => shot.x === colX && shot.y === rowY && shot.hit);
        }
        return true;
      })
    );

    const nextTurn = hit ? user.uid : match.players.find(p => p !== user.uid) || match.turn;

    let updates: Partial<MatchData> = {
      gameState: {
        ...match.gameState,
        [isPlayer1 ? 'p1Shots' : 'p2Shots']: newShots,
      },
      turn: nextTurn,
    };

    if (allShipsHit) {
      updates.status = 'finished';
      updates.winnerUid = user.uid;
    }

    try {
      await makeMove(updates);
      if (hit) {
        toast.success('Hit!');
      } else {
        toast.info('Miss!');
      }
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  const getCellColor = (x: number, y: number, board: number[][] | null, shots: Array<{ x: number; y: number; hit: boolean }>) => {
    const shot = shots.find(s => s.x === x && s.y === y);
    if (shot) {
      return shot.hit ? 'bg-red-500' : 'bg-blue-200';
    }
    if (board) {
      return board[y][x] === 1 ? 'bg-slate-600' : 'bg-blue-100';
    }
    return 'bg-slate-100';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {setupPhase ? (
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-4">
            {iAmReady ? 'Waiting for opponent...' : 'Place your ships'}
          </h3>
          <p className="text-slate-600 mb-4">
            Click Ready when you're done placing your ships (auto-generated for now)
          </p>
          <button
            onClick={handleReady}
            disabled={iAmReady}
            className={`
              px-6 py-3 rounded-xl font-semibold
              ${iAmReady 
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                : 'bg-rose-500 text-white hover:bg-rose-600'}
            `}
          >
            {iAmReady ? 'Ready!' : 'Ready'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Board */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Your Board</h3>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: GRID_SIZE }).map((_, row) =>
                Array.from({ length: GRID_SIZE }).map((_, col) => {
                  const shot = enemyShots.find(s => s.x === col && s.y === row);
                  return (
                    <div
                      key={`my-${row}-${col}`}
                      className={`
                        aspect-square rounded
                        ${shot 
                          ? shot.hit ? 'bg-red-500' : 'bg-blue-200'
                          : myBoard?.[row]?.[col] === 1 
                          ? 'bg-slate-600' 
                          : 'bg-blue-100'}
                    `}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Enemy Board */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Enemy Board</h3>
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: GRID_SIZE }).map((_, row) =>
                Array.from({ length: GRID_SIZE }).map((_, col) => {
                  const shot = myShots.find(s => s.x === col && s.y === row);
                  return (
                    <button
                      key={`enemy-${row}-${col}`}
                      onClick={() => handleShot(col, row)}
                      disabled={!isMyTurn || shot !== undefined || match.status !== 'playing'}
                      className={`
                        aspect-square rounded transition-all
                        ${shot 
                          ? shot.hit ? 'bg-red-500' : 'bg-blue-200'
                          : isMyTurn && match.status === 'playing'
                          ? 'bg-blue-100 hover:bg-blue-200 cursor-pointer'
                          : 'bg-slate-100 cursor-not-allowed'}
                      `}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
