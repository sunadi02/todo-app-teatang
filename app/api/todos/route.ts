import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

//ABAC permissions
import { ABACPermissions } from '@/lib/abac';
import { getCurrentUser } from '@/lib/auth-helpers';
import { createTodoSchema } from '@/lib/validations';
import { z } from 'zod';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: todos, error } = await supabase
    .from('todos')
    .select(`
      *,
      user:user_id (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const todosWithUserInfo = (todos || []).map((todo) => ({
    ...todo,
    user_name: todo.user?.name || 'Unknown',
    user_email: todo.user?.email || '',
  }));

  const visibleTodos = ABACPermissions.getVisibleTodos(user, todosWithUserInfo);
  
  return NextResponse.json({ todos: visibleTodos });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || !ABACPermissions.canCreateTodo(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    //validate input
    const validatedData = createTodoSchema.parse(body);
    
    const { data, error } = await supabase
      .from('todos')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        status: validatedData.status,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ todo: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}