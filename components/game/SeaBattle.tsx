'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MatchData } from '@/services/db';
import toast from 'react-hot-toast';

// --- CONFIGURATION ---
const GRID_SIZE = 15;

// Definisi Armada (10 Kapal)
const FLEET_DEFINITIONS = [
  { id: 'carrier_1', name: 'Carrier', size: 5 },
  { id: 'battle_1', name: 'Battleship', size: 4 },
  { id: 'battle_2', name: 'Battleship', size: 4 },
  { id: 'cruiser_1', name: 'Cruiser', size: 3 },
  { id: 'cruiser_2', name: 'Cruiser', size: 3 },
  { id: 'cruiser_3', name: 'Cruiser', size: 3 },
  { id: 'destroyer_1', name: 'Destroyer', size: 2 },
  { id: 'destroyer_2', name: 'Destroyer', size: 2 },
  { id: 'destroyer_3', name: 'Destroyer', size: 2 },
  { id: 'destroyer_4', name: 'Destroyer', size: 2 },
];

interface Point {
  r: number;
  c: number;
}

interface ShipInstance {
  id: string;
  name: string;
  size: number;
  positions: Point[];
  placed: boolean;
  hits: number;
}

interface SeaBattleProps {
  match: MatchData;
  makeMove: (updates: Partial<MatchData>) => Promise<void>;
}

