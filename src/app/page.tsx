'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import TeamGoalBar from '@/components/TeamGoalBar';
import EventTicker from '@/components/EventTicker';
import AppointmentOverlay from '@/components/AppointmentOverlay';
import SoundManager from '@/components/SoundManager';
import RaceView from '@/components/RaceView';
import TeamBattle from '@/components/TeamBattle';
import ProvisionsView from '@/components/ProvisionsView';
import LeaderboardView from '@/components/LeaderboardView';
import DealWonOverlay from '@/components/DealWonOverlay';

interface WonDeal {
  name: string;
  value: number;
  user: string;
  date: string;
}

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
    earnedIncentives: Array<{ id: string; emoji: string; title: string; bonus: string }>;
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
  wonDeals: WonDeal[];
  timestamp: number;
}

type ViewMode = 'race-dials' | 'race-appointments' | 'leaderboard' | 'team-battle' | 'provisions';
const VIEWS: ViewMode[] = ['race-dials', 'race-appointments', 'leaderboard', 'team-battle', 'provisions'];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('race-dials');
  const [overlay, setOverlay] = useState<{ name: string; emoji: string } | null>(null);
  const [dealOverlay, setDealOverlay] = useState<WonDeal | null>(null);
  const shownDealsRef = useRef<Set<string>>(new Set());
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

      // Check for new won deals
      if (json.wonDeals?.length > 0) {
        for (const deal of json.wonDeals) {
          const dealKey = `${deal.name}-${deal.value}-${deal.date}`;
          if (!shownDealsRef.current.has(dealKey)) {
            shownDealsRef.current.add(dealKey);
            setDealOverlay(deal);
            break;
          }
        }
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

  // Auto-rotate between 3 views
  useEffect(() => {
    const interval = setInterval(() => {
      setViewMode(prev => {
        const idx = VIEWS.indexOf(prev);
        return VIEWS[(idx + 1) % VIEWS.length];
      });
    }, 20000);
    return () => clearInterval(interval);
  }, []);

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

  const totalBonusToday = data.openers.reduce((sum, o) => {
    return sum + o.earnedIncentives.reduce((s, inc) => {
      const match = inc.bonus.match(/(\d+)/);
      return s + (match ? parseInt(match[1]) : 0);
    }, 0);
  }, 0);

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
            {/* View toggle */}
            <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--za-bg-2)', border: '1px solid var(--za-panel-border)' }}>
              {VIEWS.map(view => (
                <button
                  key={view}
                  onClick={() => setViewMode(view)}
                  className="px-4 py-2 rounded-lg text-base font-bold transition-all"
                  style={{
                    background: viewMode === view ? 'var(--za-blue-1)' : 'transparent',
                    color: viewMode === view ? 'var(--za-fg)' : 'var(--za-fg-4)',
                  }}
                >
                  {view === 'race-dials' ? '📞 Protokolle' : view === 'race-appointments' ? '📅 Settings' : view === 'leaderboard' ? '🏆 Punkte' : view === 'team-battle' ? '⚔️ Battle' : '💰 Provis'}
                </button>
              ))}
            </div>

            <div className="text-4xl font-black" style={{ color: 'var(--za-fg)', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          </div>
        </div>

        {/* KPI + Goals row */}
        <div className="mt-4 grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-end">
          <TeamGoalBar current={data.teamStats.totalAppointments} goal={data.teamStats.dailyGoal} label="📅 Tagesziel Settings" />
          <TeamGoalBar current={data.teamStats.weeklyAppointments} goal={data.teamStats.weeklyGoal} label="📊 Wochenziel Settings" />
          <div className="panel-glass rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black" style={{ color: 'var(--za-blue-3)' }}>{data.teamStats.totalDials}</div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Protokolle</div>
          </div>
          <div className="panel-glass rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black" style={{ color: 'var(--za-blue-5)' }}>{data.teamStats.totalAppointments}</div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Settings</div>
          </div>
          {totalBonusToday > 0 && (
            <div className="panel-glass rounded-xl px-6 py-3 text-center">
              <div className="text-3xl font-black" style={{ color: 'var(--za-green)' }}>€{totalBonusToday}</div>
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--za-fg-4)' }}>Bonus</div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-8">
        {viewMode === 'race-dials' && (
          <div className="animate-fade-up h-full" key="race-dials">
            <RaceView openers={data.openers} metric="dials" />
          </div>
        )}
        {viewMode === 'race-appointments' && (
          <div className="animate-fade-up h-full" key="race-appointments">
            <RaceView openers={data.openers} metric="appointments" />
          </div>
        )}
        {viewMode === 'leaderboard' && (
          <div className="animate-fade-up h-full" key="leaderboard">
            <LeaderboardView openers={data.openers} />
          </div>
        )}
        {viewMode === 'team-battle' && data.teamStats.teams && (
          <div className="animate-fade-up h-full" key="team-battle">
            <TeamBattle teams={data.teamStats.teams} openers={data.openers} />
          </div>
        )}
        {viewMode === 'provisions' && (
          <div className="animate-fade-up h-full" key="provisions">
            <ProvisionsView />
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

      {/* Deal Won Overlay */}
      {dealOverlay && (
        <DealWonOverlay
          dealName={dealOverlay.name}
          dealValue={dealOverlay.value}
          closerName={dealOverlay.user}
          onComplete={() => setDealOverlay(null)}
        />
      )}

      {/* Error indicator */}
      {error && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: 'rgba(232, 116, 103, 0.15)', border: '1px solid rgba(232, 116, 103, 0.3)', color: 'var(--za-red)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
