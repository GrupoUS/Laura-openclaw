export type TaskEventType =
  | 'task:created'
  | 'task:updated'
  | 'subtask:created'
  | 'subtask:updated'
  | 'lead_contacted'
  | 'lead_handoff'
  | 'objection_handled'
  | 'sdr_generic'
  | 'agent:status'
  | 'agent:skill_used'

export interface TaskEvent {
  type:    TaskEventType
  taskId:  number
  payload: Record<string, unknown>
  agent?:  string
  ts:      string  // ISO 8601
}
