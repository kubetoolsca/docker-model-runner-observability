
export type Priority = 'low' | 'medium' | 'high';

export type TaskStatus = 'active' | 'completed';

export type FilterType = 'all' | 'active' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskContextType {
  tasks: Task[];
  filter: FilterType;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => void;
  updateTask: (id: string, updatedTask: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  setFilter: (filter: FilterType) => void;
  filteredTasks: Task[];
}
