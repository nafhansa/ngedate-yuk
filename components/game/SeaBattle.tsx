'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import toast from 'react-hot-toast';

// --- CONFIGURATION ---
const GRID_SIZE = 10;
const SHIPS_CONFIG = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
];

interface Point {
  r: number;
  c: number;
}

interface ShipData {
  name: string;
  size: number;
  positions: Point[]; // Koordinat yang ditempati kapal
  hits: number;
}

interface SeaBattleProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

export function SeaBattle({ match, makeMove }: SeaBattleProps) {
  const { user } = useAuth();
  
  // Local state untuk fase placement
  const [placingShipIndex, setPlacingShipIndex] = useState(0);
  const [orientation, setOrientation] = useState<'H' | 'V'>('H');
  const [myTempShips, setMyTempShips] = useState<ShipData[]>([]);

  if (!user || !match) return null;

  const myUid = user.uid;
  const opponentUid = match.players.find(id => id !== myUid);
  
  // --- LOAD GAME STATE ---
  const gameState = match.gameState || {};
  
  // Data Ships: { [uid]: ShipData[] }
  const allShips = gameState.ships || {};
  const mySavedShips: ShipData[] = allShips[myUid] || [];
  
  // Data Shots: { [uid]: Point[] } -> Tembakan yang DILAKUKAN oleh player uid
  const allShots = gameState.shots || {};
  const myShots: Point[] = allShots[myUid] || [];
  const opponentShots: Point[] = (opponentUid ? allShots[opponentUid] : []) || [];

  // Status Ready
  const playersReady = gameState.ready || {};
  const amIReady = playersReady[myUid] || false;
  const isOpponentReady = opponentUid ? playersReady[opponentUid] : false;

  // Fase Game
  const isSetupPhase = !amIReady;
  const isWaitingPhase = amIReady && !isOpponentReady;
  const isBattlePhase = amIReady && isOpponentReady && match.status === 'playing';

  // --- LOGIC: PLACEMENT ---

  const handleRotate = () => {
    setOrientation(prev => prev === 'H' ? 'V' : 'H');
  };

  const isValidPlacement = (r: number, c: number, size: number, orient: 'H' | 'V', existingShips: ShipData[]) => {
    // 1. Cek Out of Bounds
    if (orient === 'H' && c + size > GRID_SIZE) return false;
    if (orient === 'V' && r + size > GRID_SIZE) return false;

    // 2. Cek Overlap dengan kapal lain
    const newShipPoints: Point[] = [];
    for (let i = 0; i < size; i++) {
      newShipPoints.push(orient === 'H' ? { r, c: c + i } : { r: r + i, c });
    }

    for (const ship of existingShips) {
      for (const pos of ship.positions) {
        if (newShipPoints.some(p => p.r === pos.r && p.c === pos.c)) {
          return false;
        }
      }
    }
    return true;
  };

  const handlePlaceCellClick = async (r: number, c: number) => {
    if (!isSetupPhase) return;
    
    const currentShipConfig = SHIPS_CONFIG[placingShipIndex];
    if (!currentShipConfig) return;

    if (!isValidPlacement(r, c, currentShipConfig.size, orientation, myTempShips)) {
      toast.error("Tidak bisa menempatkan kapal di sini!");
      return;
    }

    // Buat object kapal baru
    const newPositions: Point[] = [];
    for (let i = 0; i < currentShipConfig.size; i++) {
      newPositions.push(orientation === 'H' ? { r, c: c + i } : { r: r + i, c });
    }

    const newShip: ShipData = {
      name: currentShipConfig.name,
      size: currentShipConfig.size,
      positions: newPositions,
      hits: 0
    };

    const updatedShips = [...myTempShips, newShip];
    setMyTempShips(updatedShips);

    // Lanjut ke kapal berikutnya atau Simpan jika selesai
    if (placingShipIndex < SHIPS_CONFIG.length - 1) {
      setPlacingShipIndex(prev => prev + 1);
    } else {
      // Semua kapal terpasang -> Simpan ke DB
      await savePlacement(updatedShips);
    }
  };

  const savePlacement = async (finalShips: ShipData[]) => {
    const updates: Partial<MatchData> = {
      gameState: {
        ...gameState,
        ships: {
          ...allShips,
          [myUid]: finalShips
        },
        ready: {
          ...playersReady,
          [myUid]: true
        }
      }
    };
    await makeMove(updates);
    toast.success("Armada siap! Menunggu lawan...");
  };

  // --- LOGIC: BATTLE ---

  const handleAttack = async (r: number, c: number) => {
    if (!isBattlePhase) return;
    if (match.turn !== myUid) {
      toast.error("Bukan giliranmu!");
      return;
    }

    // Cek apakah sudah ditembak sebelumnya
    if (myShots.some(s => s.r === r && s.c === c)) {
      return; // Sudah ditembak
    }

    const newShots = [...myShots, { r, c }];
    
    // Cek Hit pada kapal lawan
    // (Dalam real app, validasi hit sebaiknya di server/cloud functions untuk anti-cheat, 
    // tapi untuk client-side logic kita cek data opponentShips yang ada di gameState)
    const opponentShipsData: ShipData[] = allShips[opponentUid!] || [];
    let isHit = false;
    let isSunk = false;
    let sunkShipName = '';

    // Deep copy ships lawan untuk update hit count
    const updatedOpponentShips = opponentShipsData.map(ship => {
      const hitIndex = ship.positions.findIndex(p => p.r === r && p.c === c);
      if (hitIndex !== -1) {
        isHit = true;
        const newHits = (ship.hits || 0) + 1;
        if (newHits === ship.size) {
          isSunk = true;
          sunkShipName = ship.name;
        }
        return { ...ship, hits: newHits };
      }
      return ship;
    });

    if (isHit) toast.success("HIT!", { icon: '💥' });
    else toast("MISS", { icon: '🌊' });

    if (isSunk) toast.success(`Kapal ${sunkShipName} lawan tenggelam!`, { icon: '💀' });

    // Cek Win Condition (Semua kapal lawan tenggelam)
    const allSunk = updatedOpponentShips.every(s => s.hits === s.size);

    let nextTurn = match.turn;
    // Rule: Kalau HIT, boleh jalan lagi. Kalau MISS, ganti giliran.
    if (!isHit) {
      nextTurn = opponentUid!;
    }

    let updates: Partial<MatchData> = {
      gameState: {
        ...gameState,
        shots: {
          ...allShots,
          [myUid]: newShots
        },
        ships: {
          ...allShips,
          [opponentUid!]: updatedOpponentShips
        }
      },
      turn: nextTurn
    };

    if (allSunk) {
      updates.status = 'finished';
      updates.winnerUid = myUid;
    }

    await makeMove(updates);
  };

  // --- RENDER HELPERS ---

  // Render Grid Setup (Kapal Sendiri)
  const renderSetupGrid = () => {
    // Gabungkan kapal yang sudah ditempatkan sementara + preview posisi (optional)
    const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);

    return (
      <div 
        className="grid gap-1 bg-blue-200 p-2 rounded-xl border-4 border-blue-300"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {grid.map((_, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const c = i % GRID_SIZE;
          
          // Cek apakah ada kapal di sini (dari temp ships)
          const occupied = myTempShips.some(s => s.positions.some(p => p.r === r && p.c === c));
          
          return (
            <button
              key={i}
              onClick={() => handlePlaceCellClick(r, c)}
              className={`
                aspect-square rounded-sm text-[8px] flex items-center justify-center transition-all
                ${occupied ? 'bg-slate-700 border border-slate-600' : 'bg-blue-400 hover:bg-blue-300'}
              `}
            >
              {occupied && ''}
            </button>
          );
        })}
      </div>
    );
  };

  // Render Grid Battle (Radar / Enemy Water)
  const renderRadarGrid = () => {
    const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    const opponentShipsData: ShipData[] = allShips[opponentUid!] || [];

    return (
      <div 
        className="grid gap-1 bg-cyan-900 p-2 rounded-xl border-4 border-cyan-700 relative overflow-hidden"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {/* Radar Scan Animation Effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/10 to-transparent animate-scan pointer-events-none z-0"></div>

        {grid.map((_, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const c = i % GRID_SIZE;

          // Cek status cell ini
          const shot = myShots.find(s => s.r === r && s.c === c);
          const isHit = shot && opponentShipsData.some(s => s.positions.some(p => p.r === r && p.c === c));
          const isMiss = shot && !isHit;

          return (
            <button
              key={i}
              onClick={() => handleAttack(r, c)}
              disabled={match.turn !== myUid || !!shot}
              className={`
                z-10 aspect-square rounded-sm flex items-center justify-center transition-all
                ${isHit ? 'bg-red-500 shadow-[0_0_10px_red]' : 
                  isMiss ? 'bg-white/20' : 
                  'bg-cyan-800 hover:bg-cyan-700'}
                ${match.turn === myUid && !shot ? 'cursor-crosshair' : 'cursor-default'}
              `}
            >
              {isHit && '💥'}
              {isMiss && '•'}
            </button>
          );
        })}
      </div>
    );
  };

  // Render Grid Mini (My Fleet Status saat Battle)
  const renderMyFleetMini = () => {
    const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    // Kapal yang sudah tersimpan
    const myShips = mySavedShips.length > 0 ? mySavedShips : myTempShips;

    return (
      <div 
        className="grid gap-[1px] bg-blue-900/50 p-1 rounded border border-blue-800 opacity-80"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {grid.map((_, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const c = i % GRID_SIZE;
          const occupied = myShips.some(s => s.positions.some(p => p.r === r && p.c === c));
          const isHitByOpponent = opponentShots.some(s => s.r === r && s.c === c);

          return (
            <div
              key={i}
              className={`
                aspect-square rounded-[1px]
                ${isHitByOpponent && occupied ? 'bg-red-500' : 
                  isHitByOpponent ? 'bg-white/30' :
                  occupied ? 'bg-slate-400' : 'bg-blue-500/30'}
              `}
            />
          );
        })}
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    <div className="max-w-md mx-auto select-none">
      
      {/* HEADER INFO */}
      <div className="mb-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
        <div>
           <h2 className="font-black text-slate-700 text-lg flex items-center gap-2">
             ⚓ SEA BATTLE 
             <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-normal">10x10</span>
           </h2>
           <p className="text-xs text-slate-400 font-bold">
             {isSetupPhase ? 'Fase Penempatan' : isWaitingPhase ? 'Menunggu Lawan' : match.status === 'finished' ? 'Game Selesai' : 'Fase Pertempuran'}
           </p>
        </div>
        
        {isBattlePhase && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${match.turn === myUid ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-500'}`}>
            {match.turn === myUid ? 'GILIRANMU' : 'GILIRAN LAWAN'}
          </div>
        )}
      </div>

      {/* --- SETUP PHASE UI --- */}
      {isSetupPhase && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center">
            <p className="text-sm text-slate-600 mb-2">Tempatkan kapalmu:</p>
            <div className="font-bold text-lg text-blue-800 mb-2">
              {SHIPS_CONFIG[placingShipIndex].name} ({SHIPS_CONFIG[placingShipIndex].size} kotak)
            </div>
            
            <button 
              onClick={handleRotate}
              className="px-4 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm active:scale-95 transition-transform"
            >
              Putar: {orientation === 'H' ? 'Horizontal ⮕' : 'Vertikal ⬇'}
            </button>
          </div>

          {renderSetupGrid()}
          <p className="text-center text-xs text-slate-400 mt-2">Klik grid untuk menempatkan kapal</p>
        </div>
      )}

      {/* --- WAITING PHASE UI --- */}
      {isWaitingPhase && (
        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="text-4xl mb-4 animate-bounce">📡</div>
          <h3 className="font-bold text-slate-700">Armada Siap!</h3>
          <p className="text-sm text-slate-500">Menunggu lawan menyusun formasi...</p>
        </div>
      )}

      {/* --- BATTLE PHASE UI --- */}
      {(isBattlePhase || match.status === 'finished') && (
        <div className="space-y-6">
          
          {/* RADAR (ENEMY) */}
          <div className="relative">
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Radar (Lawan)</span>
              <span className="text-xs font-mono text-cyan-600">TARGET LOCKED</span>
            </div>
            {renderRadarGrid()}
          </div>

          {/* MY FLEET (MINI) */}
          <div className="bg-slate-800 p-4 rounded-xl text-white">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Armada Kita</span>
              <span className="text-xs text-red-400 font-mono">
                {mySavedShips.filter(s => s.hits === s.size).length > 0 
                  ? `${mySavedShips.filter(s => s.hits === s.size).length} KAPAL TENGGELAM`
                  : 'STATUS: AMAN'}
              </span>
            </div>
            {renderMyFleetMini()}
          </div>

        </div>
      )}

      {/* --- GAME OVER UI --- */}
      {match.status === 'finished' && (
         <div className="mt-6 text-center animate-bounce">
           <div className="inline-block px-6 py-3 bg-white rounded-xl shadow-lg border border-slate-100">
             {match.winnerUid === myUid ? (
               <p className="text-xl font-black text-green-500">🏆 MISSION ACCOMPLISHED! 🏆</p>
             ) : (
               <p className="text-xl font-black text-red-500">💀 FLEET DESTROYED 💀</p>
             )}
           </div>
         </div>
      )}

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
      `}</style>
    </div>
  );
}