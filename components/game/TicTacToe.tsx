'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkTicTacToeWinner } from '@/utils/gameRules';
import toast from 'react-hot-toast';

interface TicTacToeProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

export function TicTacToe({ match, makeMove }: TicTacToeProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // --- SETUP DATA ---
  // Ambil board dari DB. Jika tidak ada, buat array kosong.
  const rawBoard = match.gameState?.board || [];

  // FIX: Pastikan length board SELALU 25.
  // Jika data lama cuma 9 item (3x3), kita tambahkan sisa null agar grid 5x5 penuh.
  const board = [
    ...rawBoard, 
    ...Array(Math.max(0, 25 - rawBoard.length)).fill(null)
  ].slice(0, 25);

  const isMyTurn = match.turn === user.uid;
  const isPlayer1 = match.players[0] === user.uid;
  
  const mySymbol = isPlayer1 ? 'X' : 'O';

  // --- LOGIC ---
  const handleCellClick = async (index: number) => {
    if (!isMyTurn) {
      toast.error("Bukan giliranmu!");
      return;
    }
    if (board[index] !== null) return;
    if (match.status !== 'playing') return;

    const newBoard = [...board];
    newBoard[index] = mySymbol;

    // Pastikan utils checkTicTacToeWinner kamu support array length 25
    const winner = checkTicTacToeWinner(newBoard); 
    const nextTurn = match.players.find(p => p !== user.uid) || match.turn;

    let updates: Partial<MatchData> = {
      gameState: { ...match.gameState, board: newBoard },
      turn: winner ? match.turn : nextTurn,
    };

    if (winner) {
      updates.status = 'finished';
      updates.winnerUid = winner === 'draw' ? null : (winner === mySymbol ? user.uid : (match.players.find(p => p !== user.uid) || null));
    }

    try {
      await makeMove(updates);
    } catch (error) {
      toast.error('Gagal menyimpan langkah');
    }
  };

  // --- RENDER ICON ---
  const renderIcon = (symbol: string) => {
    if (symbol === 'X') {
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-500 drop-shadow-sm animate-pop">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (symbol === 'O') {
      return (
        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 drop-shadow-sm animate-pop">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto select-none">
      
      {/* Header Status */}
      <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isPlayer1 ? 'bg-cyan-100 text-cyan-600' : 'bg-rose-100 text-rose-600'}`}>
            <span className="font-black text-xl">{mySymbol}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kamu</span>
            <span className="font-bold text-slate-700">Player {isPlayer1 ? '1' : '2'}</span>
          </div>
        </div>

        {match.status === 'playing' && (
          <div className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
            isMyTurn 
              ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' 
              : 'bg-slate-100 text-slate-400'
          }`}>
            {isMyTurn ? 'Giliranmu' : 'Menunggu...'}
          </div>
        )}
      </div>

      {/* --- GAME BOARD (FIXED UI) --- */}
      <div className="bg-slate-200 p-4 rounded-3xl shadow-inner w-full aspect-square">
        <div 
          className="grid gap-2 w-full h-full"
          style={{
            // INI KUNCINYA: Memaksa layout menjadi 5x5 secara eksplisit
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(5, 1fr)'
          }}
        >
          {board.map((cell: string | null, index: number) => {
            const isTaken = cell !== null;
            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!isMyTurn || isTaken || match.status !== 'playing'}
                className={`
                  relative w-full h-full flex items-center justify-center rounded-xl transition-all duration-150
                  ${isTaken 
                    ? 'bg-slate-50 shadow-inner ring-1 ring-black/5' 
                    : isMyTurn && match.status === 'playing'
                      ? 'bg-white shadow-[0_3px_0_rgb(203,213,225)] hover:-translate-y-0.5 hover:shadow-[0_4px_0_rgb(203,213,225)] active:translate-y-[2px] active:shadow-none' 
                      : 'bg-slate-100 opacity-80 cursor-not-allowed'
                  }
                `}
              >
                {cell && renderIcon(cell)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer / Game End Status */}
      <div className="mt-8 text-center min-h-[4rem]">
        {match.status === 'finished' ? (
           <div className="animate-bounce inline-block px-8 py-4 bg-white rounded-2xl shadow-lg border border-slate-100">
             <p className="text-slate-400 font-bold text-xs uppercase mb-1">Hasil Pertandingan</p>
             {match.winnerUid === user.uid ? (
               <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                 🎉 KAMU MENANG!
               </p>
             ) : match.winnerUid === null ? (
               <p className="text-2xl font-black text-slate-600">SERI!</p>
             ) : (
               <p className="text-2xl font-black text-rose-500">YAH, KALAH 😢</p>
             )}
           </div>
        ) : (
          <p className="text-slate-400 text-sm font-medium">
             Target: 4 atau 5 simbol berurutan untuk menang
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
}