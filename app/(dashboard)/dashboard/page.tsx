'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Gamepad2, Grid3x3, Layers, Anchor, Boxes } from 'lucide-react';
import toast from 'react-hot-toast';
import { createMatch } from '@/services/db';

const games = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: Grid3x3,
    description: 'Classic 3x3 grid game',
    color: 'bg-blue-500',
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    icon: Layers,
    description: 'Drop pieces to connect 4',
    color: 'bg-yellow-500',
  },
  {
    id: 'dotsboxes',
    name: 'Dots & Boxes',
    icon: Boxes,
    description: 'Draw lines to claim boxes',
    color: 'bg-green-500',
  },
  {
    id: 'seabattle',
    name: 'Sea Battle',
    icon: Anchor,
    description: 'Strategic naval combat',
    color: 'bg-purple-500',
  },
];

export default function DashboardPage() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleStartGame = async (gameType: string) => {
    if (!user || !userData) {
      toast.error('Please sign in to play');
      return;
    }

    if (!userData.partnerUid) {
      toast.error('Please connect with a partner first in your profile');
      router.push('/profile');
      return;
    }

    try {
      const matchId = await createMatch(
        gameType as any,
        user.uid,
        userData.partnerUid
      );
      router.push(`/game/${gameType}?matchId=${matchId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create game');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Choose a Game</h1>
            <p className="text-slate-600">
              {userData?.partnerUid
                ? 'Select a game to play with your partner'
                : 'Connect with a partner in your profile to start playing'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <Card
                  key={game.id}
                  className="text-center hover:scale-105 transition-transform"
                >
                  <div className={`${game.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 mb-2">
                    {game.name}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">{game.description}</p>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => handleStartGame(game.id)}
                    disabled={!userData?.partnerUid}
                    className="w-full"
                  >
                    Play
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
