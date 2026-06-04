'use client';

import { useEffect, useState } from 'react';

interface ProvisionData {
  email: string;
  name: string;
  emoji: string;
  team: string;
  weekBonus: number;
  monthBonus: number;
  todayBonus: number;
  weekSettings: number;
  monthSettings: number;
  todaySettings: number;
  weekDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }>;
  monthDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }>;
  todayDetails: Array<{ date: string; appointments: number; bonus: number; incentives: string[] }>;
}

interface ProvisionsResponse {
  provisions: ProvisionData[];
  totals: { weekBonus: number; monthBonus: number; todayBonus: number };
}

const INCENTIVE_EMOJIS: Record<string, string> = {
  early_bird_setting: '🌅',
  five_settings: '🏆',
  ten_settings: '💎',
};

export default function ProvisionsView() {
  const [data, setData] = useState<ProvisionsResponse | null>(null);
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    fetch('/api/provisions')
      .then(r => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-2xl" style={{ color: 'var(--za-fg-3)' }}>Provisionen laden...</div>
      </div>
    );
  }

  const getBonus = (p: ProvisionData) => tab === 'today' ? p.todayBonus : tab === 'week' ? p.weekBonus : p.monthBonus;
  const getSettings = (p: ProvisionData) => tab === 'today' ? p.todaySettings : tab === 'week' ? p.weekSettings : p.monthSettings;
  const getDetails = (p: ProvisionData) => tab === 'today' ? p.todayDetails : tab === 'week' ? p.weekDetails : p.monthDetails;
  const totalBonus = tab === 'today' ? data.totals.todayBonus : tab === 'week' ? data.totals.weekBonus : data.totals.monthBonus;
  const maxBonus = Math.max(...data.provisions.map(getBonus), 1);
  const periodLabel = tab === 'today' ? 'heute' : tab === 'week' ? 'diese Woche' : 'dieser Monat';

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-4">
          <span className="text-5xl">💰</span>
          <div>
            <h2 className="text-4xl font-black" style={{ color: 'var(--za-green)' }}>PROVISIONEN</h2>
            <p className="text-lg" style={{ color: 'var(--za-fg-3)' }}>Verdiente Bonusse</p>
          </div>
        </div>

        {/* Today / Week / Month toggle */}
        <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
          {(['today', 'week', 'month'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-base font-bold transition-all"
              style={{
                background: tab === t ? 'var(--za-blue-1)' : 'transparent',
                color: tab === t ? 'var(--za-fg)' : 'var(--za-fg-4)',
              }}
            >
              {t === 'today' ? 'Heute' : t === 'week' ? 'Woche' : 'Monat'}
            </button>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="text-center animate-fade-up" style={{ animationDelay: '100ms' }}>
        <div className="text-6xl font-black" style={{ color: 'var(--za-green)' }}>
          €{totalBonus}
        </div>
        <div className="text-lg font-semibold" style={{ color: 'var(--za-fg-3)' }}>
          Gesamt {periodLabel}
        </div>
      </div>

      {/* Per opener */}
      <div className="flex-1 flex flex-col justify-center gap-5">
        {data.provisions.map((p, idx) => {
          const bonus = getBonus(p);
          const settings = getSettings(p);
          const details = getDetails(p);
          const pct = maxBonus > 0 ? (bonus / maxBonus) * 100 : 0;

          return (
            <div key={p.email} className="animate-fade-up" style={{ animationDelay: `${200 + idx * 80}ms` }}>
              {/* Name row */}
              <div className="flex items-center gap-4 mb-2">
                <span className="text-4xl">{p.emoji}</span>
                <span className="text-2xl font-black" style={{ color: 'var(--za-fg)' }}>{p.name}</span>
                <span className="text-sm font-semibold px-2 py-0.5 rounded-full" style={{
                  background: p.team === 'felix' ? 'rgba(92, 158, 232, 0.15)' : 'rgba(233, 203, 139, 0.15)',
                  color: p.team === 'felix' ? 'var(--za-blue-4)' : 'var(--za-gold)',
                }}>
                  {p.team === 'felix' ? 'Team Felix' : 'Team Hendrik'}
                </span>
                <span className="text-base" style={{ color: 'var(--za-fg-3)' }}>
                  {settings} Settings
                </span>
                <div className="flex gap-1">
                  {details.flatMap(d => d.incentives.map((inc, i) => (
                    <span key={`${d.date}-${i}`} className="text-lg">{INCENTIVE_EMOJIS[inc] || '🏆'}</span>
                  )))}
                </div>
              </div>

              {/* Bonus bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative h-12 rounded-xl overflow-hidden" style={{ background: 'rgba(16, 27, 46, 0.6)', border: '1px solid var(--za-panel-border)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-xl transition-all duration-1000 ease-out"
                    style={{
                      width: `${Math.max(pct, bonus > 0 ? 5 : 0)}%`,
                      background: bonus > 0
                        ? 'linear-gradient(90deg, rgba(127, 194, 155, 0.15), rgba(127, 194, 155, 0.8), var(--za-green))'
                        : 'transparent',
                      boxShadow: pct > 50 ? '0 0 20px rgba(127, 194, 155, 0.3)' : 'none',
                    }}
                  />
                </div>
                <div className="w-32 text-right flex-shrink-0">
                  <span className="text-4xl font-black" style={{ color: bonus > 0 ? 'var(--za-green)' : 'var(--za-fg-4)' }}>
                    €{bonus}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
