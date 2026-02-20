import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  if (!process.env.NEON_DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    const tasks = await sql`SELECT * FROM tasks ORDER BY phase ASC, created_at DESC`;
    const subtasks = await sql`SELECT * FROM subtasks ORDER BY created_at ASC`;
    
    const tasksWithSubtasks = tasks.map(task => 
      Object.assign({}, task, {
        subtasks: subtasks.filter(st => st.task_id === task.id)
      })
    );
    
    return NextResponse.json(tasksWithSubtasks);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
