'use client';

import { useEffect, useState } from 'react';

interface DealWonOverlayProps {
  dealName: string;
  dealValue: number;
  closerName: string;
  onComplete: () => void;
}

const MONEY_EMOJIS = ['💰', '💵', '💶', '🤑', '💎', '🏆', '⭐'];

export default function DealWonOverlay({ dealName, dealValue, closerName, onComplete }: DealWonOverlayProps) {
  const [particles, setParticles] = useState<Array<{
    id: number; emoji: string; left: number; delay: number; duration: number; size: number;
  }>>([]);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Generate money rain particles
    const p = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      emoji: MONEY_EMOJIS[i % MONEY_EMOJIS.length],
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 2,
      size: 20 + Math.random() * 24,
    }));
    setParticles(p);

    const timer = setTimeout(() => {
      setClosing(true);
      setTimeout(onComplete, 600);
    }, 7000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const fmtValue = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(dealValue);

  return (
    <>
      {/* Money rain */}
      <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute"
            style={{
              left: `${p.left}%`,
              top: '-40px',
              fontSize: `${p.size}px`,
              animation: `money-fall ${p.duration}s linear ${p.delay}s forwards`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center cursor-pointer ${closing ? 'deal-overlay-out' : 'deal-overlay-in'}`}
        style={{ background: 'rgba(11, 19, 34, 0.92)', backdropFilter: 'blur(12px)' }}
        onClick={() => { setClosing(true); setTimeout(onComplete, 600); }}
      >
        {/* Glow ring */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(233, 203, 139, 0.2) 0%, transparent 50%)',
        }} />

        <div className="text-center animate-bounce-in relative z-10">
          <div className="text-9xl mb-4 deal-trophy-bounce">🏆</div>
          <div className="text-2xl font-black uppercase tracking-[6px] mb-2" style={{ color: 'var(--za-gold)' }}>
            Deal gewonnen!
          </div>
          <div className="text-7xl font-black mb-3 deal-value-glow" style={{
            background: 'linear-gradient(135deg, #E9CB8B, #D4A843, #E9CB8B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {fmtValue}
          </div>
          <div className="text-3xl font-bold mb-1" style={{ color: 'var(--za-fg)' }}>{dealName}</div>
          <div className="text-xl" style={{ color: 'var(--za-fg-3)' }}>
            Geschlossen von <span style={{ color: 'var(--za-green)', fontWeight: 700 }}>{closerName}</span>
          </div>
          <div className="mt-8 flex justify-center gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="text-4xl animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>
                {MONEY_EMOJIS[i]}
              </div>
            ))}
          </div>
          <div className="mt-6 text-sm" style={{ color: 'var(--za-fg-4)' }}>Klicken zum Schliessen</div>
        </div>
      </div>
    </>
  );
}
