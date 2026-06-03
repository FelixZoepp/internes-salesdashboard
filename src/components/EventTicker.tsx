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
      <div className="bg-gray-900/80 border-t border-gray-700 p-3">
        <div className="text-gray-500 text-center text-lg">Warte auf erste Events...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 border-t border-gray-700 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap py-3">
        {displayEvents.map((event, i) => (
          <span key={`${event.timestamp}-${i}`} className="mx-8 text-lg font-semibold">
            <span className={
              event.type === 'appointment' ? 'text-green-400' :
              event.type === 'milestone' ? 'text-yellow-400' :
              event.type === 'leader_change' ? 'text-purple-400' :
              'text-blue-400'
            }>
              {event.message}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
