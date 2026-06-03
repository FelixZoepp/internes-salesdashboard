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
    if (rank === 1) return 'bg-gradient-to-r from-yellow-600/30 to-yellow-500/10 border-yellow-500/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-400/20 to-gray-300/5 border-gray-400/40';
    if (rank === 3) return 'bg-gradient-to-r from-amber-700/20 to-amber-600/5 border-amber-600/40';
    return 'bg-white/5 border-white/10';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="space-y-2">
      {sorted.map((opener, idx) => {
        const rank = idx + 1;
        return (
          <div
            key={opener.email}
            className={`flex items-center gap-4 p-4 rounded-xl border ${getRankStyle(rank)} transition-all duration-500`}
          >
            <div className="text-3xl font-bold w-16 text-center flex-shrink-0">
              {getRankIcon(rank)}
            </div>
            <div className="text-4xl flex-shrink-0">{opener.avatarEmoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-white truncate">{opener.displayName || opener.name}</span>
                <span className="text-sm px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: opener.levelColor + '30', color: opener.levelColor }}>
                  {opener.level}
                </span>
                {opener.streak > 0 && (
                  <span className="text-sm">🔥 {opener.streak}</span>
                )}
              </div>
              <div className="flex gap-1 mt-1">
                {opener.badges.slice(0, 5).map((badge, i) => (
                  <span key={i} className="text-xs">{badge}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-6 text-center flex-shrink-0">
              <div>
                <div className="text-2xl font-bold text-blue-400">{opener.dials}</div>
                <div className="text-xs text-gray-500 uppercase">Dials</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{opener.conversations}</div>
                <div className="text-xs text-gray-500 uppercase">Gespräche</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{opener.appointments}</div>
                <div className="text-xs text-gray-500 uppercase">Termine</div>
              </div>
              <div>
                <div className="text-3xl font-black text-yellow-400">{opener.points}</div>
                <div className="text-xs text-gray-500 uppercase">Punkte</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
