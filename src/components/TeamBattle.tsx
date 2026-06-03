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
  earnedIncentives: Array<{ id: string; emoji: string; title: string; bonus: string }>;
}

interface TeamBattleProps {
  teams: { felix: TeamData; hendrik: TeamData };
  openers: OpenerStats[];
}

function parseBonusValue(bonus: string): number {
  const match = bonus.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export default function TeamBattle({ teams, openers }: TeamBattleProps) {
  const felixOpeners = openers.filter(o => o.team === 'felix');
  const hendrikOpeners = openers.filter(o => o.team === 'hendrik');

  const battles = [
    { label: 'Protokolle', key: 'dials' as const },
    { label: 'Settings', key: 'appointments' as const },
    { label: 'Punkte', key: 'points' as const },
  ];

  // Max value across both teams for scaling
  const maxPerBattle = battles.map(b => Math.max(teams.felix[b.key], teams.hendrik[b.key], 1));

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Title */}
      <div className="text-center animate-fade-up">
        <h2 className="text-4xl font-black" style={{ color: 'var(--za-fg)' }}>
          ⚔️ TEAM BATTLE ⚔️
        </h2>
        <p className="text-lg mt-1" style={{ color: 'var(--za-fg-3)' }}>Wer dominiert heute?</p>
      </div>

      {/* Team Headers */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="text-center">
          <div className="text-4xl mb-1">🔵</div>
          <div className="text-2xl font-black" style={{ color: 'var(--za-blue-3)' }}>Team Felix</div>
          <div className="flex justify-center gap-3 mt-2">
            {felixOpeners.map(o => (
              <div key={o.displayName} className="text-center">
                <div className="text-3xl">{o.avatarEmoji}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--za-fg-2)' }}>{o.displayName}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-6xl font-black" style={{ color: 'var(--za-fg-4)' }}>VS</div>

        <div className="text-center">
          <div className="text-4xl mb-1">🟡</div>
          <div className="text-2xl font-black" style={{ color: 'var(--za-gold)' }}>Team Hendrik</div>
          <div className="flex justify-center gap-3 mt-2">
            {hendrikOpeners.map(o => (
              <div key={o.displayName} className="text-center">
                <div className="text-3xl">{o.avatarEmoji}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--za-fg-2)' }}>{o.displayName}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Battle Bars — links/rechts von der Mitte */}
      <div className="flex-1 flex flex-col justify-center gap-8">
        {battles.map((battle, idx) => {
          const val1 = teams.felix[battle.key];
          const val2 = teams.hendrik[battle.key];
          const maxVal = maxPerBattle[idx];
          const pct1 = (val1 / maxVal) * 50; // max 50% of bar width
          const pct2 = (val2 / maxVal) * 50;
          const leading = val1 > val2 ? 'felix' : val2 > val1 ? 'hendrik' : 'tie';

          return (
            <div key={battle.key} className="animate-fade-up" style={{ animationDelay: `${200 + idx * 100}ms` }}>
              <div className="text-center text-xl font-bold mb-3" style={{ color: 'var(--za-fg-2)' }}>
                {battle.label}
              </div>
              <div className="flex items-center gap-4">
                {/* Felix value */}
                <div className="w-24 text-right">
                  <span className="text-4xl font-black" style={{ color: leading === 'felix' ? 'var(--za-blue-3)' : 'var(--za-fg-4)' }}>
                    {val1}
                  </span>
                </div>

                {/* Center bar — Felix grows left, Hendrik grows right */}
                <div className="flex-1 flex h-12 rounded-xl overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.6)', border: '1px solid var(--za-panel-border)' }}>
                  {/* Left half — Felix bar grows from center to left */}
                  <div className="w-1/2 flex justify-end">
                    <div
                      className="h-full rounded-l-xl transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(pct1 * 2, 2)}%`,
                        background: leading === 'felix'
                          ? 'linear-gradient(270deg, var(--za-blue-3), var(--za-blue-3)60)'
                          : 'linear-gradient(270deg, var(--za-blue-3)80, var(--za-blue-3)30)',
                        boxShadow: leading === 'felix' ? '0 0 20px rgba(92, 158, 232, 0.3)' : 'none',
                      }}
                    />
                  </div>
                  {/* Divider */}
                  <div className="w-0.5 flex-shrink-0" style={{ background: 'var(--za-fg-4)' }} />
                  {/* Right half — Hendrik bar grows from center to right */}
                  <div className="w-1/2 flex justify-start">
                    <div
                      className="h-full rounded-r-xl transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max(pct2 * 2, 2)}%`,
                        background: leading === 'hendrik'
                          ? 'linear-gradient(90deg, var(--za-gold), var(--za-gold)60)'
                          : 'linear-gradient(90deg, var(--za-gold)80, var(--za-gold)30)',
                        boxShadow: leading === 'hendrik' ? '0 0 20px rgba(233, 203, 139, 0.3)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Hendrik value */}
                <div className="w-24 text-left">
                  <span className="text-4xl font-black" style={{ color: leading === 'hendrik' ? 'var(--za-gold)' : 'var(--za-fg-4)' }}>
                    {val2}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Provisionen */}
      <div className="grid grid-cols-2 gap-6 animate-fade-up" style={{ animationDelay: '500ms' }}>
        <div className="panel-glass rounded-xl p-4" style={{ borderColor: 'rgba(92, 158, 232, 0.2)' }}>
          {felixOpeners.map(o => {
            const bonus = o.earnedIncentives.reduce((s, inc) => s + parseBonusValue(inc.bonus), 0);
            return (
              <div key={o.displayName} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{o.avatarEmoji}</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--za-fg)' }}>{o.displayName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-bold" style={{ color: 'var(--za-blue-3)' }}>{o.dials} P</span>
                  <span className="text-base font-bold" style={{ color: 'var(--za-green)' }}>{o.appointments} S</span>
                  {bonus > 0 && (
                    <span className="text-base font-black px-2 py-0.5 rounded-lg" style={{ background: 'rgba(127, 194, 155, 0.15)', color: 'var(--za-green)' }}>+{bonus}€</span>
                  )}
                  {o.earnedIncentives.map(inc => (
                    <span key={inc.id} className="text-lg">{inc.emoji}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="panel-glass rounded-xl p-4" style={{ borderColor: 'rgba(233, 203, 139, 0.2)' }}>
          {hendrikOpeners.map(o => {
            const bonus = o.earnedIncentives.reduce((s, inc) => s + parseBonusValue(inc.bonus), 0);
            return (
              <div key={o.displayName} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{o.avatarEmoji}</span>
                  <span className="text-lg font-bold" style={{ color: 'var(--za-fg)' }}>{o.displayName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-bold" style={{ color: 'var(--za-blue-3)' }}>{o.dials} P</span>
                  <span className="text-base font-bold" style={{ color: 'var(--za-green)' }}>{o.appointments} S</span>
                  {bonus > 0 && (
                    <span className="text-base font-black px-2 py-0.5 rounded-lg" style={{ background: 'rgba(127, 194, 155, 0.15)', color: 'var(--za-green)' }}>+{bonus}€</span>
                  )}
                  {o.earnedIncentives.map(inc => (
                    <span key={inc.id} className="text-lg">{inc.emoji}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
