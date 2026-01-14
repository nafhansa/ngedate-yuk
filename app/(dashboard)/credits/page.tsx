'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CREDIT_PACKAGES, formatRupiah } from '@/services/payment';
import { Coins, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Script from 'next/script';

export default function CreditsPage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);

  const handleBuyCredits = async (packageId: string) => {
    if (!user || !userData) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }

    setLoading(packageId);
    try {
      const response = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId: user.uid,
          userEmail: userData.email,
          userName: userData.displayName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create transaction');
      }

      const data = await response.json();
      setSnapToken(data.token);
      
      // Open Midtrans Snap
      if (typeof window !== 'undefined' && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: async (result: any) => {
            toast.success('Pembayaran berhasil! Credit sedang ditambahkan...');
            await refreshUserData();
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          },
          onPending: (result: any) => {
            toast.loading('Menunggu pembayaran...');
          },
          onError: (result: any) => {
            toast.error('Pembayaran gagal');
          },
          onClose: () => {
            setLoading(null);
            setSnapToken(null);
          },
        });
      }
    } catch (error: any) {
      console.error('Error buying credits:', error);
      toast.error(error.message || 'Gagal memproses pembayaran');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ProtectedRoute>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
        strategy="lazyOnload"
        onLoad={() => {
          if (snapToken && typeof window !== 'undefined' && (window as any).snap) {
            (window as any).snap.pay(snapToken, {
              onSuccess: async (result: any) => {
                toast.success('Pembayaran berhasil! Credit sedang ditambahkan...');
                await refreshUserData();
                setTimeout(() => {
                  router.push('/dashboard');
                }, 2000);
              },
              onPending: (result: any) => {
                toast.loading('Menunggu pembayaran...');
              },
              onError: (result: any) => {
                toast.error('Pembayaran gagal');
              },
              onClose: () => {
                setLoading(null);
                setSnapToken(null);
              },
            });
          }
        }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center">
                <Coins className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
              Beli Credit
            </h1>
            <p className="text-slate-600">
              Pilih paket credit yang sesuai untuk Anda
            </p>
            {userData && (
              <div className="mt-4">
                <p className="text-slate-700">
                  Credit Anda saat ini:{' '}
                  <span className="font-semibold text-rose-600">
                    {userData.isAdmin ? '∞ (Admin)' : (userData.credits || 0)}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CREDIT_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative ${
                  pkg.recommended || pkg.bestValue
                    ? 'border-2 border-rose-500 shadow-lg'
                    : ''
                }`}
              >
                {pkg.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Recommended
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Best Value
                  </div>
                )}

                <div className="text-center">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {pkg.name}
                    </h3>
                    <div className="text-3xl font-bold text-rose-600 mb-1">
                      {formatRupiah(pkg.price)}
                    </div>
                    <div className="text-sm text-slate-500">
                      {pkg.credits} Credits
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatRupiah(pkg.pricePerCredit)} / credit
                    </div>
                  </div>

                  <ul className="text-left mb-6 space-y-2 text-sm text-slate-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {pkg.credits} Credits
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Berlaku untuk semua game
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      Tidak ada batas waktu
                    </li>
                  </ul>

                  <Button
                    variant={pkg.recommended || pkg.bestValue ? 'primary' : 'outline'}
                    size="lg"
                    onClick={() => handleBuyCredits(pkg.id)}
                    disabled={loading !== null}
                    className="w-full"
                  >
                    {loading === pkg.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Beli Sekarang'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              Pembayaran aman melalui Midtrans. Support Bank Transfer, E-wallet, dan lainnya.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
