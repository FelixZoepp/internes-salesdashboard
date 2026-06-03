'use client';

interface TeamGoalBarProps {
  current: number;
  goal: number;
  label: string;
}

export default function TeamGoalBar({ current, goal, label }: TeamGoalBarProps) {
  const percent = Math.min((current / goal) * 100, 100);
  const isComplete = current >= goal;

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-2">
        <span className="text-base font-semibold" style={{ color: 'var(--za-fg-2)' }}>{label}</span>
        <span className={`text-2xl font-black ${isComplete ? '' : ''}`} style={{ color: isComplete ? 'var(--za-green)' : 'var(--za-fg)' }}>
          {current}/{goal} {isComplete && '✅'}
        </span>
      </div>
      <div className="w-full h-6 rounded-full overflow-hidden" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${percent}%`,
            background: isComplete
              ? 'linear-gradient(90deg, #4E8A6B, var(--za-green))'
              : percent > 70
              ? 'linear-gradient(90deg, var(--za-gold-2), var(--za-gold))'
              : 'linear-gradient(90deg, var(--za-blue-1), var(--za-blue-3))',
            boxShadow: isComplete
              ? '0 0 12px rgba(127, 194, 155, 0.4)'
              : '0 0 12px rgba(61, 123, 198, 0.3)',
          }}
        />
      </div>
    </div>
  );
}
