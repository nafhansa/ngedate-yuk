'use client';

import { Navbar } from '@/components/layout/Navbar';
import { ProtectedRoute } from '@/components/protected/ProtectedRoute';
import { Button } from '@/components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 lg:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
              Syarat & Ketentuan
            </h1>
            <p className="text-slate-600 mb-8">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            <div className="prose prose-slate max-w-none space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Penerimaan Syarat</h2>
                <p className="text-slate-700 leading-relaxed">
                  Dengan menggunakan platform Ngedate Yuk, Anda menyetujui untuk terikat oleh syarat dan ketentuan ini. 
                  Jika Anda tidak setuju dengan syarat dan ketentuan ini, mohon untuk tidak menggunakan platform ini.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Penggunaan Platform</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Platform Ngedate Yuk adalah platform gaming untuk pasangan jarak jauh. Anda setuju untuk:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Menggunakan platform hanya untuk tujuan yang dimaksudkan</li>
                  <li>Tidak melakukan aktivitas yang melanggar hukum atau merugikan pengguna lain</li>
                  <li>Menjaga kerahasiaan akun Anda</li>
                  <li>Bertanggung jawab atas semua aktivitas yang terjadi di akun Anda</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Sistem Credit</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Platform menggunakan sistem credit untuk bermain game:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Setiap game membutuhkan 1 credit untuk dimainkan</li>
                  <li>Credit akan terpotong setelah kedua player mengklik &quot;Ready&quot;</li>
                  <li>Credit yang sudah terpotong tidak dapat dikembalikan</li>
                  <li>Credit tidak memiliki batas waktu kedaluwarsa</li>
                  <li>Credit tidak dapat ditransfer ke akun lain</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Pembelian Credit</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Pembelian credit dilakukan melalui payment gateway Midtrans:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Pembayaran dapat dilakukan melalui Bank Transfer, E-wallet, dan metode pembayaran lainnya yang tersedia</li>
                  <li>Credit akan ditambahkan ke akun Anda setelah pembayaran berhasil dikonfirmasi</li>
                  <li>Proses penambahan credit biasanya memakan waktu beberapa menit setelah pembayaran berhasil</li>
                  <li>Jika credit tidak masuk setelah 24 jam, silakan hubungi customer service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Kebijakan No Refund (Tidak Ada Pengembalian Uang)</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  <strong className="text-red-600">PENTING: Semua pembelian credit bersifat final dan tidak dapat dikembalikan (No Refund Policy).</strong>
                </p>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Dengan melakukan pembelian credit, Anda menyetujui bahwa:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Semua pembayaran yang sudah dilakukan tidak dapat dikembalikan dalam bentuk apapun</li>
                  <li>Credit yang sudah dibeli tidak dapat dikembalikan atau ditukar dengan uang tunai</li>
                  <li>Jika terjadi kesalahan pembayaran atau duplikasi, silakan hubungi customer service untuk bantuan</li>
                  <li>Kami berhak menolak permintaan refund dengan alasan apapun</li>
                  <li>Kebijakan ini berlaku untuk semua metode pembayaran dan paket credit</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Kami menyarankan Anda untuk memastikan jumlah credit yang ingin dibeli sebelum melakukan pembayaran.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Akun Pengguna</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Anda bertanggung jawab untuk:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Menjaga kerahasiaan informasi akun Anda</li>
                  <li>Segera melaporkan jika akun Anda diretas atau digunakan tanpa izin</li>
                  <li>Tidak membagikan akun Anda kepada pihak lain</li>
                  <li>Menggunakan akun sesuai dengan ketentuan yang berlaku</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Perilaku Pengguna</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Anda dilarang untuk:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-slate-700">
                  <li>Melakukan kecurangan atau manipulasi dalam permainan</li>
                  <li>Menggunakan bahasa yang tidak sopan atau merugikan pengguna lain</li>
                  <li>Melakukan aktivitas yang melanggar hukum</li>
                  <li>Mengganggu pengalaman pengguna lain</li>
                </ul>
                <p className="text-slate-700 leading-relaxed mt-3">
                  Pelanggaran terhadap ketentuan ini dapat mengakibatkan penangguhan atau penutupan akun tanpa pengembalian credit.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Perubahan Layanan</h2>
                <p className="text-slate-700 leading-relaxed">
                  Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan kapan saja tanpa pemberitahuan sebelumnya. 
                  Kami tidak bertanggung jawab atas kerugian yang timbul akibat perubahan layanan.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Batasan Tanggung Jawab</h2>
                <p className="text-slate-700 leading-relaxed">
                  Platform Ngedate Yuk disediakan &quot;sebagaimana adanya&quot;. Kami tidak memberikan jaminan bahwa layanan akan selalu tersedia, 
                  bebas dari kesalahan, atau memenuhi kebutuhan Anda. Kami tidak bertanggung jawab atas kerugian langsung, tidak langsung, 
                  atau konsekuensial yang timbul dari penggunaan platform ini.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Perubahan Syarat & Ketentuan</h2>
                <p className="text-slate-700 leading-relaxed">
                  Kami berhak untuk mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diberitahukan melalui platform atau email. 
                  Penggunaan platform setelah perubahan berarti Anda menyetujui syarat dan ketentuan yang baru.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">11. Kontak & Bantuan</h2>
                <p className="text-slate-700 leading-relaxed mb-3">
                  Jika Anda memiliki pertanyaan, keluhan, atau membutuhkan bantuan terkait platform Ngedate Yuk, 
                  silakan hubungi kami melalui:
                </p>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                  <p className="text-slate-800 font-semibold mb-2">Customer Service:</p>
                  <p className="text-slate-700">
                    <strong>WhatsApp:</strong> <a href="https://wa.me/6281317435345" target="_blank" rel="noopener noreferrer" className="text-rose-600 hover:text-rose-700 underline">+62 813-1743-5345</a>
                  </p>
                  <p className="text-slate-700 mt-2">
                    <strong>Email:</strong> support@ngedateyuk.com
                  </p>
                  <p className="text-slate-600 text-sm mt-3">
                    Jam operasional: Senin - Minggu, 09:00 - 21:00 WIB
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-slate-800 mb-4">12. Hukum yang Berlaku</h2>
                <p className="text-slate-700 leading-relaxed">
                  Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. 
                  Setiap sengketa yang timbul akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
                </p>
              </section>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 text-center">
                  Dengan menggunakan platform Ngedate Yuk, Anda telah membaca, memahami, dan menyetujui semua syarat dan ketentuan di atas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
