'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SoundManagerProps {
  events: Array<{ type: string; timestamp: number }>;
}

export default function SoundManager({ events }: SoundManagerProps) {
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastEventTimestamp = useRef(0);

  const enableAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    setAudioEnabled(true);
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!audioContextRef.current || muted) return;
    const ctx = audioContextRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, [muted, volume]);

  const playChaChingSound = useCallback(() => {
    if (!audioContextRef.current || muted) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'triangle'), i * 100);
    });
  }, [muted, playTone]);

  const playFanfareSound = useCallback(() => {
    if (!audioContextRef.current || muted) return;
    [392, 523, 659].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.5, 'square'), i * 150);
    });
  }, [muted, playTone]);

  const playLeaderChangeSound = useCallback(() => {
    if (!audioContextRef.current || muted) return;
    [262, 330, 392, 523, 659, 784].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'sawtooth'), i * 80);
    });
  }, [muted, playTone]);

  useEffect(() => {
    if (!audioEnabled) return;

    const newEvents = events.filter(e => e.timestamp > lastEventTimestamp.current);
    if (newEvents.length === 0) return;

    lastEventTimestamp.current = Math.max(...newEvents.map(e => e.timestamp));

    for (const event of newEvents) {
      switch (event.type) {
        case 'appointment':
          playChaChingSound();
          break;
        case 'milestone':
          playFanfareSound();
          break;
        case 'leader_change':
        case 'rankup':
          playLeaderChangeSound();
          break;
      }
    }
  }, [events, audioEnabled, playChaChingSound, playFanfareSound, playLeaderChangeSound]);

  if (!audioEnabled) {
    return (
      <button
        onClick={enableAudio}
        className="fixed bottom-4 right-4 z-40 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-colors"
      >
        🔊 Dashboard starten
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-3 bg-gray-800/90 backdrop-blur rounded-xl px-4 py-2 border border-gray-700">
      <button onClick={() => setMuted(!muted)} className="text-2xl hover:scale-110 transition-transform">
        {muted ? '🔇' : '🔊'}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-24 accent-blue-500"
      />
    </div>
  );
}
