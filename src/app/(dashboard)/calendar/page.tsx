'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent } from '@/lib/api/calendar';
import type { ICalendarEvent } from '@/types';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, isSameDay,
  format,
} from 'date-fns';
import { EventType } from '@/types';
import { cn } from '@/lib/utils/cn';

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EventType.visitation]:  'bg-blue-500',
  [EventType.service]:     'bg-purple-500',
  [EventType.committal]:   'bg-slate-500',
  [EventType.pickup]:      'bg-orange-500',
  [EventType.preparation]: 'bg-yellow-500',
  [EventType.meeting]:     'bg-green-500',
  [EventType.other]:       'bg-gray-400',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── NewEventDialog ───────────────────────────────────────────────────────────

interface NewEventDialogProps {
  onCreated: (startTime: string) => void;
  defaultDate?: Date;
}

function NewEventDialog({ onCreated, defaultDate }: NewEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.other);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  function handleOpenChange(val: boolean) {
    setOpen(val);
    if (val && defaultDate) {
      const base = format(defaultDate, "yyyy-MM-dd");
      setStartTime(`${base}T09:00`);
      setEndTime(`${base}T10:00`);
    }
    if (!val) {
      setTitle(''); setStartTime(''); setEndTime(''); setNotes('');
      setEventType(EventType.other);
    }
  }

  const mutation = useMutation({
    mutationFn: () => createCalendarEvent({
      title,
      eventType,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created.');
      onCreated(created.startTime as string);
      setOpen(false);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to create event.'));
    },
  });

  const endBeforeStart = startTime && endTime && new Date(endTime) <= new Date(startTime);
  const canSubmit = title.trim() && startTime && endTime && !endBeforeStart;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="font-medium">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(EventType).map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-medium">Start</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">End</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              {endBeforeStart && <p className="text-xs text-destructive">End must be after start.</p>}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="font-medium">
              Notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── MonthGrid ────────────────────────────────────────────────────────────────

const DAY_HEADERS_LONG  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_HEADERS_SHORT = ['S',   'M',   'T',   'W',   'T',   'F',   'S'];

interface MonthGridProps {
  currentMonth: Date;
  selectedDate: Date;
  events: ICalendarEvent[];
  onDayClick: (day: Date) => void;
  onMonthChange: (month: Date) => void;
}

function MonthGrid({ currentMonth, selectedDate, events, onDayClick, onMonthChange }: MonthGridProps) {
  const gridStart = startOfWeek(startOfMonth(currentMonth));
  const gridEnd   = endOfWeek(endOfMonth(currentMonth));
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = new Map<string, ICalendarEvent[]>();
  events.forEach((e) => {
    const key = format(new Date(e.startTime), 'yyyy-MM-dd');
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  });

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-semibold">
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <Button
          variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b">
        {DAY_HEADERS_LONG.map((d, i) => (
          <div key={i} className="py-2 text-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DAY_HEADERS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y border-t">
        {days.map((day) => {
          const key      = format(day, 'yyyy-MM-dd');
          const dayEvts  = eventsByDay.get(key) ?? [];
          const inMonth  = isSameMonth(day, currentMonth);
          const todayDay = isToday(day);
          const selected = isSameDay(day, selectedDate);
          const pills    = dayEvts.slice(0, 2);
          const overflow = dayEvts.length - 2;

          return (
            <button
              key={key}
              onClick={() => {
                if (!inMonth) onMonthChange(new Date(day.getFullYear(), day.getMonth(), 1));
                onDayClick(day);
              }}
              className={cn(
                'min-h-[72px] sm:min-h-[88px] p-1 flex flex-col text-left transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring',
                inMonth ? 'hover:bg-muted/50' : 'bg-muted/20 hover:bg-muted/40',
                selected && 'bg-accent/40',
              )}
            >
              {/* Date number */}
              <span
                className={cn(
                  'text-xs font-medium h-5 w-5 flex items-center justify-center rounded-full mb-0.5 self-end',
                  todayDay && 'bg-primary text-primary-foreground',
                  selected && !todayDay && 'ring-2 ring-primary',
                  !inMonth && 'text-muted-foreground/50',
                  inMonth && !todayDay && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {/* Event pills */}
              <div className="flex flex-col gap-0.5 w-full min-w-0">
                {pills.map((e) => (
                  <div
                    key={e.id}
                    className={cn(
                      'text-[10px] sm:text-xs px-1 py-px rounded text-white truncate leading-4',
                      EVENT_TYPE_COLORS[e.eventType as EventType] ?? 'bg-gray-400',
                    )}
                  >
                    {e.title}
                  </div>
                ))}
                {overflow > 0 && (
                  <span className="text-[10px] text-muted-foreground px-0.5 leading-4">
                    +{overflow} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate]  = useState(new Date());
  const [sheetOpen, setSheetOpen]        = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getCalendarEvents(
      startOfMonth(currentMonth).toISOString(),
      endOfMonth(currentMonth).toISOString(),
    ),
  });

  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.startTime), selectedDate))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  function handleDayClick(day: Date) {
    setSelectedDate(day);
    setSheetOpen(true);
  }

  function handleEventCreated(startTime: string) {
    const d = new Date(startTime);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
    queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
  }

  const queryClient = useQueryClient();

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        action={<NewEventDialog onCreated={handleEventCreated} defaultDate={selectedDate} />}
      />

      {isLoading ? (
        <Skeleton className="h-[520px] w-full rounded-lg" />
      ) : (
        <MonthGrid
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          events={events}
          onDayClick={handleDayClick}
          onMonthChange={setCurrentMonth}
        />
      )}

      {/* Day events bottom sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="max-h-[60vh] overflow-y-auto rounded-t-xl">
          <SheetTitle className="text-base font-semibold">
            {format(selectedDate, 'EEEE, MMMM d')}
          </SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5 mb-4">
            {dayEvents.length === 0
              ? 'No events'
              : `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`}
          </p>

          {dayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No events scheduled for this day.
            </p>
          ) : (
            <div className="divide-y">
              {dayEvents.map((event) => {
                const dot = EVENT_TYPE_COLORS[event.eventType as EventType] ?? 'bg-gray-400';
                return (
                  <div key={event.id} className="flex items-start gap-3 py-3">
                    <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(event.startTime), 'h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1.5 capitalize">
                        {event.eventType}
                      </Badge>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{event.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
