'use client';

import { Card } from '@/components/ui/Card';
import { Grid3x3, Layers, Boxes, Anchor } from 'lucide-react';

const games = [
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: Grid3x3,
    description: 'Game klasik 3x3 yang seru dan mudah dimainkan',
    color: 'bg-blue-500',
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    icon: Layers,
    description: 'Sambungkan 4 bidak secara horizontal, vertikal, atau diagonal',
    color: 'bg-yellow-500',
  },
  {
    id: 'dotsboxes',
    name: 'Dots & Boxes',
    icon: Boxes,
    description: 'Gambar garis dan klaim kotak untuk mendapatkan poin',
    color: 'bg-green-500',
  },
  {
    id: 'seabattle',
    name: 'Sea Battle',
    icon: Anchor,
    description: 'Strategi perang laut yang menantang dan seru',
    color: 'bg-purple-500',
  },
];

export function GamesShowcase() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Pilih Game Favorit Anda
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Empat game seru yang bisa Anda mainkan bersama pasangan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
                <p className="text-sm text-slate-600 leading-relaxed">
                  {game.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
