import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ngedate Yuk - Mainkan Game Bersama Pasangan Jarak Jauh",
  description: "Platform gaming untuk pasangan jarak jauh. Mainkan game turn-based secara real-time bersama pasangan Anda. Tic Tac Toe, Connect 4, Dots & Boxes, dan Sea Battle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
