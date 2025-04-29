
import { useTasks } from '@/contexts/TaskContext';
import TaskItem from './TaskItem';
import { ClipboardList } from 'lucide-react';

const TaskList: React.FC = () => {
  const { filteredTasks, filter } = useTasks();

  if (filteredTasks.length === 0) {
    // Return empty state based on current filter
    let message = "You have no tasks yet. Add a new task to get started!";
    if (filter === 'active') {
      message = "You don't have any active tasks. Everything's done!";
    } else if (filter === 'completed') {
      message = "You don't have any completed tasks yet.";
    }

    return (
      <div className="text-center py-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-indigo-100 mb-4">
          <ClipboardList className="h-10 w-10 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
        <p className="text-gray-500 max-w-sm mx-auto">{message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
};

export default TaskList;
