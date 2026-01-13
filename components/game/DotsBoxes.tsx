'use client';

import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import { checkBoxCompleted, checkDotsBoxesWinner } from '@/utils/gameRules';
import { array2DToObject, objectToArray2D } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface DotsBoxesProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

const DOTS = 4;
const BOXES = 3;

// Warna Player
const P1_COLOR = 'bg-cyan-400'; // Biru terang
const P1_BG = 'bg-cyan-400/20'; // Biru transparan untuk box
const P2_COLOR = 'bg-rose-500'; // Merah/Pink
const P2_BG = 'bg-rose-500/20'; // Merah transparan untuk box

export function DotsBoxes({ match, makeMove }: DotsBoxesProps) {
  const { user } = useAuth();

  if (!user || !match) return null;

  // --- 1. DATA PREPARATION ---
  
  // Convert Firestore object format to 2D arrays
  let hLines: boolean[][];
  let vLines: boolean[][];
  
  if (match.gameState?.hLines && typeof match.gameState.hLines === 'object' && !Array.isArray(match.gameState.hLines)) {
    const hRows = match.gameState.hLinesRows || 4;
    const hCols = match.gameState.hLinesCols || 3;
    hLines = objectToArray2D(match.gameState.hLines, hRows, hCols);
  } else if (Array.isArray(match.gameState?.hLines)) {
    hLines = match.gameState.hLines;
  } else {
    hLines = Array(4).fill(null).map(() => Array(3).fill(false));
  }

  if (match.gameState?.vLines && typeof match.gameState.vLines === 'object' && !Array.isArray(match.gameState.vLines)) {
    const vRows = match.gameState.vLinesRows || 3;
    const vCols = match.gameState.vLinesCols || 4;
    vLines = objectToArray2D(match.gameState.vLines, vRows, vCols);
  } else if (Array.isArray(match.gameState?.vLines)) {
    vLines = match.gameState.vLines;
  } else {
    vLines = Array(3).fill(null).map(() => Array(4).fill(false));
  }

  const boxes = match.gameState?.boxes || Array(9).fill(null);
  const scores = match.gameState?.scores || {};
  const isMyTurn = match.turn === user.uid;
  const myPlayerId = user.uid;
  
  // Tentukan apakah user adalah Player 1 (biasanya yang create match atau index 0)
  // Ini hanya untuk visual consistency warna user
  const isUserP1 = match.players[0] === user.uid;
  
  // Helper untuk mendapatkan warna garis berdasarkan siapa yang giliran saat ini
  // (Logic sederhana: jika giliran saya, pakai warna saya untuk hover)
  const myColor = isUserP1 ? P1_COLOR : P2_COLOR;
  const oppColor = isUserP1 ? P2_COLOR : P1_COLOR;

  // --- 2. GAME LOGIC HANDLERS ---

  const handleHLineClick = async (row: number, col: number) => {
    if (!isMyTurn) { toast.error("Bukan giliranmu!"); return; }
    if (hLines[row]?.[col]) return; 
    if (match.status !== 'playing') return;

    const newHLines = hLines.map((r) => [...r]);
    newHLines[row][col] = true;

    let newBoxes = [...boxes];
    let newScores = { ...scores };
    let boxCompleted = false;

    // Check Above
    if (row > 0) {
      const boxIndex = (row - 1) * BOXES + col;
      if (checkBoxCompleted(boxIndex, newHLines, vLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }
    // Check Below
    if (row < DOTS - 1) {
      const boxIndex = row * BOXES + col;
      if (checkBoxCompleted(boxIndex, newHLines, vLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }

    await submitMove(newHLines, vLines, newBoxes, newScores, boxCompleted);
  };

  const handleVLineClick = async (row: number, col: number) => {
    if (!isMyTurn) { toast.error("Bukan giliranmu!"); return; }
    if (vLines[row]?.[col]) return;
    if (match.status !== 'playing') return;

    const newVLines = vLines.map((r) => [...r]);
    newVLines[row][col] = true;

    let newBoxes = [...boxes];
    let newScores = { ...scores };
    let boxCompleted = false;

    // Check Left
    if (col > 0) {
      const boxIndex = row * BOXES + (col - 1);
      if (checkBoxCompleted(boxIndex, hLines, newVLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }
    // Check Right
    if (col < BOXES) {
      const boxIndex = row * BOXES + col;
      if (checkBoxCompleted(boxIndex, hLines, newVLines)) {
        newBoxes[boxIndex] = myPlayerId;
        newScores[myPlayerId] = (newScores[myPlayerId] || 0) + 1;
        boxCompleted = true;
      }
    }

    await submitMove(hLines, newVLines, newBoxes, newScores, boxCompleted);
  };

  const submitMove = async (
    newHLines: boolean[][], 
    newVLines: boolean[][], 
    newBoxes: (string|null)[], 
    newScores: Record<string, number>, 
    boxCompleted: boolean
  ) => {
    const nextTurn = boxCompleted ? myPlayerId : match.players.find(p => p !== user.uid) || match.turn;
    const allBoxesFilled = newBoxes.every(box => box !== null);
    
    let winner: string | null = null;
    if (allBoxesFilled) {
      winner = checkDotsBoxesWinner(newScores);
    }

    let updates: Partial<MatchData> = {
      gameState: {
        hLines: array2DToObject(newHLines),
        vLines: array2DToObject(newVLines),
        hLinesRows: 4, hLinesCols: 3,
        vLinesRows: 3, vLinesCols: 4,
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
      toast.error('Gagal menyimpan langkah');
    }
  };

  // --- 3. HELPER RENDERING ---

  // Menentukan warna garis yang sudah jadi. 
  // Karena data kita hanya simpan true/false, kita asumsikan warna berdasarkan turn logic 
  // (Ini limitasi simple dots box, biasanya kita perlu simpan siapa pemilik garis. 
  // Untuk visual kali ini, kita pakai warna abu gelap solid jika taken, atau kita bisa random visual).
  // *Saran*: Agar visual seperti gambar, garis yang taken harusnya punya warna player. 
  // Tapi karena data struktur cuma boolean, kita buat garis taken jadi warna gelap netral (seperti konektor) 
  // ATAU kita buat warnanya berdasarkan siapa yang 'menutup' kotak.
  // -> Untuk simplicity & aesthetic: Garis taken = Slate-700 (seperti pipa gelap/kabel), Box = Berwarna.
  
  const getBoxStyle = (ownerUid: string | null) => {
    if (!ownerUid) return '';
    // Jika owner adalah player 1 (di list players), pakai warna P1, else P2
    const isP1 = match.players[0] === ownerUid;
    return isP1 ? P1_COLOR : P2_COLOR;
  };

  const getOpponentId = () => match.players.find(p => p !== myPlayerId) || '';

  return (
    <div className="max-w-md mx-auto select-none">
      
      {/* Score Board Modern */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className={`text-center px-4 py-2 rounded-xl transition-all ${isMyTurn ? 'bg-slate-100 ring-2 ring-slate-200' : ''}`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-3 h-3 rounded-full ${isUserP1 ? P1_COLOR : P2_COLOR}`}></div>
            <p className="text-sm font-bold text-slate-700">Kamu</p>
          </div>
          <p className="text-3xl font-black text-slate-800">{scores[myPlayerId] || 0}</p>
        </div>
        
        <div className="text-slate-300 font-bold text-xl">VS</div>

        <div className={`text-center px-4 py-2 rounded-xl transition-all ${!isMyTurn && match.status === 'playing' ? 'bg-slate-100 ring-2 ring-slate-200' : ''}`}>
          <div className="flex items-center justify-end gap-2 mb-1">
            <p className="text-sm font-bold text-slate-700">Lawan</p>
            <div className={`w-3 h-3 rounded-full ${!isUserP1 ? P1_COLOR : P2_COLOR}`}></div>
          </div>
          <p className="text-3xl font-black text-slate-800">{scores[getOpponentId()] || 0}</p>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="bg-slate-50 p-6 rounded-3xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] border border-slate-200">
        <div className="relative aspect-square w-full">
          
          {/* LAYER 1: CHECKERBOARD BACKGROUND */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 rounded-xl overflow-hidden pointer-events-none">
            {Array.from({ length: 9 }).map((_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const isEven = (row + col) % 2 === 0;
              return (
                <div 
                  key={`bg-${i}`} 
                  className={`${isEven ? 'bg-slate-200/50' : 'bg-white/50'}`}
                />
              );
            })}
          </div>

{/* LAYER 2: FILLED BOXES */}
<div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {/* PERBAIKAN DI SINI: Tambahkan : string | null dan : number */}
            {boxes.map((owner: string | null, i: number) => (
              <div key={`box-${i}`} className="p-1.5 transition-all duration-500 ease-out transform scale-100">
                {owner && (
                  <div 
                    className={`w-full h-full rounded-lg shadow-inner ${getBoxStyle(owner)} opacity-90 animate-pop-in`}
                    style={{ animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* LAYER 3: HORIZONTAL LINES */}
          {hLines.map((rowArr, rowIndex) => 
            rowArr.map((isTaken, colIndex) => {
              // Kalkulasi posisi persentase
              const top = (rowIndex / (DOTS - 1)) * 100;
              const left = (colIndex / (DOTS - 1)) * 100;
              const width = (1 / (DOTS - 1)) * 100;
              
              return (
                <div
                  key={`h-${rowIndex}-${colIndex}`}
                  className="absolute h-8 -translate-y-1/2 flex items-center justify-center z-10"
                  style={{ top: `${top}%`, left: `${left}%`, width: `${width}%` }}
                >
                   {/* Tombol transparan besar (Hitbox) */}
                   <button
                    onClick={() => handleHLineClick(rowIndex, colIndex)}
                    disabled={isTaken || !isMyTurn}
                    className="w-full h-full group flex items-center justify-center cursor-pointer disabled:cursor-default"
                  >
                    {/* Visual Garis */}
                    <div 
                      className={`
                        h-2.5 rounded-full transition-all duration-300
                        ${isTaken 
                          ? 'w-[110%] bg-slate-700 shadow-sm z-20' // Garis jadi lebih panjang sedikit supaya nyambung ke dot
                          : 'w-[90%] bg-slate-300/50 group-hover:bg-slate-400 group-hover:h-3'
                        }
                        ${!isTaken && isMyTurn ? `group-hover:${myColor}` : ''}
                      `}
                    />
                  </button>
                </div>
              );
            })
          )}

          {/* LAYER 4: VERTICAL LINES */}
          {vLines.map((rowArr, rowIndex) => 
            rowArr.map((isTaken, colIndex) => {
              const top = (rowIndex / (DOTS - 1)) * 100;
              const left = (colIndex / (DOTS - 1)) * 100;
              const height = (1 / (DOTS - 1)) * 100;

              return (
                <div
                  key={`v-${rowIndex}-${colIndex}`}
                  className="absolute w-8 -translate-x-1/2 flex items-center justify-center z-10"
                  style={{ top: `${top}%`, left: `${left}%`, height: `${height}%` }}
                >
                   <button
                    onClick={() => handleVLineClick(rowIndex, colIndex)}
                    disabled={isTaken || !isMyTurn}
                    className="w-full h-full group flex items-center justify-center cursor-pointer disabled:cursor-default"
                  >
                     <div 
                      className={`
                        w-2.5 rounded-full transition-all duration-300
                        ${isTaken 
                          ? 'h-[110%] bg-slate-700 shadow-sm z-20' 
                          : 'h-[90%] bg-slate-300/50 group-hover:bg-slate-400 group-hover:w-3'
                        }
                        ${!isTaken && isMyTurn ? `group-hover:${myColor}` : ''}
                      `}
                    />
                  </button>
                </div>
              );
            })
          )}

          {/* LAYER 5: DOTS (Top Layer) */}
          {Array.from({ length: DOTS }).map((_, r) => 
            Array.from({ length: DOTS }).map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute w-5 h-5 bg-slate-800 rounded-full z-30 shadow-[1px_2px_0px_rgba(0,0,0,0.3)]"
                style={{
                  top: `${(r / (DOTS - 1)) * 100}%`,
                  left: `${(c / (DOTS - 1)) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                {/* Efek kilau kecil di dot */}
                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-slate-600 rounded-full opacity-50"></div>
              </div>
            ))
          )}

        </div>
      </div>
      
      {/* Turn Indicator Status */}
      <div className="mt-6 text-center">
        {match.status === 'finished' ? (
           <div className="animate-bounce">
             <p className="text-slate-500 font-medium">Pemenang</p>
             <p className={`text-2xl font-black ${match.winnerUid === myPlayerId ? 'text-green-500' : match.winnerUid === null ? 'text-slate-500' : 'text-red-500'}`}>
               {match.winnerUid === myPlayerId ? '🎉 KAMU MENANG! 🎉' : match.winnerUid === null ? 'SERI!' : 'YAH, KAMU KALAH 😢'}
             </p>
           </div>
        ) : (
          <p className={`font-medium transition-colors ${isMyTurn ? 'text-blue-600' : 'text-slate-400'}`}>
            {isMyTurn ? '👉 Giliranmu jalan!' : '⏳ Menunggu lawan...'}
          </p>
        )}
      </div>

      <style jsx global>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .animate-pop-in {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}