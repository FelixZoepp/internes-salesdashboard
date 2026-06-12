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
  streak: number;
  earnedIncentives: Array<{ id: string; emoji: string; title: string; bonus: string }>;
}

export default function LeaderboardView({ openers }: { openers: OpenerStats[] }) {
  const ranked = [...openers]
    .map(o => ({ ...o, score: o.appointments * 50 + o.dials }))
    .sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...ranked.map(o => o.score), 1);

  const medals = ['👑', '🥈', '🥉'];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <span className="text-5xl">🏆</span>
          <div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--za-gold)' }}>
              LEADERBOARD
            </h2>
            <p className="text-lg" style={{ color: 'var(--za-fg-3)' }}>
              1 Setting = 50 Pkt &middot; 1 Protokoll = 1 Pkt
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="dot-live" />
          <span className="text-lg font-bold" style={{ color: 'var(--za-green)' }}>LIVE</span>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center gap-4 px-4 mb-3" style={{ color: 'var(--za-fg-4)' }}>
        <div className="w-14 flex-shrink-0" />
        <div className="w-14 flex-shrink-0" />
        <div className="flex-1 text-sm font-bold uppercase tracking-widest">Name</div>
        <div className="w-28 text-center text-sm font-bold uppercase tracking-widest">Protokolle</div>
        <div className="w-28 text-center text-sm font-bold uppercase tracking-widest">Settings</div>
        <div className="w-28 text-center text-sm font-bold uppercase tracking-widest">Streak</div>
        <div className="w-36 text-right text-sm font-bold uppercase tracking-widest">Punkte</div>
      </div>

      {/* Rows */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        {ranked.map((opener, idx) => {
          const isFirst = idx === 0 && opener.score > 0;
          const pct = maxScore > 0 ? (opener.score / maxScore) * 100 : 0;
          const posColor = idx === 0 ? 'var(--za-gold)' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--za-fg-4)';
          const streakFlames = opener.streak >= 10 ? '🔥🔥🔥' : opener.streak >= 5 ? '🔥🔥' : opener.streak >= 1 ? '🔥' : '❄️';

          return (
            <div
              key={opener.email}
              className="animate-fade-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="flex items-center gap-4 mb-2">
                {/* Position */}
                <div className="w-14 text-center flex-shrink-0">
                  <span className="text-3xl font-black" style={{ color: posColor }}>
                    {idx < 3 ? medals[idx] : `${idx + 1}.`}
                  </span>
                </div>
                {/* Avatar */}
                <span className="text-4xl flex-shrink-0 w-14 text-center">{opener.avatarEmoji}</span>
                {/* Name + Team */}
                <div className="flex-1 flex items-center gap-3">
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
                    <span key={inc.id} className="text-xl">{inc.emoji}</span>
                  ))}
                </div>
                {/* Anwahlen */}
                <div className="w-28 text-center">
                  <span className="text-3xl font-black" style={{ color: 'var(--za-blue-3)' }}>{opener.dials}</span>
                </div>
                {/* Settings */}
                <div className="w-28 text-center">
                  <span className="text-3xl font-black" style={{ color: 'var(--za-green)' }}>{opener.appointments}</span>
                </div>
                {/* Streak */}
                <div className="w-28 text-center">
                  <span className="text-2xl">{streakFlames}</span>
                  <span className="text-lg font-bold ml-1" style={{ color: opener.streak > 0 ? 'var(--za-fg)' : 'var(--za-fg-4)' }}>{opener.streak}</span>
                </div>
                {/* Points */}
                <div className="w-36 text-right">
                  <span className={`text-4xl font-black ${isFirst ? 'animate-pulse-glow' : ''}`} style={{
                    color: isFirst ? 'var(--za-gold)' : 'var(--za-fg)',
                    textShadow: isFirst ? '0 0 20px rgba(233, 203, 139, 0.4)' : 'none',
                  }}>
                    {opener.score}
                  </span>
                  <div className="text-xs font-semibold" style={{ color: 'var(--za-fg-4)' }}>Punkte</div>
                </div>
              </div>

              {/* Score bar */}
              <div className="flex items-center gap-4">
                <div className="w-14 flex-shrink-0" />
                <div className="w-14 flex-shrink-0" />
                <div className="flex-1 relative h-8 rounded-xl overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.6)', border: '1px solid var(--za-panel-border)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(pct, opener.score > 0 ? 3 : 0)}%`,
                      background: isFirst
                        ? 'linear-gradient(90deg, rgba(233, 203, 139, 0.1), rgba(233, 203, 139, 0.6), var(--za-gold))'
                        : 'linear-gradient(90deg, rgba(92, 158, 232, 0.1), rgba(92, 158, 232, 0.5), var(--za-blue-3))',
                      boxShadow: isFirst ? '0 0 20px rgba(233, 203, 139, 0.2)' : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
