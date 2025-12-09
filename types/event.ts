import type { Tables } from './database';

export type Event = Tables<'events'>;

export type EventCategory = 'cupping' | 'popup';

export const EVENT_COLORS: Record<EventCategory, string> = {
  cupping: '#FF6B35',
  popup: '#A56A49',
};

export interface MarkedDate {
  marked?: boolean;
  dotColor?: string;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = Record<string, MarkedDate>;
