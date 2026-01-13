'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Grid3x3, Layers, Anchor, Boxes, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { createRoomWithCode, joinRoomByCode } from '@/services/db';

export const dynamic = 'force-dynamic';

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
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [createdMatchId, setCreatedMatchId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async (gameType: string) => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }

    setSelectedGame(gameType);
    setLoading(true);

    try {
      const { matchId, roomCode: code } = await createRoomWithCode(
        gameType as any,
        user.uid
      );
      setCreatedRoomCode(code);
      setCreatedMatchId(matchId);
      setShowCreateModal(true);
      setLoading(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user) {
      toast.error('Please sign in to play');
      return;
    }

    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }

    if (!selectedGame) {
      toast.error('Please select a game first');
      return;
    }

    setLoading(true);

    try {
      const matchId = await joinRoomByCode(
        roomCode.trim().toUpperCase(),
        selectedGame as any,
        user.uid
      );
      router.push(`/game/${selectedGame}?matchId=${matchId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Choose a Game</h1>
            <p className="text-slate-600">
              Create a room or join an existing room to play with your partner
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
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => handleCreateRoom(game.id)}
                      disabled={loading}
                      className="w-full"
                    >
                      Create Room
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setSelectedGame(game.id);
                        setShowJoinModal(true);
                      }}
                      disabled={loading}
                      className="w-full"
                    >
                      Join Room
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Create Room Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Room Created!"
        >
          <div className="text-center">
            <p className="text-slate-600 mb-4">
              Share this room code with your partner:
            </p>
            <div className="bg-rose-50 border-2 border-rose-500 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-rose-600 tracking-wider">
                  {createdRoomCode}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5 text-rose-600" />
                  )}
                </button>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => {
                if (selectedGame && createdMatchId) {
                  router.push(`/game/${selectedGame}?matchId=${createdMatchId}`);
                }
              }}
            >
              Go to Game Now
            </Button>
          </div>
        </Modal>

        {/* Join Room Modal */}
        <Modal
          isOpen={showJoinModal}
          onClose={() => {
            setShowJoinModal(false);
            setRoomCode('');
          }}
          title="Join Room"
        >
          <div>
            <p className="text-slate-600 mb-4">
              Enter the room code from your partner:
            </p>
            <Input
              type="text"
              placeholder="Enter room code (e.g., ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="mb-4 text-center text-2xl font-bold tracking-wider"
              maxLength={6}
            />
            <Button
              variant="primary"
              onClick={handleJoinRoom}
              disabled={loading || !roomCode.trim()}
              className="w-full"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </Button>
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
