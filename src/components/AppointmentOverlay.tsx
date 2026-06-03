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
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(11, 19, 34, 0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center animate-bounce-in">
        <div className="text-9xl mb-6">{emoji}</div>
        <div className="text-6xl font-black mb-4" style={{ color: 'var(--za-fg)', textShadow: '0 0 40px rgba(61, 123, 198, 0.5)' }}>
          TERMIN GEBUCHT!
        </div>
        <div className="text-4xl font-bold" style={{ color: 'var(--za-green)' }}>{openerName}</div>
        <div className="mt-8 flex justify-center gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="text-5xl animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}>🎉</div>
          ))}
        </div>
        {/* Glow ring */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(61, 123, 198, 0.15) 0%, transparent 60%)',
          }}
        />
      </div>
    </div>
  );
}
