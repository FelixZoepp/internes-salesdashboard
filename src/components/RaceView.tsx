'use client';

import { useEffect, useRef } from 'react';

interface OpenerStats {
  email: string;
  name: string;
  displayName: string;
  dials: number;
  conversations: number;
  appointments: number;
  points: number;
  rank: number;
  avatarEmoji: string;
}

export default function RaceView({ openers, metric = 'dials' }: { openers: OpenerStats[]; metric?: 'dials' | 'appointments' | 'points' }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const sorted = [...openers].sort((a, b) => {
    const av = a[metric];
    const bv = b[metric];
    return bv - av;
  });

  const maxVal = Math.max(...sorted.map(o => o[metric]), 1);

  const metricLabel = metric === 'dials' ? 'DIALS' : metric === 'appointments' ? 'TERMINE' : 'PUNKTE';
  const metricColor = metric === 'dials' ? 'var(--za-blue-3)' : metric === 'appointments' ? 'var(--za-green)' : 'var(--za-gold)';

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--mx', '50%');
      containerRef.current.style.setProperty('--my', '50%');
    }
  }, []);

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* Race header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏁</span>
          <div>
            <h2 className="text-3xl font-black" style={{ color: metricColor }}>
              {metricLabel}-RENNEN
            </h2>
            <p className="text-sm" style={{ color: 'var(--za-fg-3)' }}>Wer führt heute?</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="text-sm font-semibold" style={{ color: 'var(--za-green)' }}>LIVE</span>
        </div>
      </div>

      {/* Race tracks */}
      <div className="flex-1 flex flex-col justify-center gap-3">
        {sorted.map((opener, idx) => {
          const val = opener[metric];
          const pct = (val / maxVal) * 100;
          const isFirst = idx === 0;

          return (
            <div key={opener.email} className="flex items-center gap-4" style={{ animationDelay: `${idx * 80}ms` }}>
              {/* Position */}
              <div className="w-10 text-center flex-shrink-0">
                <span className={`text-2xl font-black ${isFirst ? '' : ''}`} style={{ color: isFirst ? 'var(--za-gold)' : 'var(--za-fg-3)' }}>
                  {idx === 0 ? '👑' : `${idx + 1}.`}
                </span>
              </div>

              {/* Avatar + Name */}
              <div className="w-36 flex items-center gap-2 flex-shrink-0">
                <span className="text-3xl">{opener.avatarEmoji}</span>
                <span className="text-lg font-bold truncate" style={{ color: 'var(--za-fg)' }}>
                  {opener.displayName || opener.name}
                </span>
              </div>

              {/* Race bar */}
              <div className="flex-1 relative h-12 rounded-lg overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.8)', border: '1px solid var(--za-panel-border)' }}>
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                  style={{
                    width: `${Math.max(pct, 5)}%`,
                    background: isFirst
                      ? `linear-gradient(90deg, ${metricColor}40, ${metricColor})`
                      : `linear-gradient(90deg, ${metricColor}20, ${metricColor}80)`,
                    boxShadow: isFirst ? `0 0 20px ${metricColor}40` : 'none',
                  }}
                >
                  {pct > 15 && (
                    <span className="text-lg font-black text-white drop-shadow-lg">
                      {val}
                    </span>
                  )}
                </div>
                {pct <= 15 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg font-black" style={{ color: 'var(--za-fg-2)' }}>
                    {val}
                  </span>
                )}

                {/* Finish line markers */}
                {isFirst && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">
                    🏁
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
