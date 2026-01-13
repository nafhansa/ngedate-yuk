'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Trophy, X, Minus } from 'lucide-react';

interface WinModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: 'win' | 'loss' | 'draw' | null;
  winnerName?: string;
}

export function WinModal({ isOpen, onClose, winner, winnerName }: WinModalProps) {
  useEffect(() => {
    if (isOpen && winner === 'win') {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen, winner]);

  if (!isOpen || !winner) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="text-center">
        {winner === 'win' && (
          <>
            <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">You Win! 🎉</h2>
            <p className="text-slate-600 mb-6">Congratulations on your victory!</p>
          </>
        )}
        {winner === 'loss' && (
          <>
            <div className="w-20 h-20 bg-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Game Over</h2>
            <p className="text-slate-600 mb-2">{winnerName} won this game!</p>
            <p className="text-slate-600 mb-6">Better luck next time!</p>
          </>
        )}
        {winner === 'draw' && (
          <>
            <div className="w-20 h-20 bg-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Minus className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">It&apos;s a Draw!</h2>
            <p className="text-slate-600 mb-6">Great game, both players!</p>
          </>
        )}
        <Button variant="primary" onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
}
