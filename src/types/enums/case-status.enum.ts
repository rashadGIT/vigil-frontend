export const CaseStatus = {
  new: 'new',
  in_progress: 'in_progress',
  completed: 'completed',
  archived: 'archived',
} as const;
export type CaseStatus = typeof CaseStatus[keyof typeof CaseStatus];
