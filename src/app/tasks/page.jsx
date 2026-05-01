"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

export default function TasksPage() {
  const { apiFetch } = useApi();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const res = await apiFetch("/api/tasks");
      const data = await res.json();
      if (res.ok) setTasks(data.tasks);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const quickStatusUpdate = async (taskId, status) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ status }) });
      const data = await res.json();
      if (res.ok) setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
    } catch (err) { console.error(err); }
  };

  const filtered = tasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
        <p style={{ color: "var(--text-secondary)" }}>All tasks across your projects</p>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="form-label">Status</label>
          <select className="form-select" style={{ width: "auto", minWidth: "150px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select className="form-select" style={{ width: "auto", minWidth: "150px" }} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Showing {filtered.length} of {tasks.length} tasks</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-semibold mb-2">{tasks.length === 0 ? "No tasks yet" : "No matching tasks"}</h3>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>{tasks.length === 0 ? "Go to a project to create tasks" : "Try adjusting your filters"}</p>
          {tasks.length === 0 && <Link href="/projects" className="btn-primary inline-block">Go to Projects</Link>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <div key={task._id} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, cursor: "default" }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold truncate">{task.title}</h4>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {task.project && <Link href={`/projects/${task.project._id}`} className="hover:underline" style={{ color: "var(--accent-primary)" }}>📁 {task.project.name}</Link>}
                    {task.assignee && <span>👤 {task.assignee.name}</span>}
                    {task.dueDate && (
                      <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== "completed" ? "var(--danger)" : undefined }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && task.status !== "completed" && " (Overdue)"}
                      </span>
                    )}
                  </div>
                </div>
                <select className="form-select text-xs py-2 px-3" style={{ width: "auto", minWidth: "130px" }} value={task.status} onChange={(e) => quickStatusUpdate(task._id, e.target.value)}>
                  <option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
