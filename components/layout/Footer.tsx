'use client';

import { useRouter } from 'next/navigation';
import { Heart, Mail, Phone } from 'lucide-react';

export function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-6 h-6 text-rose-500" />
              <span className="font-bold text-xl text-slate-800">Ngedate Yuk</span>
            </div>
            <p className="text-slate-600 text-sm">
              Platform gaming untuk pasangan jarak jauh. Tetap terhubung meski berjauhan.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Tautan</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/terms')}
                  className="text-slate-600 hover:text-rose-500 text-sm transition-colors"
                >
                  Syarat & Ketentuan
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/credits')}
                  className="text-slate-600 hover:text-rose-500 text-sm transition-colors"
                >
                  Beli Credit
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-slate-600 hover:text-rose-500 text-sm transition-colors"
                >
                  Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Kontak</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/6281317435345"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-slate-600 hover:text-rose-500 text-sm transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>+62 813-1743-5345</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@ngedateyuk.com"
                  className="flex items-center space-x-2 text-slate-600 hover:text-rose-500 text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>support@ngedateyuk.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Ngedate Yuk. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
