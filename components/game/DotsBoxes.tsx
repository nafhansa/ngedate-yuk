'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkBoxCompleted, checkDotsBoxesWinner } from '@/utils/gameRules';
import toast from 'react-hot-toast';

interface DotsBoxesProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

const DOTS = 4;
const BOXES = 3;

export function DotsBoxes({ match, makeMove }: DotsBoxesProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Use state directly from match for real-time updates
  const hLines = match.gameState?.hLines || Array(4).fill(null).map(() => Array(3).fill(false));
  const vLines = match.gameState?.vLines || Array(3).fill(null).map(() => Array(4).fill(false));
  const boxes = match.gameState?.boxes || Array(9).fill(null);
  const scores = match.gameState?.scores || {};

  const isMyTurn = match.turn === user.uid;
  const myPlayerId = user.uid;

  const handleHLineClick = async (row: number, col: number) => {
    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }

    if (hLines[row]?.[col]) {
      toast.error('This line is already taken!');
      return;
    }

    if (match.status !== 'playing') {
      toast.error('Game is not in progress');
      return;
    }

    const newHLines = hLines.map((r: boolean[]) => [...r]);
    newHLines[row][col] = true;

    // Check for completed boxes
    let newBoxes = [...boxes];
    let newScores = { ...scores };
    let boxCompleted = false;

    // Check boxes above and below this horizontal line
    if (row > 0) {
      const boxIndex = (row - 1) * BOXES + col;
      if (checkBoxCompleted(boxIndex, newHLines, vLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }
    if (row < DOTS - 1) {
      const boxIndex = row * BOXES + col;
      if (checkBoxCompleted(boxIndex, newHLines, vLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }

    const nextTurn = boxCompleted ? myPlayerId : match.players.find(p => p !== user.uid) || match.turn;

    // Check if all boxes are filled
    const allBoxesFilled = newBoxes.every(box => box !== null);
    let winner: string | null = null;
    if (allBoxesFilled) {
      winner = checkDotsBoxesWinner(newScores);
    }

    let updates: Partial<MatchData> = {
      gameState: {
        hLines: newHLines,
        vLines,
        boxes: newBoxes,
        scores: newScores,
      },
      turn: nextTurn,
    };

    if (winner && allBoxesFilled) {
      updates.status = 'finished';
      updates.winnerUid = winner === 'draw' ? null : winner;
    }

    try {
      await makeMove(updates);
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  const handleVLineClick = async (row: number, col: number) => {
    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }

    if (vLines[row]?.[col]) {
      toast.error('This line is already taken!');
      return;
    }

    if (match.status !== 'playing') {
      toast.error('Game is not in progress');
      return;
    }

    const newVLines = vLines.map((r: boolean[]) => [...r]);
    newVLines[row][col] = true;

    // Check for completed boxes
    let newBoxes = [...boxes];
    let newScores = { ...scores };
    let boxCompleted = false;

    // Check boxes left and right of this vertical line
    if (col > 0) {
      const boxIndex = row * BOXES + (col - 1);
      if (checkBoxCompleted(boxIndex, hLines, newVLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }
    if (col < BOXES) {
      const boxIndex = row * BOXES + col;
      if (checkBoxCompleted(boxIndex, hLines, newVLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }

    const nextTurn = boxCompleted ? myPlayerId : match.players.find(p => p !== user.uid) || match.turn;

    // Check if all boxes are filled
    const allBoxesFilled = newBoxes.every(box => box !== null);
    let winner: string | null = null;
    if (allBoxesFilled) {
      winner = checkDotsBoxesWinner(newScores);
    }

    let updates: Partial<MatchData> = {
      gameState: {
        hLines,
        vLines: newVLines,
        boxes: newBoxes,
        scores: newScores,
      },
      turn: nextTurn,
    };

    if (winner && allBoxesFilled) {
      updates.status = 'finished';
      updates.winnerUid = winner === 'draw' ? null : winner;
    }

    try {
      await makeMove(updates);
    } catch (error) {
      toast.error('Failed to make move');
    }
  };

  const getBoxColor = (box: string | null) => {
    if (!box) return 'bg-slate-100';
    if (box === myPlayerId) return 'bg-blue-200';
    return 'bg-red-200';
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-4 rounded-xl">
        {/* Score display */}
        <div className="flex justify-between mb-4 p-2 bg-slate-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-slate-600">You</p>
            <p className="text-2xl font-bold text-blue-600">{scores[myPlayerId] || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-600">Opponent</p>
            <p className="text-2xl font-bold text-red-600">
              {scores[match.players.find(p => p !== myPlayerId) || ''] || 0}
            </p>
          </div>
        </div>

        {/* Game grid */}
        <div className="relative" style={{ width: '100%', aspectRatio: '1' }}>
          {Array.from({ length: DOTS }).map((_, dotRow) =>
            Array.from({ length: DOTS }).map((_, dotCol) => {
              const boxRow = dotRow < BOXES ? dotRow : null;
              const boxCol = dotCol < BOXES ? dotCol : null;
              const boxIndex = boxRow !== null && boxCol !== null ? boxRow * BOXES + boxCol : null;

              return (
                <div
                  key={`dot-${dotRow}-${dotCol}`}
                  className="absolute"
                  style={{
                    left: `${(dotCol / (DOTS - 1)) * 100}%`,
                    top: `${(dotRow / (DOTS - 1)) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Dot */}
                  <div className="w-3 h-3 bg-slate-800 rounded-full" />

                  {/* Horizontal line */}
                  {dotCol < DOTS - 1 && (
                    <button
                      onClick={() => handleHLineClick(dotRow, dotCol)}
                      disabled={!isMyTurn || hLines[dotRow]?.[dotCol] || match.status !== 'playing'}
                      className={`
                        absolute top-1/2 left-1/2 w-8 h-1 -translate-y-1/2
                        ${hLines[dotRow]?.[dotCol] 
                          ? 'bg-slate-800' 
                          : isMyTurn && match.status === 'playing'
                          ? 'bg-slate-300 hover:bg-rose-400 cursor-pointer'
                          : 'bg-slate-200 cursor-not-allowed'}
                        transition-colors
                      `}
                    />
                  )}

                  {/* Vertical line */}
                  {dotRow < DOTS - 1 && (
                    <button
                      onClick={() => handleVLineClick(dotRow, dotCol)}
                      disabled={!isMyTurn || vLines[dotRow]?.[dotCol] || match.status !== 'playing'}
                      className={`
                        absolute top-1/2 left-1/2 h-8 w-1 -translate-x-1/2
                        ${vLines[dotRow]?.[dotCol] 
                          ? 'bg-slate-800' 
                          : isMyTurn && match.status === 'playing'
                          ? 'bg-slate-300 hover:bg-rose-400 cursor-pointer'
                          : 'bg-slate-200 cursor-not-allowed'}
                        transition-colors
                      `}
                    />
                  )}

                  {/* Box */}
                  {boxIndex !== null && (
                    <div
                      className={`
                        absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2
                        ${getBoxColor(boxes[boxIndex])} rounded
                      `}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
