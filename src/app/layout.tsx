import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sales Gamification Dashboard',
  description: 'Kaltakquise-Opener Leaderboard & Gamification',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className={`${inter.className} min-h-screen bg-gray-950`}>{children}</body>
    </html>
  );
}
