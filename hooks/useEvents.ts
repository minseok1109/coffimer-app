import { useQuery } from '@tanstack/react-query';
import { EventAPI } from '@/lib/api/events';
import type { Event } from '@/types/event';

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  listByMonth: (year: number, month: number) =>
    [...eventKeys.lists(), year, month] as const,
  listByDate: (date: string) => [...eventKeys.lists(), 'date', date] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
};

export const useEventsByMonth = (year: number, month: number) => {
  return useQuery<Event[], Error>({
    queryKey: eventKeys.listByMonth(year, month),
    queryFn: () => EventAPI.getEventsByMonth(year, month),
  });
};

export const useEventsByDate = (date: string) => {
  return useQuery<Event[], Error>({
    queryKey: eventKeys.listByDate(date),
    queryFn: () => EventAPI.getEventsByDate(date),
    enabled: !!date,
  });
};

export const useEvent = (eventId: string) => {
  return useQuery<Event | null, Error>({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => EventAPI.getEventById(eventId),
    enabled: !!eventId,
  });
};
