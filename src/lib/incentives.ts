import { TIMEZONE } from './config';

export interface Incentive {
  id: string;
  emoji: string;
  title: string;
  description: string;
  bonus: string;
  check: (data: { appointments: number; firstAppointmentTime?: string }) => boolean;
}

export const INCENTIVES: Incentive[] = [
  {
    id: 'early_bird_setting',
    emoji: '🌅',
    title: 'Early Bird Setting',
    description: 'Erstes Setting vor 10:00 Uhr',
    bonus: '+10 € brutto',
    check: ({ firstAppointmentTime }) => {
      if (!firstAppointmentTime) return false;
      const date = new Date(firstAppointmentTime);
      const hours = parseInt(
        new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: TIMEZONE }).format(date)
      );
      return hours < 10;
    },
  },
  {
    id: 'five_settings',
    emoji: '🏆',
    title: '5er Pack',
    description: '5 Settings an einem Tag',
    bonus: '+25 € brutto',
    check: ({ appointments }) => appointments >= 5,
  },
  {
    id: 'ten_settings',
    emoji: '💎',
    title: 'Setting-Maschine',
    description: '10 Settings an einem Tag',
    bonus: '+75 € brutto',
    check: ({ appointments }) => appointments >= 10,
  },
];
