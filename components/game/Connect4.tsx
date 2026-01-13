'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkConnect4Winner } from '@/utils/gameRules';
import { objectToArray2D, array2DToObject } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface Connect4Props {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

// Ubah ke 10x10
const ROWS = 10;
const COLS = 10;

export function Connect4({ match, makeMove }: Connect4Props) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // Convert Firestore object format to 2D array for game logic
  let grid: (string | null)[][];
  if (match.gameState?.grid && typeof match.gameState.grid === 'object' && !Array.isArray(match.gameState.grid)) {
    // Firestore object format: convert to array
    const gridRows = match.gameState.gridRows || ROWS;
    const gridCols = match.gameState.gridCols || COLS;
    grid = objectToArray2D(match.gameState.grid, gridRows, gridCols);
  } else if (Array.isArray(match.gameState?.grid)) {
    // Legacy array format (for backward compatibility)
    grid = match.gameState.grid;
  } else {
    // Initialize empty grid
    grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));
  }
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

    // Convert array back to Firestore object format
    const gridObject = array2DToObject(newGrid);

    let updates: Partial<MatchData> = {
      gameState: { 
        ...match.gameState, 
        grid: gridObject,
        gridRows: ROWS,
        gridCols: COLS,
      },
      turn: winner ? match.turn : nextTurn,
    };

    if (winner) {
      updates.status = 'finished';
      if (winner === 'draw') {
        updates.winnerUid = null;
      } else {
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
    if (!cell) return 'bg-white'; // Diubah ke putih agar grid 10x10 lebih bersih
    if (cell === myPlayerId) return 'bg-blue-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-2xl mx-auto"> {/* Lebar ditambah untuk menampung 10 kolom */}
      <div className="bg-slate-300 p-2 rounded-xl shadow-inner">
        {/* Tombol Input Kolom */}
        <div className="grid grid-cols-10 gap-1 mb-1">
          {Array.from({ length: COLS }).map((_, col) => (
            <button
              key={col}
              onClick={() => handleColumnClick(col)}
              disabled={!isMyTurn || match.status !== 'playing'}
              className={`
                h-10 rounded-t-lg font-bold text-white text-xs
                ${isMyTurn && match.status === 'playing' 
                  ? 'bg-rose-500 hover:bg-rose-600' 
                  : 'bg-slate-400 opacity-50'}
                transition-colors
              `}
            >
              ↓
            </button>
          ))}
        </div>

        {/* Grid 10x10 */}
        <div className="grid grid-cols-10 gap-1 bg-slate-400 p-1 rounded-lg">
  {grid.map((rowArr: (string | null)[], row: number) =>
    rowArr.map((cell: string | null, col: number) => (
      <div
        key={`${row}-${col}`}
        className={`
          aspect-square rounded-full ${getCellColor(cell)}
          border border-slate-500 shadow-inner
        `}
      />
    ))
  )}
</div>
      </div>
    </div>
  );
}