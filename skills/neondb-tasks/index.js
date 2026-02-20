import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.NEON_DATABASE_URL);

async function createTask(title, description, phase, priority = 'medium', agent = 'laura') {
  const result = await sql`
    INSERT INTO tasks (title, description, phase, priority, agent)
    VALUES (${title}, ${description || null}, ${phase || 1}, ${priority}, ${agent})
    RETURNING *;
  `;
  return result[0];
}

async function createSubtask(taskId, title, phase, agent = 'laura') {
  const result = await sql`
    INSERT INTO subtasks (task_id, title, phase, agent)
    VALUES (${taskId}, ${title}, ${phase || 1}, ${agent})
    RETURNING *;
  `;
  
  await sql`
    INSERT INTO task_events (task_id, agent, event_type, payload)
    VALUES (${taskId}, ${agent}, 'subtask_created', ${JSON.stringify({ title, phase })});
  `;
  
  return result[0];
}

async function updateTask(id, status, priority, agent) {
  const result = await sql`
    UPDATE tasks 
    SET 
      status = COALESCE(${status}, status),
      priority = COALESCE(${priority}, priority),
      agent = COALESCE(${agent}, agent),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *;
  `;
  return result[0];
}

async function updateSubtask(id, status, completedAt) {
  const result = await sql`
    UPDATE subtasks 
    SET 
      status = COALESCE(${status}, status),
      completed_at = ${completedAt === 'now' ? sql`NOW()` : completedAt || null}
    WHERE id = ${id}
    RETURNING *;
  `;
  
  if (result[0] && status === 'done') {
    await sql`
      INSERT INTO task_events (task_id, agent, event_type, payload)
      VALUES (${result[0].task_id}, ${result[0].agent}, 'subtask_done', ${JSON.stringify({ subtask_id: id })});
    `;
  }
  
  return result[0];
}

async function listTasks(status = null, agent = null, phase = null) {
  let query = sql`SELECT * FROM tasks WHERE 1=1`;
  
  if (status) query = sql`${query} AND status = ${status}`;
  if (agent) query = sql`${query} AND agent = ${agent}`;
  if (phase) query = sql`${query} AND phase = ${phase}`;
  
  query = sql`${query} ORDER BY created_at DESC`;
  return await query;
}

async function getTask(id) {
  const tasks = await sql`SELECT * FROM tasks WHERE id = ${id}`;
  if (!tasks.length) return null;
  const task = tasks[0];
  
  const subtasks = await sql`SELECT * FROM subtasks WHERE task_id = ${id} ORDER BY created_at ASC`;
  const events = await sql`SELECT * FROM task_events WHERE task_id = ${id} ORDER BY created_at DESC`;
  
  return { ...task, subtasks, events };
}

async function main() {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : null;
  };

  const action = getArg('action');
  
  if (!process.env.NEON_DATABASE_URL) {
    console.error(JSON.stringify({ error: 'NEON_DATABASE_URL is not set' }));
    process.exit(1);
  }

  try {
    let result;
    switch (action) {
      case 'create_task':
        result = await createTask(getArg('title'), getArg('description'), parseInt(getArg('phase') || '1'), getArg('priority'), getArg('agent'));
        break;
      case 'create_subtask':
        result = await createSubtask(getArg('task_id'), getArg('title'), parseInt(getArg('phase') || '1'), getArg('agent'));
        break;
      case 'update_task':
        result = await updateTask(getArg('id'), getArg('status'), getArg('priority'), getArg('agent'));
        break;
      case 'update_subtask':
        result = await updateSubtask(getArg('id'), getArg('status'), getArg('completed_at'));
        break;
      case 'list_tasks':
        result = await listTasks(getArg('status'), getArg('agent'), getArg('phase') ? parseInt(getArg('phase')) : null);
        break;
      case 'get_task':
        result = await getTask(getArg('id'));
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }
}

main();