export function SeaBattle({ match, makeMove }: SeaBattleProps) {
  const { user } = useAuth();
  
  // --- STATE ---
  const [myFleet, setMyFleet] = useState<ShipInstance[]>(() => 
    FLEET_DEFINITIONS.map(def => ({ ...def, positions: [], placed: false, hits: 0 }))
  );
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'H' | 'V'>('H');
  const [hoverPos, setHoverPos] = useState<Point | null>(null);

  // --- KEYBOARD LISTENER (Rotate 'R') ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r') {
        setOrientation(prev => prev === 'H' ? 'V' : 'H');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user || !match) return null;
  const myUid = user.uid;
  const opponentUid = match.players.find(id => id !== myUid);

  const gameState = match.gameState || {};
  const allShips: Record<string, ShipInstance[]> = gameState.ships || {};
  const mySavedShips: ShipInstance[] = allShips[myUid] || [];
  
  const allShots: Record<string, Point[]> = gameState.shots || {};
  const myShots: Point[] = allShots[myUid] || [];
  const opponentShots: Point[] = (opponentUid ? allShots[opponentUid] : []) || [];

  const playersReady: Record<string, boolean> = gameState.ready || {};
  const amIReady = playersReady[myUid] || false;
  const isOpponentReady = opponentUid ? playersReady[opponentUid] : false;

  const isSetupPhase = !amIReady;
  const isBattlePhase = amIReady && isOpponentReady && match.status === 'playing';
  const isWaitingPhase = amIReady && !isOpponentReady;

  // --- LOGIC: PLACEMENT UTILS ---

  const getSelectedShip = () => myFleet.find(s => s.id === selectedShipId);

  const isValidPlacement = (r: number, c: number, size: number, orient: 'H' | 'V', fleet: ShipInstance[], ignoreShipId?: string) => {
    if (orient === 'H' && c + size > GRID_SIZE) return false;
    if (orient === 'V' && r + size > GRID_SIZE) return false;

    const newPoints: Point[] = [];
    for (let i = 0; i < size; i++) {
      newPoints.push(orient === 'H' ? { r, c: c + i } : { r: r + i, c });
    }

    for (const ship of fleet) {
      if (ship.id === ignoreShipId || !ship.placed) continue;
      for (const pos of ship.positions) {
        if (newPoints.some(p => p.r === pos.r && p.c === pos.c)) return false;
      }
    }
    return true;
  };

  // --- LOGIC: INTERACTION HANDLERS ---

  // 1. LEFT CLICK: Place or Pickup
  const handleLeftClick = (r: number, c: number) => {
    if (!isSetupPhase) return;

    // A. Placing Ship (Sedang memegang kapal)
    if (selectedShipId) {
      const ship = getSelectedShip();
      if (!ship) return;

      if (isValidPlacement(r, c, ship.size, orientation, myFleet, ship.id)) {
        const newPositions: Point[] = [];
        for (let i = 0; i < ship.size; i++) {
          newPositions.push(orientation === 'H' ? { r, c: c + i } : { r: r + i, c });
        }
        
        setMyFleet(prev => prev.map(s => s.id === ship.id ? { ...s, positions: newPositions, placed: true } : s));
        setSelectedShipId(null); 
      } else {
        toast.error("Tidak bisa ditempatkan di sini!");
      }
    } 
    // B. Pickup Ship (Klik kapal yang sudah ada untuk dipindah)
    else {
      const clickedShip = myFleet.find(s => s.placed && s.positions.some(p => p.r === r && p.c === c));
      if (clickedShip) {
        // Hapus dari papan, masukkan ke tangan (selected)
        setMyFleet(prev => prev.map(s => s.id === clickedShip.id ? { ...s, positions: [], placed: false } : s));
        setSelectedShipId(clickedShip.id); 
        
        // Deteksi orientasi lama untuk UX yang lebih baik
        const isHorizontal = clickedShip.positions.length > 1 && clickedShip.positions[0].r === clickedShip.positions[1].r;
        setOrientation(isHorizontal ? 'H' : 'V');
      }
    }
  };

  // 2. RIGHT CLICK: Rotate in Place
  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault(); // Mencegah menu browser muncul
    if (!isSetupPhase) return;

    // Cari kapal di titik ini
    const clickedShip = myFleet.find(s => s.placed && s.positions.some(p => p.r === r && p.c === c));
    
    if (clickedShip) {
      // Tentukan pivot rotasi (kepala kapal / posisi pertama)
      const head = clickedShip.positions[0]; 
      
      // Cek orientasi saat ini
      const isHorizontal = clickedShip.positions.length > 1 && clickedShip.positions[0].r === clickedShip.positions[1].r;
      const newOrientation = isHorizontal ? 'V' : 'H';

      // Cek apakah valid jika diputar
      if (isValidPlacement(head.r, head.c, clickedShip.size, newOrientation, myFleet, clickedShip.id)) {
        // Kalkulasi posisi baru
        const newPositions: Point[] = [];
        for (let i = 0; i < clickedShip.size; i++) {
          newPositions.push(newOrientation === 'H' ? { r: head.r, c: head.c + i } : { r: head.r + i, c: head.c });
        }
        
        // Update state
        setMyFleet(prev => prev.map(s => s.id === clickedShip.id ? { ...s, positions: newPositions } : s));
        toast.success("Diputar!", { duration: 1000, icon: '🔄' });
      } else {
        toast.error("Tidak bisa diputar (mentok/tabrakan)!");
      }
    } else if (selectedShipId) {
       // Jika sedang pegang kapal, klik kanan di mana saja untuk putar orientasi tangan
       setOrientation(prev => prev === 'H' ? 'V' : 'H');
    }
  };

  const handleConfirmPlacement = async () => {
    if (myFleet.some(s => !s.placed)) {
      toast.error("Harap pasang semua kapal!");
      return;
    }
    const updates: Partial<MatchData> = {
      gameState: {
        ...gameState,
        ships: { ...allShips, [myUid]: myFleet },
        ready: { ...playersReady, [myUid]: true }
      }
    };
    await makeMove(updates);
    toast.success("Armada Siap Tempur!");
  };

  const handleRandomize = () => {
    let tempFleet = myFleet.map(s => ({ ...s, placed: false, positions: [] as Point[] }));
    for (let ship of tempFleet) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const r = Math.floor(Math.random() * GRID_SIZE);
        const c = Math.floor(Math.random() * GRID_SIZE);
        const orient = Math.random() > 0.5 ? 'H' : 'V';
        
        if (isValidPlacement(r, c, ship.size, orient, tempFleet)) {
           const newPositions: Point[] = [];
           for (let i = 0; i < ship.size; i++) {
             newPositions.push(orient === 'H' ? { r, c: c + i } : { r: r + i, c });
           }
           ship.positions = newPositions;
           ship.placed = true;
           placed = true;
        }
        attempts++;
      }
    }
    setMyFleet([...tempFleet]);
    setSelectedShipId(null);
  };

  // --- LOGIC: BATTLE ---
  const handleAttack = async (r: number, c: number) => {
    if (!isBattlePhase || match.turn !== myUid) return;
    if (myShots.some(s => s.r === r && s.c === c)) return;

    const newShots = [...myShots, { r, c }];
    const opponentShipsData: ShipInstance[] = allShips[opponentUid!] || [];
    let isHit = false;
    let isSunk = false;
    let sunkShipName = '';

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

    if (isHit) toast.success("TARGET HIT! 🔥"); else toast("MISS 🌊");
    if (isSunk) toast.success(`${sunkShipName} TENGGELAM! 💀`);

    const allSunk = updatedOpponentShips.every(s => s.hits === s.size);
    
    let updates: Partial<MatchData> = {
      gameState: {
        ...gameState,
        shots: { ...allShots, [myUid]: newShots },
        ships: { ...allShips, [opponentUid!]: updatedOpponentShips }
      },
      turn: !isHit ? opponentUid! : match.turn
    };

    if (allSunk) {
      updates.status = 'finished';
      updates.winnerUid = myUid;
    }
    await makeMove(updates);
  };

  // --- RENDER HELPERS ---
  const renderSetupGrid = () => {
    const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    const activeShip = getSelectedShip();

    return (
      <div 
        className="grid gap-[1px] bg-blue-300 border-2 border-blue-400 select-none"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        onMouseLeave={() => setHoverPos(null)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {grid.map((_, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const c = i % GRID_SIZE;
          const occupiedShip = myFleet.find(s => s.placed && s.positions.some(p => p.r === r && p.c === c));
          
          // GHOST LOGIC
          let isGhost = false;
          let isInvalidGhost = false;
          if (activeShip && hoverPos) {
            let inRange = false;
            if (orientation === 'H' && r === hoverPos.r && c >= hoverPos.c && c < hoverPos.c + activeShip.size) inRange = true;
            if (orientation === 'V' && c === hoverPos.c && r >= hoverPos.r && r < hoverPos.r + activeShip.size) inRange = true;
            if (inRange) {
              isGhost = true;
              if (!isValidPlacement(hoverPos.r, hoverPos.c, activeShip.size, orientation, myFleet, activeShip.id)) isInvalidGhost = true;
            }
          }

          return (
            <div
              key={i}
              onMouseEnter={() => setHoverPos({ r, c })}
              onClick={() => handleLeftClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)} // Right click handler
              className={`
                aspect-square flex items-center justify-center transition-colors duration-75 relative
                ${occupiedShip 
                  ? 'bg-slate-700 border-slate-600 cursor-grab hover:bg-slate-600' // Cursor grab indicates picking up
                  : selectedShipId 
                    ? 'cursor-cell' 
                    : 'bg-blue-50/80 hover:bg-blue-100 cursor-default'}
                ${isGhost && !isInvalidGhost ? '!bg-green-400/60' : ''}
                ${isGhost && isInvalidGhost ? '!bg-red-400/60' : ''}
              `}
            >
              {occupiedShip && (
                 // Visual indicator for ships
                 <div className="w-2 h-2 rounded-full bg-slate-500/50 pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderBattleGrid = (isRadar: boolean) => {
    const grid = Array(GRID_SIZE * GRID_SIZE).fill(null);
    const displayShips: ShipInstance[] = isRadar ? [] : (mySavedShips.length ? mySavedShips : myFleet);
    const shotsToCheck = isRadar ? myShots : opponentShots;
    
    return (
      <div 
        className={`grid gap-[1px] p-1 rounded-lg border-2 relative overflow-hidden
          ${isRadar ? 'bg-cyan-900 border-cyan-600' : 'bg-blue-800 border-blue-600'}`}
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {isRadar && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent animate-scan pointer-events-none z-0"></div>}
        {grid.map((_, i) => {
          const r = Math.floor(i / GRID_SIZE);
          const c = i % GRID_SIZE;
          const shot = shotsToCheck.find(s => s.r === r && s.c === c);
          const targetShips = isRadar ? (allShips[opponentUid!] || []) : displayShips;
          const isHit = shot && targetShips.some(s => s.positions.some(p => p.r === r && p.c === c));
          const isMiss = shot && !isHit;
          const occupied = !isRadar && displayShips.some(s => s.positions.some(p => p.r === r && p.c === c));

          return (
            <button
              key={i}
              onClick={() => isRadar ? handleAttack(r, c) : null}
              disabled={!isRadar || !!shot || match.turn !== myUid}
              className={`
                relative z-10 aspect-square flex items-center justify-center
                ${isHit ? 'bg-red-500/90' : isMiss ? 'bg-white/10' : occupied ? 'bg-slate-500' : 'bg-transparent'}
                ${isRadar && !shot && match.turn === myUid ? 'hover:bg-cyan-700 cursor-crosshair' : ''}
              `}
            >
              {isHit && <span className="text-[10px]">💥</span>}
              {isMiss && <span className="text-[8px] opacity-50">●</span>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto select-none p-2 md:p-4">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div>
           <h2 className="font-black text-slate-800 text-xl md:text-2xl flex items-center gap-2">
             🌊 SEA BATTLE <span className="text-sm bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md font-bold">15x15</span>
           </h2>
           <p className="text-slate-500 text-sm font-medium">
             {isSetupPhase ? 'Atur Strategi (Klik Kiri: Pindah, Kanan: Putar)' : match.status === 'finished' ? 'Game Over' : 'Hancurkan Armada Lawan!'}
           </p>
        </div>
        <div className="mt-3 md:mt-0 flex gap-3">
          {isSetupPhase && (
             <>
               <button onClick={handleRandomize} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200">
                 🎲 Acak
               </button>
               <button 
                 onClick={() => setOrientation(prev => prev === 'H' ? 'V' : 'H')}
                 className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-all"
               >
                 Putar (R): {orientation === 'H' ? 'Horizontal ⮕' : 'Vertikal ⬇'}
               </button>
             </>
          )}
          {isBattlePhase && (
             <div className={`px-4 py-2 rounded-xl text-sm font-black tracking-wide ${match.turn === myUid ? 'bg-green-100 text-green-700 animate-pulse' : 'bg-red-100 text-red-500'}`}>
               {match.turn === myUid ? '🔥 GILIRANMU!' : '🛡️ BERTAHAN!'}
             </div>
          )}
        </div>
      </div>

      {/* SETUP PHASE */}
      {isSetupPhase && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-white p-2 rounded-xl shadow-lg border border-slate-200">
            {renderSetupGrid()}
            <p className="text-xs text-center text-slate-400 mt-2 italic">
              Tips: Klik Kanan kapal untuk memutar posisinya. Klik Kiri untuk memindahkan.
            </p>
          </div>
          <div className="w-full md:w-64 flex flex-col gap-3">
             <div className="bg-slate-800 text-white p-4 rounded-xl shadow-md">
               <h3 className="font-bold text-sm uppercase mb-3 border-b border-slate-600 pb-2">Dockyard</h3>
               <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                 {myFleet.map((ship) => (
                   <button
                     key={ship.id}
                     onClick={() => { if(ship.placed) handleLeftClick(ship.positions[0].r, ship.positions[0].c); else setSelectedShipId(ship.id); }}
                     className={`relative p-3 rounded-lg text-left transition-all ${ship.placed ? 'bg-slate-700 text-slate-400' : selectedShipId === ship.id ? 'bg-blue-600 text-white ring-2 ring-blue-300 scale-105' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                   >
                     <div className="flex justify-between items-center mb-1"><span className="font-bold text-xs">{ship.name}</span><span className="text-[10px] bg-black/20 px-1.5 rounded">{ship.size}</span></div>
                     <div className="flex gap-0.5">{Array.from({ length: ship.size }).map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-sm ${ship.placed ? 'bg-slate-500' : 'bg-green-400'}`}></div>))}</div>
                     {ship.placed && <span className="absolute top-1/2 right-3 -translate-y-1/2 text-green-500">✓</span>}
                   </button>
                 ))}
               </div>
             </div>
             <button onClick={handleConfirmPlacement} disabled={myFleet.some(s => !s.placed)} className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white font-black rounded-xl shadow-lg transition-all active:scale-95">SIAP TEMPUR! 🚀</button>
          </div>
        </div>
      )}

      {/* WAITING & BATTLE PHASE */}
      {isWaitingPhase && (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
           <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto animate-ping">📡</div>
           <h3 className="text-xl font-bold text-slate-700">Menunggu Lawan...</h3>
        </div>
      )}

      {(isBattlePhase || match.status === 'finished') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
           <div>
             <div className="flex justify-between items-end mb-2"><h3 className="font-black text-slate-700 uppercase text-sm">Radar Musuh</h3><span className="text-xs font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">HOSTILE</span></div>
             {renderBattleGrid(true)}
           </div>
           <div className="opacity-90 hover:opacity-100 transition-opacity">
             <div className="flex justify-between items-end mb-2"><h3 className="font-black text-slate-700 uppercase text-sm">Armada Kita</h3><span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">ALLY</span></div>
             {renderBattleGrid(false)}
             <div className="mt-4 bg-white p-3 rounded-xl border border-slate-200">
               <div className="grid grid-cols-2 gap-2">
                  {mySavedShips.map(ship => (
                    <div key={ship.id} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${ship.hits === ship.size ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className={`${ship.hits === ship.size ? 'text-red-500 line-through' : 'text-slate-600'}`}>{ship.name}</span>
                    </div>
                  ))}
               </div>
             </div>
           </div>
        </div>
      )}

      {match.status === 'finished' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full animate-bounce-in">
              <div className="text-6xl mb-4">{match.winnerUid === myUid ? '🏆' : '💀'}</div>
              <h2 className={`text-3xl font-black mb-2 ${match.winnerUid === myUid ? 'text-green-500' : 'text-slate-700'}`}>{match.winnerUid === myUid ? 'VICTORY!' : 'DEFEAT'}</h2>
              <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 mt-6">Main Lagi</button>
            </div>
         </div>
      )}
      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .animate-scan { animation: scan 4s linear infinite; }
        @keyframes bounce-in { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
      `}</style>
    </div>
  );
}