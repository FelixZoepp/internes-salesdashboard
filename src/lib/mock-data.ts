import { OpenerData } from './close-api';
import { POINTS } from './config';

const MOCK_OPENERS = [
  { name: 'Max Müller', email: 'max@content-leads.de', emoji: '🦁' },
  { name: 'Lisa Schmidt', email: 'lisa@content-leads.de', emoji: '🚀' },
  { name: 'Taha El-Amri', email: 'taha@content-leads.de', emoji: '⚡' },
  { name: 'Johannes Weber', email: 'johannes@content-leads.de', emoji: '🔥' },
  { name: 'Sarah Koch', email: 'sarah@content-leads.de', emoji: '💎' },
  { name: 'Lukas Bauer', email: 'lukas@content-leads.de', emoji: '🎯' },
];

let mockState: OpenerData[] | null = null;

function initMockState(): OpenerData[] {
  return MOCK_OPENERS.map((o, i) => ({
    closeUserId: `mock_${i}`,
    email: o.email,
    name: o.name,
    dials: Math.floor(Math.random() * 60) + 20,
    conversations: Math.floor(Math.random() * 10) + 2,
    appointments: Math.floor(Math.random() * 4),
    totalCallDuration: Math.floor(Math.random() * 3600) + 600,
    smsSent: Math.floor(Math.random() * 10),
    emailsSent: Math.floor(Math.random() * 8),
  }));
}

export function getMockData(): OpenerData[] {
  if (!mockState) {
    mockState = initMockState();
  }

  // Simulate activity: randomly increment one opener's stats
  const randomIdx = Math.floor(Math.random() * mockState.length);
  const opener = mockState[randomIdx];
  const rand = Math.random();

  if (rand < 0.5) {
    opener.dials += Math.floor(Math.random() * 3) + 1;
  } else if (rand < 0.8) {
    opener.dials += 1;
    opener.conversations += 1;
  } else {
    opener.dials += 1;
    opener.appointments += 1;
  }

  return mockState.map(o => ({ ...o }));
}

export function calculatePoints(data: OpenerData): number {
  return (data.dials * POINTS.DIAL) + (data.conversations * POINTS.CONVERSATION) + (data.appointments * POINTS.APPOINTMENT);
}

export const MOCK_AVATARS: Record<string, string> = Object.fromEntries(
  MOCK_OPENERS.map(o => [o.email, o.emoji])
);
