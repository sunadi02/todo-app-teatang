'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { TodoForm } from './todo-form';
import { EditTodoDialog } from './edit-todo-dialog';
import type { Todo, User, TodoStatus } from '@/lib/abac';
import { ABACPermissions } from '@/lib/abac';
import { useState } from 'react';

interface TodoListProps {
  currentUser: User;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-700 border border-gray-300',
  in_progress: 'bg-blue-500 text-white',
  completed: 'bg-green-500 text-white',
};

const statusLabels = {
  draft: 'draft',
  in_progress: 'in_progress',
  completed: 'completed',
};

export function TodoList({ currentUser }: TodoListProps) {
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TodoStatus | 'all'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      return response.json();
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (todoId: string) => {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete todo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading todos...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading todos: {error.message}
      </div>
    );
  }

  const todos: Todo[] = data?.todos || [];
  const canCreate = ABACPermissions.canCreateTodo(currentUser);

  const filteredTodos = todos.filter((todo) => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || todo.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b px-8 py-4 flex justify-end items-center">
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">{currentUser.email}</div>
            <div className="text-xs text-gray-500 capitalize">{currentUser.role}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {currentUser.email.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="bg-white border-b px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Todos</h1>
          {canCreate && (
            <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              New Todo
            </Button>
          )}
        </div>

        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TodoStatus | 'all')}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="p-8">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {todos.length === 0 ? 'No todos found!' : 'No todos match your filters.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTodos.map((todo) => {
              const canUpdate = ABACPermissions.canUpdateTodo(currentUser, todo);
              const canDelete = ABACPermissions.canDeleteTodo(currentUser, todo);
              
              return (
                <Card 
                  key={todo.id} 
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-l-4 hover:border-l-indigo-500"
                  style={{ borderLeftColor: todo.status === 'completed' ? '#10b981' : todo.status === 'in_progress' ? '#3b82f6' : '#9ca3af' }}
                  onClick={() => canUpdate && setEditingTodo(todo)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 text-gray-900">{todo.title}</h3>
                      <p className="text-gray-600 text-sm">{todo.description}</p>
                      {todo.user_id !== currentUser.id && (
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          <span>By: {todo.user_name || 'Unknown user'}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[todo.status]}>
                        {statusLabels[todo.status]}
                      </Badge>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTodo(todo);
                          }}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this todo?')) {
                              deleteTodoMutation.mutate(todo.id);
                            }
                          }}
                          disabled={deleteTodoMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {isFormOpen && (
        <TodoForm open={isFormOpen} onOpenChange={setIsFormOpen} />
      )}

      {editingTodo && (
        <EditTodoDialog
          todo={editingTodo}
          open={!!editingTodo}
          onOpenChange={(open: boolean) => !open && setEditingTodo(null)}
        />
      )}
    </div>
  );
}