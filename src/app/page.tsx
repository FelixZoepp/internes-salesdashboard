'use client';

import { useState, useEffect, useCallback } from 'react';
import Leaderboard from '@/components/Leaderboard';
import TeamGoalBar from '@/components/TeamGoalBar';
import EventTicker from '@/components/EventTicker';
import AppointmentOverlay from '@/components/AppointmentOverlay';
import SoundManager from '@/components/SoundManager';
import RaceView from '@/components/RaceView';
import TeamBattle from '@/components/TeamBattle';

interface DashboardData {
  openers: Array<{
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
    team: string;
  }>;
  teamStats: {
    totalDials: number;
    totalConversations: number;
    totalAppointments: number;
    totalPoints: number;
    dailyGoal: number;
    weeklyGoal: number;
    weeklyAppointments: number;
    teams?: {
      felix: { name: string; dials: number; appointments: number; points: number };
      hendrik: { name: string; dials: number; appointments: number; points: number };
    };
  };
  events: Array<{ type: string; message: string; timestamp: number; openerName: string }>;
  timestamp: number;
}

type ViewMode = 'leaderboard' | 'team-battle' | 'race-dials' | 'race-appointments';

const VIEW_LABELS: Record<ViewMode, string> = {
  'leaderboard': '🏅 Ranking',
  'team-battle': '⚔️ Team Battle',
  'race-dials': '📞 Protokoll-Rennen',
  'race-appointments': '📅 Setting-Rennen',
};

