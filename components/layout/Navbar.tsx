'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/services/auth';
import { LogOut, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const { user, userData } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 text-rose-500 hover:text-rose-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span className="font-bold text-xl">Ngedate Yuk</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {userData?.photoURL ? (
              <img
                src={userData.photoURL}
                alt={userData.displayName}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white font-semibold">
                {userData?.displayName?.[0] || 'U'}
              </div>
            )}
            <span className="text-slate-700 font-medium hidden sm:block">
              {userData?.displayName || 'User'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/profile')}
            >
              <User className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
