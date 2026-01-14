'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Heart } from 'lucide-react';

export function CTA() {
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
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-rose-500 to-pink-500">
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-white fill-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
          Siap Memulai Petualangan Bersama?
        </h2>

        <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
          Bergabunglah dengan ribuan pasangan yang sudah menikmati momen kebersamaan 
          melalui gaming. Mulai sekarang, gratis!
        </p>

        <Button
          variant="outline"
          size="lg"
          onClick={handleCTA}
          className="min-w-[200px] bg-white text-rose-500 border-rose-500 hover:bg-rose-500 hover:text-white"
        >
          {user ? 'Lanjutkan ke Dashboard' : 'Mulai Sekarang'}
        </Button>

        <p className="mt-8 text-sm text-white/80">
          Tidak perlu kartu kredit • Setup dalam 2 menit
        </p>
      </div>
    </section>
  );
}
