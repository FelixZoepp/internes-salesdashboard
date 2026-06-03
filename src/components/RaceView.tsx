'use client';

import { useEffect, useRef, useState } from 'react';

interface OpenerStats {
  email: string;
  name: string;
  displayName: string;
  dials: number;
  appointments: number;
  points: number;
  rank: number;
  avatarEmoji: string;
  team: string;
  earnedIncentives: Array<{ id: string; emoji: string; title: string; bonus: string }>;
}

export default function RaceView({ openers, metric = 'dials' }: { openers: OpenerStats[]; metric?: 'dials' | 'appointments' | 'points' }) {
  const sorted = [...openers].sort((a, b) => b[metric] - a[metric]);
  const maxVal = Math.max(...sorted.map(o => o[metric]), 1);
  const prevRanks = useRef<Map<string, number>>(new Map());
  const [overtakes, setOvertakes] = useState<Set<string>>(new Set());

  const metricLabel = metric === 'dials' ? 'PROTOKOLL' : metric === 'appointments' ? 'SETTING' : 'PUNKTE';
  const metricColor = metric === 'dials' ? 'var(--za-blue-3)' : metric === 'appointments' ? 'var(--za-green)' : 'var(--za-gold)';
  const teamColor = (team: string) => team === 'felix' ? 'var(--za-blue-3)' : 'var(--za-gold)';

  // Detect overtakes
  useEffect(() => {
    const newOvertakes = new Set<string>();
    sorted.forEach((opener, idx) => {
      const prevRank = prevRanks.current.get(opener.email);
      if (prevRank !== undefined && idx < prevRank) {
        newOvertakes.add(opener.email);
      }
    });

    if (newOvertakes.size > 0) {
      setOvertakes(newOvertakes);
      const timer = setTimeout(() => setOvertakes(new Set()), 3000);
      return () => clearTimeout(timer);
    }

    prevRanks.current = new Map(sorted.map((o, i) => [o.email, i]));
  }, [sorted]);

  // Update prevRanks after overtake animation
  useEffect(() => {
    prevRanks.current = new Map(sorted.map((o, i) => [o.email, i]));
  }, [sorted]);

  return (
    <div className="h-full flex flex-col">
      {/* Race header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🏁</span>
          <div>
            <h2 className="text-4xl font-black" style={{ color: metricColor }}>
              {metricLabel}-RENNEN
            </h2>
            <p className="text-lg" style={{ color: 'var(--za-fg-3)' }}>Wer führt heute?</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="text-lg font-bold" style={{ color: 'var(--za-green)' }}>LIVE</span>
        </div>
      </div>

      {/* Race tracks */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        {sorted.map((opener, idx) => {
          const val = opener[metric];
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isFirst = idx === 0 && val > 0;
          const justOvertook = overtakes.has(opener.email);
          const color = teamColor(opener.team);

          return (
            <div
              key={opener.email}
              className={`animate-fade-up ${justOvertook ? 'overtake-flash' : ''}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Name row */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 text-center flex-shrink-0">
                  <span className="text-3xl font-black" style={{ color: isFirst ? 'var(--za-gold)' : 'var(--za-fg-4)' }}>
                    {isFirst ? '👑' : `${idx + 1}.`}
                  </span>
                </div>
                <span className="text-4xl flex-shrink-0">{opener.avatarEmoji}</span>
                <span className="text-2xl font-black" style={{ color: 'var(--za-fg)' }}>
                  {opener.displayName}
                </span>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{
                  background: opener.team === 'felix' ? 'rgba(92, 158, 232, 0.15)' : 'rgba(233, 203, 139, 0.15)',
                  color: opener.team === 'felix' ? 'var(--za-blue-4)' : 'var(--za-gold)',
                  border: `1px solid ${opener.team === 'felix' ? 'rgba(92, 158, 232, 0.3)' : 'rgba(233, 203, 139, 0.3)'}`,
                }}>
                  {opener.team === 'felix' ? 'Team Felix' : 'Team Hendrik'}
                </span>
                {opener.earnedIncentives.map(inc => (
                  <span key={inc.id} className="text-2xl">{inc.emoji}</span>
                ))}
                {/* Overtake badge */}
                {justOvertook && (
                  <span className="overtake-badge text-base font-black px-3 py-1 rounded-full" style={{
                    background: 'rgba(233, 203, 139, 0.2)',
                    color: 'var(--za-gold)',
                    border: '1px solid var(--za-gold)',
                  }}>
                    ÜBERHOLT!
                  </span>
                )}
              </div>

              {/* Bar row */}
              <div className="flex items-center gap-4">
                <div className="w-14 flex-shrink-0" />
                <div className="flex-1 relative h-14 rounded-xl overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.6)', border: '1px solid var(--za-panel-border)' }}>
                  {/* Track bar */}
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      background: isFirst
                        ? `linear-gradient(90deg, ${color}20, ${color}90, ${color})`
                        : `linear-gradient(90deg, ${color}10, ${color}60, ${color}90)`,
                      boxShadow: isFirst ? `0 0 30px ${color}30` : 'none',
                    }}
                  />
                  {/* Rocket at the tip of the bar */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
                    style={{ left: `calc(${Math.max(pct, 3)}% - 28px)` }}
                  >
                    <span className={`text-3xl ${isFirst ? 'rocket-lead' : ''}`} style={{ filter: isFirst ? `drop-shadow(0 0 8px ${color})` : 'none' }}>
                      🚀
                    </span>
                  </div>
                  {/* Flame trail for leader */}
                  {isFirst && pct > 10 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 flame-trail"
                      style={{ left: `calc(${Math.max(pct, 3)}% - 60px)` }}
                    >
                      <span className="text-2xl">🔥</span>
                    </div>
                  )}
                </div>
                {/* Value */}
                <div className="w-28 text-right flex-shrink-0">
                  <span className={`text-4xl font-black ${justOvertook ? 'overtake-value' : ''}`} style={{ color }}>
                    {val}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
