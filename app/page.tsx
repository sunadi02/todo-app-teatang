import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-helpers';
import { TodoList } from '@/components/todo-list';
import { Sidebar } from '@/components/sidebar';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentUser={user} />
      <main className="flex-1">
        <TodoList currentUser={user} />
      </main>
    </div>
  );
}
