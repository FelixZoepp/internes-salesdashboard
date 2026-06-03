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
        <span className="text-lg font-semibold text-gray-300">{label}</span>
        <span className={`text-3xl font-black ${isComplete ? 'text-green-400' : 'text-white'}`}>
          {current}/{goal} {isComplete && '✅'}
        </span>
      </div>
      <div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-green-500 to-emerald-400'
              : percent > 70
              ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
              : 'bg-gradient-to-r from-blue-600 to-cyan-400'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
