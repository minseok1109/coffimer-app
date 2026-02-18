import { supabase } from "@/lib/supabaseClient";
import type { Event } from "@/types/event";
import dayjs from "dayjs";

const EVENT_LIST_COLUMNS = "id, title, roastery_name, event_date, start_time, end_time, category" as const;

export const EventAPI = {
  async getEventsByMonth(year: number, month: number): Promise<Event[]> {
    const startOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .startOf("month")
      .format("YYYY-MM-DD");
    const endOfMonth = dayjs()
      .year(year)
      .month(month - 1)
      .endOf("month")
      .format("YYYY-MM-DD");

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_LIST_COLUMNS)
      .gte("event_date", startOfMonth)
      .lte("event_date", endOfMonth)
      .eq("is_published", true)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as unknown as Event[];
  },

  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getEventsByDate(date: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select(EVENT_LIST_COLUMNS)
      .eq("event_date", date)
      .eq("is_published", true)
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as unknown as Event[];
  },
};
