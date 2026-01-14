'use client';

import { Card } from '@/components/ui/Card';
import { Zap, Users, History, Gamepad2 } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Real-time Gaming',
    description: 'Sinkronisasi game secara real-time dengan teknologi Firebase. Setiap langkah langsung terlihat oleh pasangan Anda.',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50',
  },
  {
    icon: Users,
    title: 'Koneksi Pasangan',
    description: 'Sistem koneksi yang mudah. Cukup masukkan email pasangan dan mulai bermain bersama.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  {
    icon: History,
    title: 'Riwayat Permainan',
    description: 'Lihat semua permainan yang pernah Anda mainkan. Track kemenangan, kekalahan, dan seri.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Gamepad2,
    title: '4 Game Seru',
    description: 'Pilih dari berbagai game menarik: Tic Tac Toe, Connect 4, Dots & Boxes, dan Sea Battle.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
];

export function Features() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Fitur Unggulan
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk tetap terhubung dan bermain bersama pasangan
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="text-center hover:scale-105 transition-transform"
              >
                <div className={`${feature.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
