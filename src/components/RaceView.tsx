'use client';

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

  const metricLabel = metric === 'dials' ? 'PROTOKOLL' : metric === 'appointments' ? 'SETTING' : 'PUNKTE';
  const metricColor = metric === 'dials' ? 'var(--za-blue-3)' : metric === 'appointments' ? 'var(--za-green)' : 'var(--za-gold)';
  const teamColor = (team: string) => team === 'felix' ? 'var(--za-blue-3)' : 'var(--za-gold)';

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

      {/* Race tracks — 4 big lanes */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {sorted.map((opener, idx) => {
          const val = opener[metric];
          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          const isFirst = idx === 0 && val > 0;
          const color = teamColor(opener.team);

          return (
            <div key={opener.email} className="animate-fade-up" style={{ animationDelay: `${idx * 100}ms` }}>
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
                {/* Earned trophies */}
                {opener.earnedIncentives.map(inc => (
                  <span key={inc.id} className="text-2xl">{inc.emoji}</span>
                ))}
              </div>

              {/* Bar row */}
              <div className="flex items-center gap-4">
                <div className="w-14 flex-shrink-0" />
                <div className="flex-1 relative h-16 rounded-xl overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.6)', border: '1px solid var(--za-panel-border)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      background: isFirst
                        ? `linear-gradient(90deg, ${color}30, ${color})`
                        : `linear-gradient(90deg, ${color}15, ${color}90)`,
                      boxShadow: isFirst ? `0 0 30px ${color}30` : 'none',
                    }}
                  />
                </div>
                {/* Value outside the bar */}
                <div className="w-28 text-right flex-shrink-0">
                  <span className="text-4xl font-black" style={{ color }}>{val}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
