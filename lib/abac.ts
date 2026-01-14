export type UserRole = 'user' | 'manager' | 'admin';
export type TodoStatus = 'draft' | 'in_progress' | 'completed';

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  user_id: string;
  user_name?: string;
  user_email?: string;
}

export class ABACPermissions {
  static canViewTodo(user: User, todo: Todo): boolean {
    switch (user.role) {
      case 'user':
        return todo.user_id === user.id;
      case 'manager':
      case 'admin':
        return true;
      default:
        return false;
    }
  }

  static canCreateTodo(user: User): boolean {
    return user.role === 'user';
  }

  static canUpdateTodo(user: User, todo: Todo): boolean {
    return user.role === 'user' && todo.user_id === user.id;
  }

  static canDeleteTodo(user: User, todo: Todo): boolean {
    if (user.role === 'admin') {
      return true;
    }
    if (user.role === 'user') {
      return todo.user_id === user.id && todo.status === 'draft';
    }
    return false;
  }

  static getVisibleTodos(user: User, todos: Todo[]): Todo[] {
    return todos.filter(todo => this.canViewTodo(user, todo));
  }
}