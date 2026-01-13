'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <Card className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center">
            <Heart className="w-10 h-10 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Ngedate Yuk</h1>
        <p className="text-slate-600 mb-8">Play games with your partner in real-time</p>
        
        <Button
          variant="primary"
          size="lg"
          onClick={handleGoogleSignIn}
          className="w-full"
        >
          Sign in with Google
        </Button>
        
        <p className="mt-6 text-sm text-slate-500">
          Connect with your partner and start playing together!
        </p>
      </Card>
    </div>
  );
}
