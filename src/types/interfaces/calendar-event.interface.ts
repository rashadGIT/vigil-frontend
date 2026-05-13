import type { EventType } from '../enums/event-type.enum';

export interface ICalendarEvent {
  id: string;
  tenantId: string;
  caseId: string | null;
  title: string;
  eventType: EventType;
  location: string | null;
  startTime: string;
  endTime: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
