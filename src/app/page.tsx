"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Status = "todo" | "progress" | "done";
type Priority = "low" | "medium" | "high";

type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string;
  createdAt: string;
};

type TaskDraft = Omit<Task, "id" | "createdAt">;

const STORAGE_KEY = "taskpilot-tasks-v1";

const demoTasks: Task[] = [
  {
    id: "demo-1",
    title: "Design the project dashboard",
    description: "Create a clean and responsive dashboard for the final presentation.",
    status: "done",
    priority: "high",
    dueDate: "2026-06-16",
    createdAt: "2026-06-10T09:00:00.000Z",
  },
  {
    id: "demo-2",
    title: "Test task filters",
    description: "Verify search, status and priority filters on mobile and desktop.",
    status: "progress",
    priority: "medium",
    dueDate: "2026-06-19",
    createdAt: "2026-06-12T12:30:00.000Z",
  },
  {
    id: "demo-3",
    title: "Record the demonstration video",
    description: "Show the deployed application and explain the main functionality.",
    status: "todo",
    priority: "high",
    dueDate: "2026-06-19",
    createdAt: "2026-06-14T18:00:00.000Z",
  },
];

const emptyDraft: TaskDraft = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
};

const statusLabel: Record<Status, string> = {
  todo: "To do",
  progress: "In progress",
  done: "Completed",
};

const nextStatus: Record<Status, Status> = {
  todo: "progress",
  progress: "done",
  done: "todo",
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setTasks(stored ? (JSON.parse(stored) as Task[]) : demoTasks);
    } catch {
      setTasks(demoTasks);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, ready]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks
      .filter((task) => statusFilter === "all" || task.status === statusFilter)
      .filter((task) => priorityFilter === "all" || task.priority === priorityFilter)
      .filter(
        (task) =>
          !normalizedQuery ||
          task.title.toLowerCase().includes(normalizedQuery) ||
          task.description.toLowerCase().includes(normalizedQuery),
      )
      .sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks, query, statusFilter, priorityFilter]);

  const completed = tasks.filter((task) => task.status === "done").length;
  const progress = tasks.filter((task) => task.status === "progress").length;
  const highPriority = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  const completionRate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2400);
  }

  function submitTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;

    if (editingId) {
      setTasks((current) =>
        current.map((task) =>
          task.id === editingId ? { ...task, ...draft, title: draft.title.trim() } : task,
        ),
      );
      flash("Task updated successfully");
    } else {
      setTasks((current) => [
        ...current,
        {
          ...draft,
          id: makeId(),
          title: draft.title.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
      flash("New task created");
    }

    setDraft(emptyDraft);
    setEditingId(null);
  }

  function editTask(task: Task) {
    setEditingId(task.id);
    setDraft({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setDraft(emptyDraft);
    }
    flash("Task deleted");
  }

  function advanceTask(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, status: nextStatus[task.status] } : task,
      ),
    );
  }

  function exportTasks() {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "taskpilot-tasks.json";
    anchor.click();
    URL.revokeObjectURL(url);
    flash("Task data exported");
  }

  return (
    <main>
      {notice && <div className="toast">{notice}</div>}

      <header className="topbar">
        <a className="brand" href="#top" aria-label="TaskPilot home">
          <span className="brand-mark">TP</span>
          <span>TaskPilot</span>
        </a>
        <div className="header-actions">
          <span className="saved-state"><span /> Automatically saved</span>
          <button className="secondary-button" type="button" onClick={exportTasks}>Export data</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">PROJECT WORKSPACE</p>
          <h1>Keep every task moving forward.</h1>
          <p className="hero-copy">
            Plan your work, focus on priorities, and track progress from one simple dashboard.
          </p>
        </div>
        <div className="progress-card">
          <div className="progress-heading">
            <span>Overall progress</span>
            <strong>{completionRate}%</strong>
          </div>
          <div className="progress-track"><span style={{ width: `${completionRate}%` }} /></div>
          <small>{completed} of {tasks.length} tasks completed</small>
        </div>
      </section>

      <section className="stats-grid" aria-label="Project statistics">
        <article className="stat-card"><span>Total tasks</span><strong>{tasks.length}</strong><small>Across the project</small></article>
        <article className="stat-card"><span>In progress</span><strong>{progress}</strong><small>Currently active</small></article>
        <article className="stat-card"><span>Completed</span><strong>{completed}</strong><small>Great work</small></article>
        <article className="stat-card warning"><span>High priority</span><strong>{highPriority}</strong><small>Needs attention</small></article>
      </section>

      <section className="workspace">
        <aside className="task-form-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">TASK DETAILS</p>
              <h2>{editingId ? "Edit task" : "Create a task"}</h2>
            </div>
          </div>

          <form onSubmit={submitTask}>
            <label>
              Task title
              <input
                value={draft.title}
                onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                placeholder="What needs to be done?"
                maxLength={80}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                placeholder="Add useful context"
                rows={4}
                maxLength={300}
              />
            </label>
            <div className="form-row">
              <label>
                Priority
                <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value as Priority })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Status
                <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Status })}>
                  <option value="todo">To do</option>
                  <option value="progress">In progress</option>
                  <option value="done">Completed</option>
                </select>
              </label>
            </div>
            <label>
              Due date
              <input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} />
            </label>
            <button className="primary-button" type="submit">{editingId ? "Save changes" : "Add task"}</button>
            {editingId && (
              <button className="cancel-button" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>
                Cancel editing
              </button>
            )}
          </form>
        </aside>

        <div className="task-panel">
          <div className="section-heading task-list-heading">
            <div>
              <p className="eyebrow">YOUR WORK</p>
              <h2>Task overview</h2>
            </div>
            <span className="result-count">{filteredTasks.length} result{filteredTasks.length === 1 ? "" : "s"}</span>
          </div>

          <div className="filters">
            <input aria-label="Search tasks" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." />
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Status | "all")}>
              <option value="all">All statuses</option>
              <option value="todo">To do</option>
              <option value="progress">In progress</option>
              <option value="done">Completed</option>
            </select>
            <select aria-label="Filter by priority" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as Priority | "all")}>
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="medium">Medium priority</option>
              <option value="low">Low priority</option>
            </select>
          </div>

          {!ready ? (
            <div className="empty-state">Loading your workspace…</div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <strong>No tasks found</strong>
              <span>Change the filters or create a new task.</span>
            </div>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article className={`task-card status-${task.status}`} key={task.id}>
                  <div className="task-main">
                    <div className="task-meta">
                      <span className={`status-pill ${task.status}`}>{statusLabel[task.status]}</span>
                      <span className={`priority-pill ${task.priority}`}>{task.priority} priority</span>
                    </div>
                    <h3>{task.title}</h3>
                    {task.description && <p>{task.description}</p>}
                    <div className="due-date">{task.dueDate ? `Due ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "No due date"}</div>
                  </div>
                  <div className="task-actions">
                    <button type="button" onClick={() => advanceTask(task.id)}>{task.status === "done" ? "Reopen" : "Move forward"}</button>
                    <button type="button" onClick={() => editTask(task)}>Edit</button>
                    <button className="delete-action" type="button" onClick={() => deleteTask(task.id)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer>
        <span>TaskPilot</span>
        <span>Built with Next.js + TypeScript</span>
      </footer>
    </main>
  );
}
