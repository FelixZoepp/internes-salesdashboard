'use client';

interface OpenerStats {
  email: string;
  name: string;
  displayName: string;
  dials: number;
  conversations: number;
  appointments: number;
  points: number;
  rank: number;
  level: string;
  levelColor: string;
  streak: number;
  badges: string[];
  avatarEmoji: string;
}

export default function Leaderboard({ openers, sortBy = 'points' }: { openers: OpenerStats[]; sortBy?: string }) {
  const sorted = [...openers].sort((a, b) => {
    if (sortBy === 'dials') return b.dials - a.dials;
    if (sortBy === 'conversations') return b.conversations - a.conversations;
    if (sortBy === 'appointments') return b.appointments - a.appointments;
    return b.points - a.points;
  });

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'border-[var(--za-gold-2)] bg-gradient-to-r from-[rgba(233,203,139,0.12)] to-transparent';
    if (rank === 2) return 'border-[var(--za-blue-4)] bg-gradient-to-r from-[rgba(143,182,220,0.08)] to-transparent';
    if (rank === 3) return 'border-[var(--za-blue-2)] bg-gradient-to-r from-[rgba(61,123,198,0.06)] to-transparent';
    return 'border-[var(--za-panel-border)] bg-[var(--za-panel)]';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-3">
      {sorted.map((opener, idx) => {
        const rank = idx + 1;
        return (
          <div
            key={opener.email}
            className={`panel-glass flex items-center gap-4 p-5 rounded-2xl border ${getRankStyle(rank)} transition-all duration-500 animate-fade-up`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Rank */}
            <div className="text-3xl font-bold w-16 text-center flex-shrink-0">
              {getRankIcon(rank)}
            </div>

            {/* Avatar */}
            <div className="text-5xl flex-shrink-0">{opener.avatarEmoji}</div>

            {/* Name & Level */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold truncate" style={{ color: 'var(--za-fg)' }}>
                  {opener.displayName || opener.name}
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
                  style={{ backgroundColor: opener.levelColor + '25', color: opener.levelColor, border: `1px solid ${opener.levelColor}40` }}
                >
                  {opener.level}
                </span>
                {opener.streak > 0 && (
                  <span className="text-base font-semibold" style={{ color: 'var(--za-gold)' }}>
                    🔥 {opener.streak}
                  </span>
                )}
              </div>
              {opener.badges.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {opener.badges.slice(0, 5).map((badge, i) => (
                    <span key={i} className="text-sm">{badge}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-8 text-center flex-shrink-0">
              <div>
                <div className="text-3xl font-black" style={{ color: 'var(--za-blue-3)' }}>{opener.dials}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Dials</div>
              </div>
              <div>
                <div className="text-3xl font-black" style={{ color: 'var(--za-green)' }}>{opener.conversations}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Gespräche</div>
              </div>
              <div>
                <div className="text-3xl font-black" style={{ color: 'var(--za-blue-5)' }}>{opener.appointments}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Termine</div>
              </div>
              <div>
                <div className="text-4xl font-black" style={{ color: 'var(--za-gold)' }}>{opener.points}</div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Punkte</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
