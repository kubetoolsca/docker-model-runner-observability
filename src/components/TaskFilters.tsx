
import { useTasks } from '@/contexts/TaskContext';
import { FilterType } from '@/types';
import { Button } from '@/components/ui/button';

const TaskFilters: React.FC = () => {
  const { filter, setFilter, tasks } = useTasks();
  
  // Count tasks by status
  const activeCount = tasks.filter(task => task.status === 'active').length;
  const completedCount = tasks.filter(task => task.status === 'completed').length;
  
  const filters: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: tasks.length },
    { value: 'active', label: 'Active', count: activeCount },
    { value: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <div className="flex justify-center flex-wrap gap-2 mb-6">
      {filters.map(({ value, label, count }) => (
        <Button
          key={value}
          variant={filter === value ? "default" : "outline"}
          onClick={() => setFilter(value)}
          className={filter === value 
            ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
            : "hover:bg-indigo-100"
          }
        >
          {label} <span className="ml-1.5 inline-block px-1.5 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">{count}</span>
        </Button>
      ))}
    </div>
  );
};

export default TaskFilters;
