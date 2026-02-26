import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { trpc } from '@/client/trpc'
import { AlwaysRunningSection } from '@/client/components/dashboard/calendar/AlwaysRunningSection'
import { WeekGrid } from '@/client/components/dashboard/calendar/WeekGrid'
import { NextUpSection } from '@/client/components/dashboard/calendar/NextUpSection'

export const Route = createLazyFileRoute('/calendar')({
  component: CalendarPage,
})

interface CalendarTask {
  id: number
  title: string
  createdAt: string
  department?: string
}

const getDeptColor = (dept: string) => {
  switch(dept) {
    case 'Coordenacao': return 'border-blue-500 text-blue-700 bg-blue-50'
    case 'Comercial': return 'border-green-500 text-green-700 bg-green-50'
    case 'Marketing': return 'border-purple-500 text-purple-700 bg-purple-50'
    case 'Juridico': return 'border-red-500 text-red-700 bg-red-50'
    case 'Diretoria': return 'border-amber-500 text-amber-700 bg-amber-50'
    default: return 'border-slate-400 text-slate-600 bg-slate-50'
  }
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

type ViewMode = 'month' | 'week'

function RenderDays() {
  return (
    <div className="grid grid-cols-7 mb-2">
      {WEEK_DAYS.map(day => (
        <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
          {day}
        </div>
      ))}
    </div>
  )
}

function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const departments = ['all', 'Coordenacao', 'Comercial', 'Marketing', 'Juridico', 'Diretoria']

  const start = startOfWeek(startOfMonth(currentMonth))
  const end = endOfWeek(endOfMonth(currentMonth))

  const { data: tasks = [], isLoading: tasksLoading } = trpc.calendar.list.useQuery({
    start: start.toISOString(),
    end: end.toISOString(),
  })

  const { data: unified, isLoading: unifiedLoading } = trpc.calendar.unified.useQuery(undefined, {
    refetchInterval: 30_000,
  })

  const isLoading = tasksLoading || unifiedLoading

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 border-r border-slate-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-50 border-l border-slate-200 transition-colors"
          >
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Mes
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'week' ? 'bg-indigo-500 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Semana
          </button>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
          <Filter size={16} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Area:</span>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="text-sm font-semibold bg-transparent border-none focus:ring-0 cursor-pointer text-slate-800"
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept === 'all' ? 'Todas' : dept}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, "d")
        const cloneDay = day
        const dayTasks = (tasks as CalendarTask[]).filter((task) =>
          isSameDay(new Date(task.createdAt), cloneDay) &&
          (selectedDepartment === 'all' || task.department === selectedDepartment)
        )

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] bg-white border border-slate-100 p-2 transition-all ${
              !isSameMonth(day, monthStart) ? "bg-slate-50/50 text-slate-300" : "text-slate-700 hover:shadow-inner"
            } ${isSameDay(day, new Date()) ? "ring-2 ring-indigo-500 ring-inset" : ""}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-sm font-semibold ${isSameDay(day, new Date()) ? "bg-indigo-500 text-white w-6 h-6 flex items-center justify-center rounded-full" : ""}`}>
                {formattedDate}
              </span>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-hide">
              {dayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`text-[10px] p-1.5 rounded border-l-2 truncate shadow-sm bg-white ${getDeptColor(task.department ?? '')}`}
                  title={task.title}
                >
                  <span className="font-bold opacity-70 mr-1">[{task.department?.substring(0,3)}]</span>
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      )
      days = []
    }
    return <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">{rows}</div>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Scheduled Tasks</h2>
          <p className="text-slate-400 text-sm mt-1">Cron Jobs + Tasks unificados</p>
        </div>
      </div>

      {unified && (
        <div className="flex flex-col gap-4">
          <AlwaysRunningSection crons={unified.alwaysRunning} />
          {viewMode === 'week' && <WeekGrid crons={unified.scheduled} />}
          <NextUpSection crons={unified.nextUp} />
        </div>
      )}

      {viewMode === 'month' && (
        <div>
          {renderHeader()}
          <RenderDays />
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Carregando calendario...</p>
              </div>
            </div>
          ) : renderCells()}
        </div>
      )}

      {viewMode === 'week' && !unified && isLoading && (
        <div className="h-40 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
