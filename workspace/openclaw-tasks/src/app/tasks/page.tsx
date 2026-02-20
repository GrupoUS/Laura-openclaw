'use client';

import { useState, useEffect } from 'react';
import { LayoutList, KanbanSquare, CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DndContext, closestCorners, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core';

interface Subtask { id: string; status: string; title: string; agent: string; }
interface Task { id: string; title: string; priority: string; phase: number; agent: string; status: string; description: string; subtasks?: Subtask[]; }

function DroppableColumn({ id, title, count, children }: { id: string; title: string; count: number; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 min-h-[500px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold capitalize tracking-wide text-neutral-400">
          {title}
        </h3>
        <span className="text-xs bg-black px-2 py-0.5 rounded-full text-neutral-500 font-mono">
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-3">{children}</div>
    </div>
  );
}

function DraggableCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="group relative bg-neutral-900 border border-white/5 rounded-xl p-4 shadow-sm transition-all hover:border-white/10 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing">
      <div className={cn("absolute left-0 top-0 right-0 h-1 rounded-t-xl", 
        task.priority === 'critical' ? 'bg-red-500' :
        task.priority === 'high' ? 'bg-orange-500' : 
        task.priority === 'medium' ? 'bg-indigo-500' : 'bg-neutral-600'
      )} />
      <div className="flex justify-between items-start mt-1">
        <span className="text-[10px] font-mono text-neutral-500 tracking-tight">T-{task.id.split('-')[0]}</span>
        <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-neutral-400">P{task.phase}</span>
      </div>
      <h4 className="font-medium text-sm text-neutral-200 mt-2 mb-3 leading-snug">{task.title}</h4>
      
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <CheckCircle2 size={12} className={task.subtasks?.every((s) => s.status === 'done') && task.subtasks?.length > 0 ? 'text-emerald-500' : ''} />
          <span>{task.subtasks?.filter((s) => s.status === 'done').length || 0}/{task.subtasks?.length || 0}</span>
        </div>
        <span className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full">{task.agent}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'kanban'>('list');

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setTasks(data);
        setLoading(false);
      });
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const taskId = active.id;
    const newStatus = over.id; // column id is the status
    
    // Optimistic update
    setTasks(prev => prev.map((t: Task) => t.id === taskId ? { ...t, status: newStatus as string } : t));
    
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
  };

  const phases = [...new Set(tasks.map(t => t.phase))].toSorted();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans p-8 selection:bg-indigo-500/30">
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laura Task Command</h1>
          <p className="text-neutral-400 text-sm mt-1">Multi-agent orchestration view</p>
        </div>
        
        <div className="flex bg-neutral-900 border border-white/10 rounded-lg p-1">
          <button 
            onClick={() => setView('list')}
            className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all", view === 'list' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white')}
          >
            <LayoutList size={16} /> List
          </button>
          <button 
            onClick={() => setView('kanban')}
            className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all", view === 'kanban' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white')}
          >
            <KanbanSquare size={16} /> Board
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {loading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {view === 'list' && (
              <div className="space-y-12">
                {phases.map(phase => (
                  <div key={phase} className="space-y-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-4">
                      Phase {phase}
                      <div className="h-px flex-1 bg-white/10"></div>
                    </h2>
                    
                    <div className="space-y-2">
                      {tasks.filter(t => t.phase === phase).map(task => (
                        <div key={task.id} className="group relative bg-neutral-900/50 hover:bg-neutral-900 border border-white/5 rounded-xl p-4 transition-all hover:border-white/10 hover:shadow-2xl hover:shadow-indigo-500/5 overflow-hidden">
                          <div className={cn("absolute left-0 top-0 bottom-0 w-1", 
                            task.priority === 'critical' ? 'bg-red-500' :
                            task.priority === 'high' ? 'bg-orange-500' : 
                            task.priority === 'medium' ? 'bg-indigo-500' : 'bg-neutral-600'
                          )} />
                          
                          <div className="flex items-start justify-between pl-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-neutral-500 bg-black px-1.5 py-0.5 rounded">TASK-{task.id.split('-')[0]}</span>
                                <h3 className="font-medium text-neutral-200">{task.title}</h3>
                                {task.status === 'done' && <CheckCircle2 size={14} className="text-emerald-500" />}
                              </div>
                              <p className="text-sm text-neutral-400 max-w-2xl">{task.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-xs text-neutral-500 block">Agent</span>
                                <span className="text-sm px-2 py-0.5 mt-1 block bg-indigo-500/10 text-indigo-400 rounded-full">{task.agent}</span>
                              </div>
                            </div>
                          </div>
                          
                          {task.subtasks?.length && task.subtasks.length > 0 ? (
                            <div className="mt-4 pl-4 ml-3 border-l-2 border-white/5 space-y-2">
                              {task.subtasks.map((st) => (
                                <div key={st.id} className="flex items-center justify-between text-sm group/st">
                                  <div className="flex items-center gap-2">
                                    {st.status === 'done' ? (
                                      <CheckCircle2 size={16} className="text-emerald-500" />
                                    ) : st.status === 'doing' ? (
                                      <Clock size={16} className="text-amber-500" />
                                    ) : (
                                      <Circle size={16} className="text-neutral-600" />
                                    )}
                                    <span className={cn("transition-colors", st.status === 'done' ? 'text-neutral-500 line-through' : 'text-neutral-300')}>{st.title}</span>
                                  </div>
                                  <span className="text-xs text-neutral-500">{st.agent}</span>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {view === 'kanban' && (
              <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-4 gap-6">
                  {['backlog', 'in_progress', 'done', 'blocked'].map(status => (
                    <DroppableColumn key={status} id={status} title={status.replace('_', ' ')} count={tasks.filter((t: Task) => t.status === status).length}>
                        {tasks.filter((t: Task) => t.status === status).map((task: Task) => (
                           <DraggableCard key={task.id} task={task} />
                        ))}
                    </DroppableColumn>
                  ))}
                </div>
              </DndContext>
            )}
          </>
        )}
      </main>
    </div>
  );
}
