'use client';

import { useState, useEffect, useCallback } from 'react';
import Leaderboard from '@/components/Leaderboard';
import TeamGoalBar from '@/components/TeamGoalBar';
import EventTicker from '@/components/EventTicker';
import AppointmentOverlay from '@/components/AppointmentOverlay';
import SoundManager from '@/components/SoundManager';
import IncentiveBoard from '@/components/IncentiveBoard';

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
  }>;
  teamStats: {
    totalDials: number;
    totalConversations: number;
    totalAppointments: number;
    totalPoints: number;
    dailyGoal: number;
    weeklyGoal: number;
    weeklyAppointments: number;
  };
  events: Array<{ type: string; message: string; timestamp: number; openerName: string }>;
  timestamp: number;
}

type ViewMode = 'leaderboard' | 'incentives' | 'weekly';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('points');
  const [viewMode, setViewMode] = useState<ViewMode>('leaderboard');
  const [autoRotate, setAutoRotate] = useState(false);
  const [overlay, setOverlay] = useState<{ name: string; emoji: string } | null>(null);
  const [allEvents, setAllEvents] = useState<Array<{ type: string; message: string; timestamp: number; openerName: string }>>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('API Error');
      const json: DashboardData = await res.json();
      setData(json);
      setError(null);

      // Check for appointment events to show overlay
      if (json.events.length > 0) {
        const appointmentEvent = json.events.find(e => e.type === 'appointment');
        if (appointmentEvent) {
          const opener = json.openers.find(o => o.displayName === appointmentEvent.openerName || o.name === appointmentEvent.openerName);
          setOverlay({ name: appointmentEvent.openerName, emoji: opener?.avatarEmoji || '🎯' });
        }
        setAllEvents(prev => [...json.events, ...prev].slice(0, 50));
      }
    } catch (err) {
      setError('Dashboard konnte nicht geladen werden');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return;
    const views: ViewMode[] = ['leaderboard', 'incentives', 'weekly'];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % views.length;
      setViewMode(views[idx]);
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Berlin' });

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-pulse mb-4">📊</div>
          <div className="text-2xl text-gray-400">Dashboard lädt...</div>
          {error && <div className="text-red-400 mt-4">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              🏆 SALES ARENA
            </h1>
            <p className="text-gray-400 text-sm">{dateStr}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort buttons */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              {['points', 'dials', 'conversations', 'appointments'].map(key => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                    sortBy === key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {key === 'points' ? 'Punkte' : key === 'dials' ? 'Dials' : key === 'conversations' ? 'Gespräche' : 'Termine'}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
              <button onClick={() => setViewMode('leaderboard')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'leaderboard' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>
                🏅 Board
              </button>
              <button onClick={() => setViewMode('incentives')} className={`px-3 py-1.5 rounded-md text-sm font-semibold ${viewMode === 'incentives' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>
                🏆 Incentives
              </button>
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${autoRotate ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}`}
            >
              {autoRotate ? '🔄 Auto' : '⏸ Auto'}
            </button>

            <div className="text-4xl font-black text-white">{timeStr}</div>
          </div>
        </div>

        {/* Team Goal */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <TeamGoalBar current={data.teamStats.totalAppointments} goal={data.teamStats.dailyGoal} label="📅 Tagesziel Termine" />
          <TeamGoalBar current={data.teamStats.weeklyAppointments} goal={data.teamStats.weeklyGoal} label="📊 Wochenziel Termine" />
        </div>

        {/* Quick Stats */}
        <div className="mt-4 flex gap-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black text-blue-400">{data.teamStats.totalDials}</div>
            <div className="text-xs text-blue-300 uppercase font-semibold">Team Dials</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black text-green-400">{data.teamStats.totalConversations}</div>
            <div className="text-xs text-green-300 uppercase font-semibold">Gespräche</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black text-purple-400">{data.teamStats.totalAppointments}</div>
            <div className="text-xs text-purple-300 uppercase font-semibold">Termine</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-6 py-3 text-center">
            <div className="text-3xl font-black text-yellow-400">{data.teamStats.totalPoints}</div>
            <div className="text-xs text-yellow-300 uppercase font-semibold">Team Punkte</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {viewMode === 'leaderboard' && <Leaderboard openers={data.openers} sortBy={sortBy} />}
        {viewMode === 'incentives' && <IncentiveBoard incentives={[]} />}
      </main>

      {/* Ticker */}
      <EventTicker events={allEvents} />

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
        <div className="fixed top-4 right-4 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
