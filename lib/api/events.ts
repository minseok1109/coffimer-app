import dayjs from 'dayjs';
import { supabase } from '@/lib/supabaseClient';
import type { Event } from '@/types/event';

export const EventAPI = {
  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const startOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .startOf('month')
      .format('YYYY-MM-DD');
    const endOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .endOf('month')
      .format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', startOfMonth)
      .lte('event_date', endOfMonth)
      .eq('is_published', true)
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },

  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getEventsByDate(date: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('event_date', date)
      .eq('is_published', true)
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  },
};
