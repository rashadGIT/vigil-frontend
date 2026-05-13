import { apiClient } from './client';
import type { ITask } from '@/types';

export async function getCaseTasks(caseId: string): Promise<ITask[]> {
  const res = await apiClient.get<ITask[]>(`/cases/${caseId}/tasks`);
  return res.data;
}

export async function updateTask(taskId: string, update: { completed?: boolean; assignedTo?: string; dueDate?: string }): Promise<ITask> {
  const res = await apiClient.patch<ITask>(`/tasks/${taskId}`, update);
  return res.data;
}
