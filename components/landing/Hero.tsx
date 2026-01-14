'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Heart, Sparkles } from 'lucide-react';

export function Hero() {
  const { user } = useAuth();
  const router = useRouter();

  const handleCTA = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-white px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-rose-500 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-white fill-white" />
            </div>
            <Sparkles className="w-6 h-6 text-rose-400 absolute -top-2 -right-2 animate-pulse" />
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-800 leading-tight mb-6">
          Tetap Terhubung Meski{' '}
          <span className="text-rose-500">Berjauhan</span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
          Mainkan game seru bersama pasangan Anda secara real-time. 
          Jarak bukan lagi penghalang untuk tetap dekat dan menikmati momen bersama.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCTA}
            className="min-w-[200px]"
          >
            {user ? 'Lanjutkan Bermain' : 'Mulai Bermain'}
          </Button>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          ✨ Gratis • Mudah • Menyenangkan
        </p>
      </div>
    </section>
  );
}
