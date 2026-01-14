'use client';

import { Card } from '@/components/ui/Card';
import { LogIn, UserPlus, Play } from 'lucide-react';

const steps = [
  {
    number: 1,
    icon: LogIn,
    title: 'Masuk/Daftar',
    description: 'Login dengan akun Google Anda. Proses cepat dan aman.',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50',
  },
  {
    number: 2,
    icon: UserPlus,
    title: 'Hubungkan Pasangan',
    description: 'Masukkan email pasangan Anda di halaman profile untuk terhubung.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    number: 3,
    icon: Play,
    title: 'Mulai Bermain',
    description: 'Pilih game favorit, buat atau join room, dan nikmati permainan bersama!',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
];

export function HowItWorks() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-800 mb-4">
            Cara Kerja
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Tiga langkah sederhana untuk mulai bermain bersama pasangan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                <Card className="text-center h-full">
                  <div className="flex flex-col items-center">
                    <div className={`${step.bgColor} w-16 h-16 rounded-full flex items-center justify-center mb-4 relative`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 lg:-right-6 w-6 lg:w-12 h-0.5 bg-gradient-to-r from-rose-300 to-rose-100 transform -translate-y-1/2 z-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
