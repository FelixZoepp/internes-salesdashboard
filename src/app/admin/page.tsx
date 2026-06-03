'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'openers' | 'incentives' | 'challenges' | 'settings' | 'sounds'>('openers');
  const [openers, setOpeners] = useState<any[]>([]);
  const [incentives, setIncentives] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [newIncentive, setNewIncentive] = useState({ title: '', description: '', condition: '', emoji: '🏆', startDate: '', endDate: '' });
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '', targetType: 'appointments', targetValue: 3, reward: '', startDate: '', endDate: '' });
  const [newOpener, setNewOpener] = useState({ email: '', displayName: '', avatarEmoji: '👤', closeUserId1: '', closeUserId2: '' });

  const login = async () => {
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) setAuthenticated(true);
    else alert('Falsches Passwort');
  };

  const loadData = async () => {
    const [opRes, incRes, chaRes] = await Promise.all([
      fetch('/api/admin/openers'),
      fetch('/api/admin/incentives'),
      fetch('/api/admin/challenges'),
    ]);
    setOpeners(await opRes.json());
    setIncentives(await incRes.json());
    setChallenges(await chaRes.json());
  };

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated]);

  const addIncentive = async () => {
    await fetch('/api/admin/incentives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIncentive),
    });
    setNewIncentive({ title: '', description: '', condition: '', emoji: '🏆', startDate: '', endDate: '' });
    loadData();
  };

  const addChallenge = async () => {
    await fetch('/api/admin/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newChallenge),
    });
    setNewChallenge({ title: '', description: '', targetType: 'appointments', targetValue: 3, reward: '', startDate: '', endDate: '' });
    loadData();
  };

  const addOpener = async () => {
    await fetch('/api/admin/openers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOpener),
    });
    setNewOpener({ email: '', displayName: '', avatarEmoji: '👤', closeUserId1: '', closeUserId2: '' });
    loadData();
  };

  const playTestSound = (type: string) => {
    const ctx = new AudioContext();
    const freqs = type === 'appointment' ? [523, 659, 784, 1047] : type === 'milestone' ? [392, 523, 659] : [262, 330, 392, 523, 659, 784];
    const oscType: OscillatorType = type === 'appointment' ? 'triangle' : type === 'milestone' ? 'square' : 'sawtooth';
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = oscType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }, i * 100);
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 w-96">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">🔐 Admin Login</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
            placeholder="Passwort"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4"
          />
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold">
            Anmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">⚙️ Admin Dashboard</h1>
          <a href="/" className="text-blue-400 hover:text-blue-300">← Zurück zum Dashboard</a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {(['openers', 'incentives', 'challenges', 'sounds', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              {tab === 'openers' ? '👥 Opener' : tab === 'incentives' ? '🏆 Incentives' : tab === 'challenges' ? '🎯 Challenges' : tab === 'sounds' ? '🔊 Sounds' : '⚙️ Settings'}
            </button>
          ))}
        </div>

        {/* Openers Tab */}
        {activeTab === 'openers' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Opener verwalten</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input value={newOpener.email} onChange={e => setNewOpener({...newOpener, email: e.target.value})} placeholder="E-Mail" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newOpener.displayName} onChange={e => setNewOpener({...newOpener, displayName: e.target.value})} placeholder="Anzeigename" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newOpener.avatarEmoji} onChange={e => setNewOpener({...newOpener, avatarEmoji: e.target.value})} placeholder="Emoji" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newOpener.closeUserId1} onChange={e => setNewOpener({...newOpener, closeUserId1: e.target.value})} placeholder="Close User ID (Account 1)" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
              <button onClick={addOpener} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold">+ Opener hinzufügen</button>
            </div>
            <div className="space-y-2">
              {openers.map((o: any) => (
                <div key={o.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{o.avatarEmoji}</span>
                    <div>
                      <div className="font-bold text-white">{o.displayName}</div>
                      <div className="text-sm text-gray-500">{o.email}</div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${o.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {o.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incentives Tab */}
        {activeTab === 'incentives' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Incentives</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input value={newIncentive.title} onChange={e => setNewIncentive({...newIncentive, title: e.target.value})} placeholder="Titel" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newIncentive.emoji} onChange={e => setNewIncentive({...newIncentive, emoji: e.target.value})} placeholder="Emoji" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newIncentive.description} onChange={e => setNewIncentive({...newIncentive, description: e.target.value})} placeholder="Beschreibung" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white col-span-2" />
                <input value={newIncentive.condition} onChange={e => setNewIncentive({...newIncentive, condition: e.target.value})} placeholder="Bedingung (z.B. 10 Termine)" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white col-span-2" />
                <input type="date" value={newIncentive.startDate} onChange={e => setNewIncentive({...newIncentive, startDate: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input type="date" value={newIncentive.endDate} onChange={e => setNewIncentive({...newIncentive, endDate: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
              <button onClick={addIncentive} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold">+ Incentive anlegen</button>
            </div>
            <div className="space-y-2">
              {incentives.map((inc: any) => (
                <div key={inc.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{inc.emoji}</span>
                    <div>
                      <div className="font-bold text-white">{inc.title}</div>
                      <div className="text-sm text-gray-400">{inc.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Daily/Weekly Challenges</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input value={newChallenge.title} onChange={e => setNewChallenge({...newChallenge, title: e.target.value})} placeholder="Titel" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newChallenge.reward} onChange={e => setNewChallenge({...newChallenge, reward: e.target.value})} placeholder="Belohnung" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input value={newChallenge.description} onChange={e => setNewChallenge({...newChallenge, description: e.target.value})} placeholder="Beschreibung" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white col-span-2" />
                <select value={newChallenge.targetType} onChange={e => setNewChallenge({...newChallenge, targetType: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                  <option value="appointments">Termine</option>
                  <option value="dials">Dials</option>
                  <option value="conversations">Gespräche</option>
                </select>
                <input type="number" value={newChallenge.targetValue} onChange={e => setNewChallenge({...newChallenge, targetValue: parseInt(e.target.value)})} placeholder="Zielwert" className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input type="date" value={newChallenge.startDate} onChange={e => setNewChallenge({...newChallenge, startDate: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
                <input type="date" value={newChallenge.endDate} onChange={e => setNewChallenge({...newChallenge, endDate: e.target.value})} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white" />
              </div>
              <button onClick={addChallenge} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold">+ Challenge anlegen</button>
            </div>
            <div className="space-y-2">
              {challenges.map((ch: any) => (
                <div key={ch.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                  <div className="font-bold text-white">{ch.title}</div>
                  <div className="text-sm text-gray-400">{ch.description} — Ziel: {ch.targetValue} {ch.targetType}</div>
                  <div className="text-sm text-green-400">Belohnung: {ch.reward}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sounds Tab */}
        {activeTab === 'sounds' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Sound-Test</h2>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => playTestSound('appointment')} className="bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">💰</div>
                <div className="font-bold text-green-400">Termin-Sound</div>
                <div className="text-sm text-gray-400">Cha-Ching</div>
              </button>
              <button onClick={() => playTestSound('milestone')} className="bg-yellow-600/20 border border-yellow-500/30 hover:bg-yellow-600/30 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">🎺</div>
                <div className="font-bold text-yellow-400">Meilenstein-Sound</div>
                <div className="text-sm text-gray-400">Fanfare</div>
              </button>
              <button onClick={() => playTestSound('leader')} className="bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl p-6 text-center">
                <div className="text-4xl mb-2">👑</div>
                <div className="font-bold text-purple-400">Führungswechsel</div>
                <div className="text-sm text-gray-400">Dramatisch</div>
              </button>
            </div>
            <p className="text-gray-500 mt-6 text-sm">
              💡 Du kannst eigene MP3-Dateien in <code className="bg-gray-800 px-2 py-0.5 rounded">/public/sounds/</code> ablegen und im Code referenzieren.
            </p>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Einstellungen</h2>
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <p className="text-gray-400 mb-4">Einstellungen werden über Umgebungsvariablen konfiguriert:</p>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Conversation-Schwellwert:</span><span className="text-white">CONVERSATION_THRESHOLD=60s</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Polling-Intervall:</span><span className="text-white">POLL_INTERVAL=30000ms</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Tagesziel:</span><span className="text-white">TEAM_DAILY_GOAL=10</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Wochenziel:</span><span className="text-white">TEAM_WEEKLY_GOAL=50</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Punkte Dial:</span><span className="text-white">1</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Punkte Conversation:</span><span className="text-white">5</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Punkte Termin:</span><span className="text-white">25</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
