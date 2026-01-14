import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
//ABAC permissions
import { ABACPermissions } from '@/lib/abac';
import { getCurrentUser } from '@/lib/auth-helpers';
import { updateTodoSchema } from '@/lib/validations';
import { z } from 'zod';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const { data: todo, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    //check abac permissiona
    if (!ABACPermissions.canUpdateTodo(user, todo)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    //validate input
    const validatedData = updateTodoSchema.parse(body);

    const { data, error } = await supabase
      .from('todos')
      .update({
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.status && { status: validatedData.status }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const { data: todo, error: fetchError } = await supabase
    .from('todos')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !todo) {
    return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
  }

  if (!ABACPermissions.canDeleteTodo(user, todo)) {
    return NextResponse.json(
      { error: 'Forbidden: Cannot delete this todo' },
      { status: 403 }
    );
  }

  
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
