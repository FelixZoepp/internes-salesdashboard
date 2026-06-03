'use client';

import { useEffect, useState } from 'react';

interface Event {
  type: string;
  message: string;
  timestamp: number;
  openerName: string;
}

export default function EventTicker({ events }: { events: Event[] }) {
  const [displayEvents, setDisplayEvents] = useState<Event[]>([]);

  useEffect(() => {
    setDisplayEvents(prev => {
      const newEvents = events.filter(e => !prev.some(p => p.timestamp === e.timestamp && p.message === e.message));
      return [...newEvents, ...prev].slice(0, 20);
    });
  }, [events]);

  if (displayEvents.length === 0) {
    return (
      <div className="p-3" style={{ background: 'rgba(11, 19, 34, 0.9)', borderTop: '1px solid var(--za-panel-border)' }}>
        <div className="text-center text-lg" style={{ color: 'var(--za-fg-4)' }}>Warte auf erste Events...</div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden" style={{ background: 'rgba(11, 19, 34, 0.9)', borderTop: '1px solid var(--za-panel-border)' }}>
      <div className="animate-marquee whitespace-nowrap py-3">
        {displayEvents.map((event, i) => (
          <span key={`${event.timestamp}-${i}`} className="mx-8 text-lg font-semibold">
            <span style={{
              color: event.type === 'appointment' ? 'var(--za-green)'
                : event.type === 'milestone' ? 'var(--za-gold)'
                : event.type === 'leader_change' ? 'var(--za-blue-3)'
                : 'var(--za-blue-4)',
            }}>
              {event.message}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
