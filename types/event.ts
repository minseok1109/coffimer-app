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
  periods?: Array<{
    color: string;
    startingDay?: boolean;
    endingDay?: boolean;
  }>;
  selected?: boolean;
  selectedColor?: string;
}

export type MarkedDates = Record<string, MarkedDate>;

export interface CustomMarkedDate {
  colors?: string[];
  selected?: boolean;
  selectedColor?: string;
}

export type CustomMarkedDates = Record<string, CustomMarkedDate>;
