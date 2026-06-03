'use client';

interface TeamData {
  name: string;
  dials: number;
  appointments: number;
  points: number;
}

interface OpenerStats {
  displayName: string;
  avatarEmoji: string;
  dials: number;
  appointments: number;
  points: number;
  team: string;
}

interface TeamBattleProps {
  teams: { felix: TeamData; hendrik: TeamData };
  openers: OpenerStats[];
}

export default function TeamBattle({ teams, openers }: TeamBattleProps) {
  const felixOpeners = openers.filter(o => o.team === 'felix');
  const hendrikOpeners = openers.filter(o => o.team === 'hendrik');

  const battles = [
    { label: 'Protokolle', key: 'dials' as const, color1: 'var(--za-blue-3)', color2: 'var(--za-gold)' },
    { label: 'Settings', key: 'appointments' as const, color1: 'var(--za-blue-3)', color2: 'var(--za-gold)' },
    { label: 'Punkte', key: 'points' as const, color1: 'var(--za-blue-3)', color2: 'var(--za-gold)' },
  ];

  return (
    <div className="h-full flex flex-col gap-8">
      {/* Title */}
      <div className="text-center animate-fade-up">
        <h2 className="text-4xl font-black" style={{ color: 'var(--za-fg)' }}>
          ⚔️ TEAM BATTLE ⚔️
        </h2>
        <p className="text-lg mt-1" style={{ color: 'var(--za-fg-3)' }}>Wer dominiert heute?</p>
      </div>

      {/* Team Headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="text-center">
          <div className="text-5xl mb-2">🔵</div>
          <div className="text-2xl font-black" style={{ color: 'var(--za-blue-3)' }}>Team Felix</div>
          <div className="flex justify-center gap-2 mt-2">
            {felixOpeners.map(o => (
              <div key={o.displayName} className="text-center">
                <div className="text-2xl">{o.avatarEmoji}</div>
                <div className="text-xs" style={{ color: 'var(--za-fg-3)' }}>{o.displayName}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-6xl font-black" style={{ color: 'var(--za-fg-4)' }}>VS</div>

        <div className="text-center">
          <div className="text-5xl mb-2">🟡</div>
          <div className="text-2xl font-black" style={{ color: 'var(--za-gold)' }}>Team Hendrik</div>
          <div className="flex justify-center gap-2 mt-2">
            {hendrikOpeners.map(o => (
              <div key={o.displayName} className="text-center">
                <div className="text-2xl">{o.avatarEmoji}</div>
                <div className="text-xs" style={{ color: 'var(--za-fg-3)' }}>{o.displayName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Battle Bars */}
      <div className="flex-1 flex flex-col justify-center gap-6">
        {battles.map((battle, idx) => {
          const val1 = teams.felix[battle.key];
          const val2 = teams.hendrik[battle.key];
          const total = val1 + val2 || 1;
          const pct1 = (val1 / total) * 100;
          const pct2 = (val2 / total) * 100;
          const leading = val1 > val2 ? 'felix' : val2 > val1 ? 'hendrik' : 'tie';

          return (
            <div key={battle.key} className="animate-fade-up" style={{ animationDelay: `${200 + idx * 100}ms` }}>
              <div className="text-center text-lg font-bold mb-2" style={{ color: 'var(--za-fg-2)' }}>
                {battle.label}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                {/* Felix value */}
                <div className="text-right">
                  <span className="text-4xl font-black" style={{ color: leading === 'felix' ? battle.color1 : 'var(--za-fg-3)' }}>
                    {val1}
                  </span>
                </div>

                {/* Battle bar */}
                <div className="w-96 h-10 rounded-full overflow-hidden flex" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${pct1}%`,
                      background: `linear-gradient(90deg, ${battle.color1}40, ${battle.color1})`,
                      boxShadow: leading === 'felix' ? `0 0 15px ${battle.color1}40` : 'none',
                    }}
                  />
                  <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${pct2}%`,
                      background: `linear-gradient(90deg, ${battle.color2}, ${battle.color2}40)`,
                      boxShadow: leading === 'hendrik' ? `0 0 15px ${battle.color2}40` : 'none',
                    }}
                  />
                </div>

                {/* Hendrik value */}
                <div className="text-left">
                  <span className="text-4xl font-black" style={{ color: leading === 'hendrik' ? battle.color2 : 'var(--za-fg-3)' }}>
                    {val2}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Stats */}
      <div className="grid grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '500ms' }}>
        {/* Team Felix Members */}
        <div className="panel-glass rounded-xl p-4" style={{ borderColor: 'rgba(92, 158, 232, 0.2)' }}>
          {felixOpeners.map(o => (
            <div key={o.displayName} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{o.avatarEmoji}</span>
                <span className="font-bold" style={{ color: 'var(--za-fg)' }}>{o.displayName}</span>
              </div>
              <div className="flex gap-4 text-sm font-bold">
                <span style={{ color: 'var(--za-blue-3)' }}>{o.dials} P</span>
                <span style={{ color: 'var(--za-green)' }}>{o.appointments} S</span>
              </div>
            </div>
          ))}
        </div>

        {/* Team Hendrik Members */}
        <div className="panel-glass rounded-xl p-4" style={{ borderColor: 'rgba(233, 203, 139, 0.2)' }}>
          {hendrikOpeners.map(o => (
            <div key={o.displayName} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">{o.avatarEmoji}</span>
                <span className="font-bold" style={{ color: 'var(--za-fg)' }}>{o.displayName}</span>
              </div>
              <div className="flex gap-4 text-sm font-bold">
                <span style={{ color: 'var(--za-blue-3)' }}>{o.dials} P</span>
                <span style={{ color: 'var(--za-green)' }}>{o.appointments} S</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
