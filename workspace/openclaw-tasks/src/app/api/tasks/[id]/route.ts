import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const id = params.id;
    
    if (status) {
       await sql`UPDATE tasks SET status = ${status}, updated_at = NOW() WHERE id = ${id}`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
