export const EventType = {
  visitation: 'visitation',
  service: 'service',
  committal: 'committal',
  pickup: 'pickup',
  preparation: 'preparation',
  meeting: 'meeting',
  other: 'other',
} as const;
export type EventType = typeof EventType[keyof typeof EventType];
