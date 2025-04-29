
import React from 'react';
import { TaskProvider } from '@/contexts/TaskContext';
import TaskForm from '@/components/TaskForm';
import TaskFilters from '@/components/TaskFilters';
import TaskList from '@/components/TaskList';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TaskProvider>
        <div className="container mx-auto py-8 px-4 max-w-3xl">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 mb-2">Todo App</h1>
            <p className="text-gray-600">Stay organized and get things done</p>
          </header>
          
          <TaskForm />
          <TaskFilters />
          <TaskList />
        </div>
      </TaskProvider>
    </div>
  );
};

export default Index;
