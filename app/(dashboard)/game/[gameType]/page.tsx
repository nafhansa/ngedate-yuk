'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { useGameLogic } from '@/hooks/useGameLogic';
import { ScoreBoard } from '@/components/game/ScoreBoard';
import { WinModal } from '@/components/game/WinModal';
import { TicTacToe } from '@/components/game/TicTacToe';
import { Connect4 } from '@/components/game/Connect4';
import { DotsBoxes } from '@/components/game/DotsBoxes';
import { SeaBattle } from '@/components/game/SeaBattle';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { updateMatch } from '@/services/db';

export default function GameRoomPage({ params }: { params: { gameType: string } }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const matchId = searchParams.get('matchId');
  const { match, loading, error, makeMove } = useGameLogic(matchId);
  const [showWinModal, setShowWinModal] = useState(false);
  const [winResult, setWinResult] = useState<'win' | 'loss' | 'draw' | null>(null);
  const [winnerName, setWinnerName] = useState<string>('');

  useEffect(() => {
    if (match && match.status === 'finished' && !showWinModal) {
      if (!user) return;

      if (match.winnerUid === null) {
        setWinResult('draw');
      } else if (match.winnerUid === user.uid) {
        setWinResult('win');
      } else {
        setWinResult('loss');
        // Load winner name
        import('@/services/db').then(({ getUser }) => {
          getUser(match.winnerUid!).then(winnerData => {
            if (winnerData) {
              setWinnerName(winnerData.displayName);
            }
          });
        });
      }
      setShowWinModal(true);
    }
  }, [match, user, showWinModal]);

  useEffect(() => {
    // Start the game if both players are present
    if (match && match.status === 'waiting' && match.players.length === 2) {
      updateMatch(match.matchId, { status: 'playing' }).catch(err => {
        console.error('Error starting game:', err);
      });
    }
  }, [match]);

  const renderGame = () => {
    if (!match || !user) return null;

    switch (params.gameType) {
      case 'tictactoe':
        return <TicTacToe match={match} makeMove={makeMove} />;
      case 'connect4':
        return <Connect4 match={match} makeMove={makeMove} />;
      case 'dotsboxes':
        return <DotsBoxes match={match} makeMove={makeMove} />;
      case 'seabattle':
        return <SeaBattle match={match} makeMove={makeMove} />;
      default:
        return <div className="text-center py-8">Unknown game type: {params.gameType}</div>;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 text-lg">{error}</p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : !match ? (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">Match not found</p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="mt-4"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div>
              <ScoreBoard match={match} />
              <div className="bg-white rounded-xl shadow-md p-6">
                {renderGame()}
              </div>
            </div>
          )}

          <WinModal
            isOpen={showWinModal}
            onClose={() => {
              setShowWinModal(false);
              router.push('/dashboard');
            }}
            winner={winResult}
            winnerName={winnerName}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
