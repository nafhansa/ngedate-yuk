'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Heart, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useState } from 'react';

export function LandingNavbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
      toast.success('Berhasil masuk!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Gagal masuk');
      setSigningIn(false);
    }
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="font-bold text-xl text-slate-800">Ngedate Yuk</span>
          </div>

          <div className="flex items-center">
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
              </div>
            ) : user ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleDashboard}
              >
                Dashboard
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleSignIn}
                disabled={signingIn}
              >
                {signingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk dengan Google'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
