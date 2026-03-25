import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  enrichTask,
  moveTask,
  getDashboard,
  listKanban,
  upsertTask,
  upsertSession,
} from './storage.mjs';

// Get projectCwd from the running Express server
async function getProjectCwd() {
  try {
    const res = await fetch('http://localhost:37778/api/health');
    const data = await res.json();
    return data.projectCwd || process.cwd();
  } catch {
    return process.cwd();
  }
}

const server = new Server(
  { name: 'task-viewer', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'task_enrich',
      description: 'Add or update metadata on an existing task (priority, effort, component, tags, kanban_column, feature). Use after TaskCreate to classify the task.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string', description: 'Task ID (e.g. "7")' },
          sessionId: { type: 'string', description: 'Session ID from the task' },
          kanban_column: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done'], description: 'Move task to this kanban column' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
          effort: { type: 'string', enum: ['trivial', 'small', 'medium', 'large', 'epic'] },
          component: { type: 'string', description: 'System component or area (e.g. "auth", "ui")' },
          tags: { type: 'array', items: { type: 'string' } },
          feature: { type: 'string', description: 'Feature group name' },
        },
        required: ['taskId', 'sessionId'],
      },
    },
    {
      name: 'task_query',
      description: 'Query tasks with filters. Returns tasks from the current project matching all provided criteria.',
      inputSchema: {
        type: 'object',
        properties: {
          column: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done'] },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed'] },
          component: { type: 'string' },
          priority: { type: 'string' },
          feature: { type: 'string' },
          limit: { type: 'number', description: 'Max results, default 50' },
        },
      },
    },
    {
      name: 'task_move',
      description: 'Move a task to a specific kanban column. Use to promote backlog→todo when planning to work on a task.',
      inputSchema: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          sessionId: { type: 'string' },
          column: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done'] },
        },
        required: ['taskId', 'sessionId', 'column'],
      },
    },
    {
      name: 'task_dashboard',
      description: 'Returns a full project snapshot: task counts per column, completion rate, breakdown by component and priority.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'task_bulk_classify',
      description: 'Classify multiple tasks at once. Efficient for batch enrichment at session start/end.',
      inputSchema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                taskId: { type: 'string' },
                sessionId: { type: 'string' },
                kanban_column: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done'] },
                priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                effort: { type: 'string', enum: ['trivial', 'small', 'medium', 'large', 'epic'] },
                component: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                feature: { type: 'string' },
              },
              required: ['taskId', 'sessionId'],
            },
          },
        },
        required: ['tasks'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'task_enrich') {
      const { taskId, sessionId, ...fields } = args;
      const updated = enrichTask(taskId, sessionId, fields);
      // Notify Express server to broadcast kanban update
      fetch('http://localhost:37778/api/kanban-notify', { method: 'POST' }).catch(() => {});
      return {
        content: [{ type: 'text', text: JSON.stringify(updated || { taskId, sessionId, ...fields, updated: true }) }],
      };
    }

    if (name === 'task_query') {
      const projectCwd = await getProjectCwd();
      const columns = listKanban(projectCwd);
      const allTasks = [...columns.backlog, ...columns.todo, ...columns.in_progress, ...columns.done];
      let results = allTasks;
      if (args.column) results = results.filter(t => t.kanbanColumn === args.column);
      if (args.status) results = results.filter(t => t.status === args.status);
      if (args.component) results = results.filter(t => t.component === args.component);
      if (args.priority) results = results.filter(t => t.priority === args.priority);
      if (args.feature) results = results.filter(t => t.metadata?.feature === args.feature);
      results = results.slice(0, args.limit || 50);
      return { content: [{ type: 'text', text: JSON.stringify(results) }] };
    }

    if (name === 'task_move') {
      const { taskId, sessionId, column } = args;
      const updated = moveTask(taskId, sessionId, column);
      fetch('http://localhost:37778/api/kanban-notify', { method: 'POST' }).catch(() => {});
      return {
        content: [{ type: 'text', text: JSON.stringify(updated || { taskId, sessionId, column, moved: false, reason: 'task not found' }) }],
      };
    }

    if (name === 'task_dashboard') {
      const projectCwd = await getProjectCwd();
      const dashboard = getDashboard(projectCwd);
      return { content: [{ type: 'text', text: JSON.stringify(dashboard) }] };
    }

    if (name === 'task_bulk_classify') {
      const results = [];
      for (const task of args.tasks) {
        const { taskId, sessionId, ...fields } = task;
        const updated = enrichTask(taskId, sessionId, fields);
        results.push(updated || { taskId, sessionId, updated: false });
      }
      fetch('http://localhost:37778/api/kanban-notify', { method: 'POST' }).catch(() => {});
      return { content: [{ type: 'text', text: JSON.stringify(results) }] };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${name}` }) }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
