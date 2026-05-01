"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

export default function DashboardPage() {
  const { apiFetch } = useApi();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [highPriorityTasks, setHighPriorityTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch("/api/dashboard");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setRecentTasks(data.recentTasks || []);
        setOverdueTasks(data.overdueTasks || []);
        setHighPriorityTasks(data.highPriorityTasks || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>;
  }

  const statCards = [
    { label: "Total Projects", value: stats?.totalProjects || 0, icon: "📁", color: "#6366f1" },
    { label: "Total Tasks", value: stats?.totalTasks || 0, icon: "📋", color: "#8b5cf6" },
    { label: "To Do", value: stats?.todoTasks || 0, icon: "📝", color: "#3b82f6" },
    { label: "In Progress", value: stats?.inProgressTasks || 0, icon: "🔄", color: "#f59e0b" },
    { label: "Completed", value: stats?.completedTasks || 0, icon: "✅", color: "#10b981" },
    { label: "Overdue", value: stats?.overdueTasks || 0, icon: "⚠️", color: "#ef4444" },
  ];

  const statusBadge = (status) => {
    const map = { todo: "badge badge-todo", "in-progress": "badge badge-in-progress", completed: "badge badge-completed" };
    const labels = { todo: "To Do", "in-progress": "In Progress", completed: "Completed" };
    return <span className={map[status] || "badge"}>{labels[status] || status}</span>;
  };

  const priorityBadge = (priority) => {
    const map = { high: "badge badge-high", medium: "badge badge-medium", low: "badge badge-low" };
    return <span className={map[priority] || "badge"}>{priority}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p style={{ color: "var(--text-secondary)" }}>Overview of your projects and tasks</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, i) => (
          <div key={card.label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {overdueTasks.length > 0 && (
          <div className="glass-card p-6" style={{ cursor: "default" }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>⚠️</span> Overdue Tasks</h2>
            <div className="space-y-3">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {task.project?.name} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  {statusBadge(task.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {highPriorityTasks.length > 0 && (
          <div className="glass-card p-6" style={{ cursor: "default" }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>🔥</span> High Priority</h2>
            <div className="space-y-3">
              {highPriorityTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-card)" }}>
                  <div>
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{task.project?.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {priorityBadge(task.priority)}
                    {statusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-card p-6 lg:col-span-2" style={{ cursor: "default" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><span>📋</span> Recent Tasks</h2>
            <Link href="/tasks" className="text-sm font-medium" style={{ color: "var(--accent-primary)" }}>View all →</Link>
          </div>
          {recentTasks.length === 0 ? (
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <div className="text-4xl mb-3">📝</div>
              <p>No tasks yet. Create a project and start adding tasks!</p>
              <Link href="/projects" className="btn-primary inline-block mt-4">Create Project</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div key={task._id} className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-white/5">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{task.title}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {task.project?.name}
                      {task.assignee && ` • ${task.assignee.name}`}
                      {task.dueDate && ` • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {priorityBadge(task.priority)}
                    {statusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
