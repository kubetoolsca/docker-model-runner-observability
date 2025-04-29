
import React, { useState } from 'react';
import { Task, Priority } from '@/types';
import { useTasks } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Circle, Pencil, Trash2, X, Save, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TaskItemProps {
  task: Task;
}

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { updateTask, deleteTask, toggleTaskStatus } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState<Priority>(task.priority);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
  };

  const handleSave = () => {
    if (!editedTitle.trim()) return;
    
    updateTask(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim() || undefined,
      priority: editedPriority,
    });
    
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const priorityColors = {
    low: 'bg-todo-bg-low text-todo-low border-todo-low',
    medium: 'bg-todo-bg-medium text-todo-medium border-todo-medium',
    high: 'bg-todo-bg-high text-todo-high border-todo-high',
  };

  // Format the relative time
  const getRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card 
      className={`mb-4 transition-all animate-fade-in hover:shadow-md ${
        task.status === 'completed' ? 'opacity-75' : 'opacity-100'
      }`}
    >
      {isEditing ? (
        // Edit Mode
        <CardContent className="p-4">
          <form className="space-y-4">
            <div>
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                placeholder="Task title"
                className="font-medium text-lg"
                autoFocus
              />
            </div>
            
            <div>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                placeholder="Add description (optional)"
                rows={2}
              />
            </div>
            
            <div>
              <Select
                value={editedPriority}
                onValueChange={(value: Priority) => setEditedPriority(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="text-todo-low font-medium">Low</SelectItem>
                  <SelectItem value="medium" className="text-todo-medium font-medium">Medium</SelectItem>
                  <SelectItem value="high" className="text-todo-high font-medium">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={handleSave}
              >
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </form>
        </CardContent>
      ) : (
        // View Mode
        <>
          <CardHeader className="flex flex-row items-start space-y-0 p-4 pb-2">
            <div className="flex-1">
              <div className="flex items-center">
                <Checkbox 
                  id={`task-${task.id}`}
                  checked={task.status === 'completed'}
                  onCheckedChange={() => toggleTaskStatus(task.id)}
                  className="mr-2"
                />
                <CardTitle 
                  className={`font-medium text-lg ${
                    task.status === 'completed' 
                      ? 'line-through text-todo-completed' 
                      : ''
                  }`}
                >
                  {task.title}
                </CardTitle>
              </div>
              {task.description && (
                <CardDescription className="mt-2 text-gray-600">
                  {task.description}
                </CardDescription>
              )}
            </div>
            <div className={`ml-4 px-2.5 py-1 text-xs font-medium rounded-full border ${priorityColors[task.priority]}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </div>
          </CardHeader>
          
          <CardFooter className="flex justify-between items-center p-4 pt-1 text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {getRelativeTime(task.updatedAt)}
              </span>
            </div>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteTask(task.id)} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default TaskItem;
