import { apiClient } from './client';
import type { ICalendarEvent } from '@/types';
import { EventType } from '@/types';

export async function getCalendarEvents(from?: string, to?: string): Promise<ICalendarEvent[]> {
  const res = await apiClient.get<ICalendarEvent[]>('/calendar/events', { params: { from, to } });
  return res.data;
}

export async function createCalendarEvent(dto: {
  title: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  caseId?: string;
  notes?: string;
}): Promise<ICalendarEvent> {
  const res = await apiClient.post<ICalendarEvent>('/calendar/events', dto);
  return res.data;
}
