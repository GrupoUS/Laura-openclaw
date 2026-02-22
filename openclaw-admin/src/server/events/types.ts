export type TaskEventType =
  | 'task:created'
  | 'task:updated'
  | 'subtask:created'
  | 'subtask:updated'

export interface TaskEvent {
  type:    TaskEventType
  taskId:  number
  payload: Record<string, unknown>
  agent?:  string
  ts:      string  // ISO 8601
}