const VIEWS: ViewMode[] = ['leaderboard', 'team-battle', 'race-dials', 'race-appointments'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('points');
  const [viewMode, setViewMode] = useState<ViewMode>('leaderboard');
  const [autoRotate, setAutoRotate] = useState(true);
  const [overlay, setOverlay] = useState<{ name: string; emoji: string } | null>(null);
  const [allEvents, setAllEvents] = useState<Array<{ type: string; message: string; timestamp: number; openerName: string }>>([]);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('API Error');
      const json: DashboardData = await res.json();
      setData(json);
      setError(null);

      if (json.events.length > 0) {
        const appointmentEvent = json.events.find(e => e.type === 'appointment');
        if (appointmentEvent) {
          const opener = json.openers.find(o => o.displayName === appointmentEvent.openerName || o.name === appointmentEvent.openerName);
          setOverlay({ name: appointmentEvent.openerName, emoji: opener?.avatarEmoji || '🎯' });
        }
        setAllEvents(prev => [...json.events, ...prev].slice(0, 50));
      }
    } catch {
      setError('Dashboard konnte nicht geladen werden');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }));
      setDateStr(now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' }));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  // Auto-rotation between views
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setViewMode(prev => {
        const idx = VIEWS.indexOf(prev);
        return VIEWS[(idx + 1) % VIEWS.length];
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  // Panel hover glow
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const panel = (e.target as HTMLElement).closest('.panel-glass');
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      (panel as HTMLElement).style.setProperty('--mx', `${e.clientX - r.left}px`);
      (panel as HTMLElement).style.setProperty('--my', `${e.clientY - r.top}px`);
    };
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <div className="aurora" aria-hidden="true"><div className="blob1" /><div className="blob2" /><div className="blob3" /></div>
        <div className="text-center relative z-10">
          <div className="text-7xl animate-pulse mb-6">📊</div>
          <div className="text-2xl font-semibold" style={{ color: 'var(--za-fg-2)' }}>Dashboard lädt...</div>
          {error && <div className="mt-4" style={{ color: 'var(--za-red)' }}>{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Aurora */}
      <div className="aurora" aria-hidden="true">
        <div className="blob1" /><div className="blob2" /><div className="blob3" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-4" style={{ background: 'rgba(11, 19, 34, 0.85)', borderBottom: '1px solid var(--za-panel-border)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="dot-live" />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--za-fg-3)' }}>Live</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--za-fg)' }}>
              SALES ARENA
            </h1>
            <p className="text-sm" style={{ color: 'var(--za-fg-3)' }}>{dateStr}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* View buttons */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
              {VIEWS.map(view => (
                <button
                  key={view}
                  onClick={() => { setViewMode(view); setAutoRotate(false); }}
                  className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    background: viewMode === view ? 'var(--za-blue-1)' : 'transparent',
                    color: viewMode === view ? 'var(--za-fg)' : 'var(--za-fg-4)',
                  }}
                >
                  {VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: autoRotate ? 'rgba(127, 194, 155, 0.15)' : 'var(--za-bg-2)',
                color: autoRotate ? 'var(--za-green)' : 'var(--za-fg-4)',
                border: `1px solid ${autoRotate ? 'rgba(127, 194, 155, 0.3)' : 'var(--za-panel-border)'}`,
              }}
            >
              {autoRotate ? '🔄 Auto' : '⏸ Auto'}
            </button>

            <div className="text-4xl font-black" style={{ color: 'var(--za-fg)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          </div>
        </div>

        {/* Team Goals */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <TeamGoalBar current={data.teamStats.totalAppointments} goal={data.teamStats.dailyGoal} label="📅 Tagesziel Termine" />
          <TeamGoalBar current={data.teamStats.weeklyAppointments} goal={data.teamStats.weeklyGoal} label="📊 Wochenziel Termine" />
        </div>

        {/* KPI Tiles */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          {[
            { label: 'Team Dials', value: data.teamStats.totalDials, color: 'var(--za-blue-3)' },
            { label: 'Gespräche', value: data.teamStats.totalConversations, color: 'var(--za-green)' },
            { label: 'Termine', value: data.teamStats.totalAppointments, color: 'var(--za-blue-5)' },
            { label: 'Team Punkte', value: data.teamStats.totalPoints, color: 'var(--za-gold)' },
          ].map(kpi => (
            <div
              key={kpi.label}
              className="panel-glass rounded-xl px-5 py-3 text-center"
            >
              <div className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-8 overflow-auto">
        {viewMode === 'leaderboard' && (
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--za-fg)' }}>Leaderboard</h2>
              <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
                {['points', 'dials', 'conversations', 'appointments'].map(key => (
                  <button
                    key={key}
                    onClick={() => setSortBy(key)}
                    className="px-3 py-1 rounded-md text-sm font-semibold transition-all"
                    style={{
                      background: sortBy === key ? 'var(--za-blue-1)' : 'transparent',
                      color: sortBy === key ? 'var(--za-fg)' : 'var(--za-fg-4)',
                    }}
                  >
                    {key === 'points' ? 'Punkte' : key === 'dials' ? 'Dials' : key === 'conversations' ? 'Gespräche' : 'Termine'}
                  </button>
                ))}
              </div>
            </div>
            <Leaderboard openers={data.openers} sortBy={sortBy} />
          </div>
        )}
        {viewMode === 'race-dials' && (
          <div className="animate-fade-up h-full">
            <RaceView openers={data.openers} metric="dials" />
          </div>
        )}
        {viewMode === 'race-appointments' && (
          <div className="animate-fade-up h-full">
            <RaceView openers={data.openers} metric="appointments" />
          </div>
        )}
        {viewMode === 'team-battle' && data.teamStats.teams && (
          <div className="animate-fade-up h-full">
            <TeamBattle teams={data.teamStats.teams} openers={data.openers} />
          </div>
        )}
      </main>

      {/* Ticker */}
      <div className="relative z-10">
        <EventTicker events={allEvents} />
      </div>

      {/* Sound Manager */}
      <SoundManager events={allEvents} />

      {/* Appointment Overlay */}
      {overlay && (
        <AppointmentOverlay
          openerName={overlay.name}
          emoji={overlay.emoji}
          onComplete={() => setOverlay(null)}
        />
      )}

      {/* Error indicator */}
      {error && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(232, 116, 103, 0.15)', border: '1px solid rgba(232, 116, 103, 0.3)', color: 'var(--za-red)' }}>
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
