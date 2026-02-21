import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { tasks, subtasks } from '@/lib/db/schema'
import { and, gte, lte, or, eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const { searchParams } = new URL(req.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')
    const department = searchParams.get('department')

    let whereConditions = []

    if (start && end) {
      const startDate = new Date(start)
      const endDate = new Date(end)
      whereConditions.push(
        or(
          and(gte(tasks.dueDate, startDate), lte(tasks.dueDate, endDate)),
          and(gte(tasks.createdAt, startDate), lte(tasks.createdAt, endDate))
        )
      )
    }

    if (department && department !== 'all') {
      whereConditions.push(eq(tasks.department, department as any))
    }

    const allTasks = await db.query.tasks.findMany({
      where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
      with: {
        subtasks: true
      },
      orderBy: (tasks, { asc }) => [asc(tasks.dueDate)]
    })

    return NextResponse.json(allTasks)
  } catch (error: any) {
    console.error('Calendar API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
