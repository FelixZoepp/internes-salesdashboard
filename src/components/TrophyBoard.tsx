'use client';

interface EarnedIncentive {
  id: string;
  emoji: string;
  title: string;
  bonus: string;
}

interface OpenerWithIncentives {
  displayName: string;
  avatarEmoji: string;
  appointments: number;
  dials: number;
  points: number;
  team: string;
  earnedIncentives: EarnedIncentive[];
}

interface IncentiveRule {
  emoji: string;
  title: string;
  description: string;
  bonus: string;
}

const INCENTIVE_RULES: IncentiveRule[] = [
  { emoji: '🌅', title: 'Early Bird Setting', description: 'Erstes Setting vor 10:00 Uhr', bonus: '+10 €' },
  { emoji: '🏆', title: '5er Pack', description: '5 Settings an einem Tag', bonus: '+25 €' },
  { emoji: '💎', title: 'Setting-Maschine', description: '10 Settings an einem Tag', bonus: '+75 €' },
];

function parseBonusValue(bonus: string): number {
  const match = bonus.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

export default function TrophyBoard({ openers }: { openers: OpenerWithIncentives[] }) {
  const activeOpeners = openers.filter(o => o.dials > 0 || o.appointments > 0);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="text-center animate-fade-up">
        <h2 className="text-4xl font-black" style={{ color: 'var(--za-fg)' }}>
          🏆 TAGES-INCENTIVES 🏆
        </h2>
        <p className="text-lg mt-1" style={{ color: 'var(--za-fg-3)' }}>Bonusse die heute verdient werden können</p>
      </div>

      {/* Incentive Rules */}
      <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
        {INCENTIVE_RULES.map(rule => (
          <div key={rule.title} className="panel-glass rounded-xl p-5 text-center">
            <div className="text-5xl mb-3">{rule.emoji}</div>
            <div className="text-lg font-bold" style={{ color: 'var(--za-fg)' }}>{rule.title}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--za-fg-3)' }}>{rule.description}</div>
            <div className="text-xl font-black mt-3" style={{ color: 'var(--za-green)' }}>{rule.bonus}</div>
          </div>
        ))}
      </div>

      {/* Who earned what today */}
      <div className="flex-1 animate-fade-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--za-fg-2)' }}>Heute verdient:</h3>
        <div className="space-y-3">
          {activeOpeners.map(opener => {
            const todayBonus = opener.earnedIncentives.reduce((sum, inc) => sum + parseBonusValue(inc.bonus), 0);
            return (
              <div key={opener.displayName} className="panel-glass rounded-xl p-4 flex items-center gap-4">
                <span className="text-4xl">{opener.avatarEmoji}</span>
                <div className="flex-1">
                  <div className="text-lg font-bold" style={{ color: 'var(--za-fg)' }}>{opener.displayName}</div>
                  <div className="text-sm" style={{ color: 'var(--za-fg-3)' }}>
                    {opener.appointments} Settings heute
                  </div>
                </div>
                <div className="flex gap-2">
                  {opener.earnedIncentives.length > 0 ? (
                    opener.earnedIncentives.map(inc => (
                      <div key={inc.id} className="text-center px-3 py-1 rounded-lg" style={{ background: 'rgba(127, 194, 155, 0.1)', border: '1px solid rgba(127, 194, 155, 0.2)' }}>
                        <div className="text-2xl">{inc.emoji}</div>
                        <div className="text-xs font-bold" style={{ color: 'var(--za-green)' }}>{inc.bonus}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm px-3 py-2 rounded-lg" style={{ color: 'var(--za-fg-4)', background: 'var(--za-bg-2)' }}>
                      Noch keine Trophäe
                    </div>
                  )}
                </div>
                {todayBonus > 0 && (
                  <div className="text-right ml-2">
                    <div className="text-2xl font-black" style={{ color: 'var(--za-green)' }}>+{todayBonus} €</div>
                    <div className="text-xs" style={{ color: 'var(--za-fg-4)' }}>Bonus heute</div>
                  </div>
                )}
              </div>
            );
          })}
          {activeOpeners.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--za-fg-4)' }}>
              <div className="text-5xl mb-3">⏳</div>
              <div className="text-lg">Noch keine Aktivität heute</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
