'use client';

import { useEffect } from 'react';

interface AppointmentOverlayProps {
  openerName: string;
  emoji: string;
  onComplete: () => void;
}

export default function AppointmentOverlay({ openerName, emoji, onComplete }: AppointmentOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 5000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="text-center animate-bounce-in">
        <div className="text-9xl mb-6">{emoji}</div>
        <div className="text-5xl font-black text-white mb-4">TERMIN GEBUCHT!</div>
        <div className="text-4xl font-bold text-green-400">{openerName}</div>
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="text-4xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>🎉</div>
          ))}
        </div>
      </div>
    </div>
  );
}
