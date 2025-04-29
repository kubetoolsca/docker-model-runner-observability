
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Task, Priority, FilterType, TaskContextType } from '@/types';
import { toast } from '@/components/ui/use-toast';

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        // Parse dates properly
        const parsedTasks = JSON.parse(savedTasks, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error parsing tasks from localStorage:', error);
        toast({
          variant: "destructive",
          title: "Error loading tasks",
          description: "Could not load your saved tasks. Starting with empty list."
        });
      }
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const task: Task = {
      ...newTask,
      id: crypto.randomUUID(),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setTasks(prev => [task, ...prev]);
    toast({
      title: "Task added",
      description: `"${task.title.substring(0, 20)}${task.title.length > 20 ? '...' : ''}" has been added`
    });
  };

  const updateTask = (id: string, updatedTask: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id
          ? { ...task, ...updatedTask, updatedAt: new Date() }
          : task
      )
    );
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully"
    });
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find(task => task.id === id);
    setTasks(prev => prev.filter(task => task.id !== id));
    if (taskToDelete) {
      toast({
        title: "Task deleted",
        description: `"${taskToDelete.title.substring(0, 20)}${taskToDelete.title.length > 20 ? '...' : ''}" has been removed`
      });
    }
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === id
          ? { 
              ...task, 
              status: task.status === 'active' ? 'completed' : 'active',
              updatedAt: new Date() 
            }
          : task
      )
    );
  };

  // Filter tasks based on the current filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const contextValue: TaskContextType = {
    tasks,
    filter,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFilter,
    filteredTasks,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
};
