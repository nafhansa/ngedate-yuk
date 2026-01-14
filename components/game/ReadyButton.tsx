'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { setPlayerReady, checkAndStartGame } from '@/services/db';
import type { MatchData } from '@/services/db';
import { checkSufficientCredits } from '@/services/credits';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface ReadyButtonProps {
  match: MatchData;
  onGameStart?: () => void;
}

export function ReadyButton({ match, onGameStart }: ReadyButtonProps) {
  const { user, userData } = useAuth();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasEnoughCredits, setHasEnoughCredits] = useState(true);
  const [isCheckingCredits, setIsCheckingCredits] = useState(true);

  useEffect(() => {
    if (!user || !match) return;

    const playersReady = match.playersReady || {};
    const myUid = user.uid;
    const opponentUid = match.players.find(id => id !== myUid);

    setIsReady(playersReady[myUid] || false);
    setIsOpponentReady(opponentUid ? (playersReady[opponentUid] || false) : false);

    // Check if user has enough credits
    const checkCredits = async () => {
      try {
        const sufficient = await checkSufficientCredits(myUid, 1);
        setHasEnoughCredits(sufficient);
      } catch (error) {
        console.error('Error checking credits:', error);
        setHasEnoughCredits(false);
      } finally {
        setIsCheckingCredits(false);
      }
    };

    checkCredits();
  }, [user, match]);

  // Auto-check and start game when both ready
  useEffect(() => {
    if (!user || !match || match.status !== 'waiting') return;

    const checkStart = async () => {
      if (isReady && isOpponentReady && !match.creditsDeducted) {
        try {
          const started = await checkAndStartGame(match.matchId);
          if (started && onGameStart) {
            onGameStart();
          }
        } catch (error: any) {
          console.error('Error starting game:', error);
          toast.error(error.message || 'Gagal memulai game');
        }
      }
    };

    checkStart();
  }, [isReady, isOpponentReady, match, user, onGameStart]);

  const handleReady = async () => {
    if (!user || !match) return;

    if (!hasEnoughCredits) {
      toast.error('Credit tidak cukup. Silakan beli credit terlebih dahulu.');
      router.push('/credits');
      return;
    }

    setIsProcessing(true);
    try {
      await setPlayerReady(match.matchId, user.uid);
      setIsReady(true);
      toast.success('Anda sudah ready!');
      
      // Check if both ready to start game
      setTimeout(async () => {
        try {
          await checkAndStartGame(match.matchId);
        } catch (error: any) {
          console.error('Error starting game:', error);
        }
      }, 500);
    } catch (error: any) {
      console.error('Error setting ready:', error);
      toast.error(error.message || 'Gagal set ready');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user || match.status !== 'waiting') {
    return null;
  }

  if (match.creditsDeducted) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
        <p className="text-green-700 font-semibold">Game akan segera dimulai...</p>
      </div>
    );
  }

  if (isCheckingCredits) {
    return (
      <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 text-center">
        <Loader2 className="w-8 h-8 text-slate-500 mx-auto animate-spin" />
        <p className="text-slate-600 mt-2">Memeriksa credit...</p>
      </div>
    );
  }

  if (!hasEnoughCredits) {
    return (
      <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-semibold mb-4">Credit tidak cukup untuk bermain</p>
        <p className="text-red-600 text-sm mb-4">Anda membutuhkan minimal 1 credit untuk bermain</p>
        <Button
          variant="primary"
          onClick={() => router.push('/credits')}
        >
          Beli Credit
        </Button>
      </div>
    );
  }

  const opponentUid = match.players.find(id => id !== user.uid);
  const opponentName = opponentUid ? 'Opponent' : '';

  return (
    <div className="bg-white border-2 border-rose-200 rounded-xl p-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready untuk Bermain?</h3>
        <p className="text-slate-600 text-sm mb-4">
          Setelah kedua player ready, 1 credit akan terpotong dari masing-masing player
        </p>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <span className="text-slate-700 font-medium">Anda</span>
          {isReady ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-2" />
              <span className="font-semibold">Ready</span>
            </div>
          ) : (
            <span className="text-slate-500">Belum ready</span>
          )}
        </div>

        {opponentUid && (
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span className="text-slate-700 font-medium">{opponentName || 'Opponent'}</span>
            {isOpponentReady ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-semibold">Ready</span>
              </div>
            ) : (
              <span className="text-slate-500">Menunggu...</span>
            )}
          </div>
        )}
      </div>

      {!isReady ? (
        <Button
          variant="primary"
          size="lg"
          onClick={handleReady}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            'Saya Ready!'
          )}
        </Button>
      ) : (
        <div className="text-center">
          {isOpponentReady ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 font-semibold">Kedua player sudah ready!</p>
              <p className="text-green-600 text-sm mt-1">Credit sedang dipotong, game akan segera dimulai...</p>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 font-semibold">Menunggu opponent ready...</p>
              <p className="text-blue-600 text-sm mt-1">Anda sudah ready, tunggu opponent untuk klik ready</p>
            </div>
          )}
        </div>
      )}

      {userData && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500">
            Credit Anda: <span className="font-semibold text-slate-700">{userData.credits || 0}</span>
            {userData.isAdmin && <span className="ml-2 text-rose-500">(Admin - Unlimited)</span>}
          </p>
        </div>
      )}
    </div>
  );
}
