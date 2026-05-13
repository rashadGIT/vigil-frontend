export const FollowUpTemplate = {
  '1_week': '1_week',
  '1_month': '1_month',
  '6_month': '6_month',
  '1_year': '1_year',
} as const;
export type FollowUpTemplate = typeof FollowUpTemplate[keyof typeof FollowUpTemplate];
