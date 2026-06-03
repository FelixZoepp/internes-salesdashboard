export const POINTS = {
  DIAL: 1,
  CONVERSATION: 5,
  APPOINTMENT: 25,
} as const;

export const LEVELS = [
  { name: 'Bronze', minPoints: 0, color: '#CD7F32' },
  { name: 'Silber', minPoints: 500, color: '#C0C0C0' },
  { name: 'Gold', minPoints: 2000, color: '#FFD700' },
  { name: 'Platin', minPoints: 5000, color: '#E5E4E2' },
  { name: 'Diamant', minPoints: 15000, color: '#B9F2FF' },
] as const;

export const BADGES = {
  FIRST_BLOOD: { name: 'First Blood', description: 'Erster Termin des Tages', emoji: '🩸' },
  CENTURY_CLUB: { name: 'Century Club', description: '100 Dials an einem Tag', emoji: '💯' },
  HAT_TRICK: { name: 'Hat-Trick', description: '3 Termine an einem Tag', emoji: '🎩' },
  EARLY_BIRD: { name: 'Early Bird', description: 'Erster Dial vor 8:30 Uhr', emoji: '🐦' },
  COMEBACK_KID: { name: 'Comeback Kid', description: 'Von Platz ≥5 auf Top 3', emoji: '🔄' },
} as const;

export const CONVERSATION_THRESHOLD_SECONDS = parseInt(process.env.CONVERSATION_THRESHOLD || '60', 10);
export const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL || '30000', 10);
export const TEAM_WEEKLY_GOAL = parseInt(process.env.TEAM_WEEKLY_GOAL || '50', 10);
export const TEAM_DAILY_GOAL = parseInt(process.env.TEAM_DAILY_GOAL || '10', 10);
export const TIMEZONE = 'Europe/Berlin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
export const MOCK_DATA = process.env.MOCK_DATA === 'true';

// Custom Activity Names in Close CRM
// "Setting vereinbart" = Termin gebucht (zählt als Appointment)
// "Protokoll" = Anwahl/Dial (Custom Activity die nach einem Call abgeschickt wird)
export const CLOSE_APPOINTMENT_ACTIVITY = process.env.CLOSE_APPOINTMENT_ACTIVITY || 'Setting vereinbart';
export const CLOSE_DIAL_ACTIVITY = process.env.CLOSE_DIAL_ACTIVITY || 'Protokoll';
