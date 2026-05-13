export interface ITask {
  id: string;
  tenantId: string;
  caseId: string;
  title: string;
  completed: boolean;
  completedBy: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
