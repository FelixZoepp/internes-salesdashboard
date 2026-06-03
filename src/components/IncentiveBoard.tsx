'use client';

interface Incentive {
  id: string;
  title: string;
  description: string;
  emoji: string;
  endDate: string;
  progress: Array<{
    opener: { displayName: string; avatarEmoji: string };
    currentValue: number;
    targetValue: number;
    isCompleted: boolean;
  }>;
}

export default function IncentiveBoard({ incentives }: { incentives: Incentive[] }) {
  if (incentives.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        <div className="text-6xl mb-4">🏆</div>
        <div className="text-xl">Keine aktiven Incentives</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {incentives.map(inc => (
        <div key={inc.id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-5xl">{inc.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white">{inc.title}</h3>
              <p className="text-gray-400">{inc.description}</p>
              <p className="text-sm text-gray-500">Bis {new Date(inc.endDate).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
          <div className="space-y-2">
            {inc.progress.map((p, i) => {
              const pct = Math.min((p.currentValue / p.targetValue) * 100, 100);
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xl">{p.opener.avatarEmoji}</span>
                  <span className="text-sm text-gray-300 w-24 truncate">{p.opener.displayName}</span>
                  <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${p.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white w-16 text-right">
                    {p.currentValue}/{p.targetValue} {p.isCompleted && '✅'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
