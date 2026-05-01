"use client";

import { useEffect, useState, use } from "react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function ProjectDetailPage({ params }) {
  const { id } = use(params);
  const { apiFetch } = useApi();
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("all");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskStatus, setTaskStatus] = useState("todo");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskError, setTaskError] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [memberError, setMemberError] = useState("");
  const [memberSaving, setMemberSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => { loadProject(); }, [id]);

  const loadProject = async () => {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      const data = await res.json();
      if (res.ok) { setProject(data.project); setTasks(data.tasks); }
      else router.push("/projects");
    } catch { router.push("/projects"); } finally { setLoading(false); }
  };

  const isAdmin = project?.members.some((m) => m.user._id === user?.id && m.role === "admin") || project?.owner._id === user?.id;

  const createTask = async (e) => {
    e.preventDefault();
    setTaskError("");
    setTaskSaving(true);
    try {
      const res = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title: taskTitle, description: taskDesc, status: taskStatus, priority: taskPriority, projectId: id, assigneeId: taskAssignee || undefined, dueDate: taskDueDate || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks([data.task, ...tasks]);
      closeTaskModal();
    } catch (err) { setTaskError(err.message || "Failed"); } finally { setTaskSaving(false); }
  };

  const updateTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setTaskError("");
    setTaskSaving(true);
    try {
      const res = await apiFetch(`/api/tasks/${editingTask._id}`, {
        method: "PUT",
        body: JSON.stringify({ title: taskTitle, description: taskDesc, status: taskStatus, priority: taskPriority, assigneeId: taskAssignee || null, dueDate: taskDueDate || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(tasks.map((t) => (t._id === editingTask._id ? data.task : t)));
      closeTaskModal();
    } catch (err) { setTaskError(err.message || "Failed"); } finally { setTaskSaving(false); }
  };

  const deleteTask = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) setTasks(tasks.filter((t) => t._id !== taskId));
    } catch (err) { console.error(err); }
  };

  const quickStatusUpdate = async (taskId, status) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: "PUT", body: JSON.stringify({ status }) });
      const data = await res.json();
      if (res.ok) setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
    } catch (err) { console.error(err); }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    setMemberSaving(true);
    try {
      const res = await apiFetch(`/api/projects/${id}/members`, { method: "POST", body: JSON.stringify({ email: memberEmail, role: memberRole }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProject(data.project);
      setMemberEmail("");
      setShowMemberModal(false);
    } catch (err) { setMemberError(err.message || "Failed"); } finally { setMemberSaving(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm("Remove this member?")) return;
    try {
      const res = await apiFetch(`/api/projects/${id}/members?userId=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) setProject(data.project);
    } catch (err) { console.error(err); }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: "PUT", body: JSON.stringify({ name: editName, description: editDesc }) });
      const data = await res.json();
      if (res.ok) { setProject(data.project); setShowEditModal(false); }
    } catch (err) { console.error(err); }
  };

  const deleteProject = async () => {
    if (!confirm("Delete this project and all its tasks? This cannot be undone.")) return;
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/projects");
    } catch (err) { console.error(err); }
  };

  const closeTaskModal = () => {
    setShowTaskModal(false); setEditingTask(null); setTaskTitle(""); setTaskDesc(""); setTaskStatus("todo"); setTaskPriority("medium"); setTaskAssignee(""); setTaskDueDate(""); setTaskError("");
  };

  const openEditTask = (task) => {
    setEditingTask(task); setTaskTitle(task.title); setTaskDesc(task.description); setTaskStatus(task.status); setTaskPriority(task.priority); setTaskAssignee(task.assignee?._id || ""); setTaskDueDate(task.dueDate ? task.dueDate.split("T")[0] : ""); setShowTaskModal(true);
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>;
  if (!project) return null;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <button onClick={() => router.push("/projects")} className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>← Back to Projects</button>
          <h1 className="text-3xl font-bold mb-1">{project.name}</h1>
          <p style={{ color: "var(--text-secondary)" }}>{project.description || "No description"}</p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          {isAdmin && (
            <>
              <button className="btn-secondary" onClick={() => setShowMemberModal(true)}>+ Add Member</button>
              <button className="btn-secondary" onClick={() => { setEditName(project.name); setEditDesc(project.description); setShowEditModal(true); }}>Edit</button>
            </>
          )}
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>+ New Task</button>
        </div>
      </div>

      <div className="glass-card p-5 mb-6" style={{ cursor: "default" }}>
        <h3 className="font-semibold mb-3 text-sm" style={{ color: "var(--text-secondary)" }}>Team Members ({project.members.length})</h3>
        <div className="flex flex-wrap gap-3">
          {project.members.map((m) => (
            <div key={m.user._id} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "var(--bg-input)" }}>
              <div className="avatar w-7 h-7 text-xs" style={{ background: `hsl(${m.user.name.charCodeAt(0) * 37 % 360}, 70%, 50%)` }}>{m.user.name[0]?.toUpperCase()}</div>
              <span className="text-sm font-medium">{m.user.name}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: m.role === "admin" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)", color: m.role === "admin" ? "var(--accent-primary)" : "var(--text-muted)" }}>{m.role}</span>
              {isAdmin && m.user._id !== project.owner._id && (
                <button onClick={() => removeMember(m.user._id)} className="text-xs ml-1" style={{ color: "var(--danger)" }}>✕</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All", count: tasks.length },
          { key: "todo", label: "To Do", count: tasks.filter((t) => t.status === "todo").length },
          { key: "in-progress", label: "In Progress", count: tasks.filter((t) => t.status === "in-progress").length },
          { key: "completed", label: "Completed", count: tasks.filter((t) => t.status === "completed").length },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{ background: filter === tab.key ? "rgba(99,102,241,0.15)" : "var(--bg-card)", color: filter === tab.key ? "var(--accent-primary)" : "var(--text-secondary)", border: `1px solid ${filter === tab.key ? "rgba(99,102,241,0.3)" : "var(--border-color)"}` }}>
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-muted)" }}><div className="text-5xl mb-3">📝</div><p>No tasks {filter !== "all" ? `with status "${filter}"` : "yet"}</p></div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, i) => (
            <div key={task._id} className="glass-card p-5 animate-fade-in" style={{ animationDelay: `${i * 0.03}s`, cursor: "default" }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold truncate">{task.title}</h4>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </div>
                  {task.description && <p className="text-sm mb-2 line-clamp-1" style={{ color: "var(--text-muted)" }}>{task.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    {task.assignee && <span>👤 {task.assignee.name}</span>}
                    {task.dueDate && (
                      <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== "completed" ? "var(--danger)" : undefined }}>
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && task.status !== "completed" && " (Overdue)"}
                      </span>
                    )}
                    <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select className="form-select text-xs py-2 px-3" style={{ width: "auto", minWidth: "120px" }} value={task.status} onChange={(e) => quickStatusUpdate(task._id, e.target.value)}>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  {isAdmin && (
                    <>
                      <button className="btn-secondary py-2 px-3 text-xs" onClick={() => openEditTask(task)}>Edit</button>
                      <button className="btn-danger py-2 px-3 text-xs" onClick={() => deleteTask(task._id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {project.owner._id === user?.id && (
        <div className="mt-12 pt-8 border-t" style={{ borderColor: "var(--border-color)" }}>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--danger)" }}>Danger Zone</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Permanently delete this project and all its tasks.</p>
          <button className="btn-danger" onClick={deleteProject}>Delete Project</button>
        </div>
      )}

      {showTaskModal && (
        <div className="modal-overlay" onClick={closeTaskModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">{editingTask ? "Edit Task" : "Create Task"}</h2>
            <form onSubmit={editingTask ? updateTask : createTask} className="space-y-4">
              {taskError && <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{taskError}</div>}
              <div><label className="form-label">Title</label><input className="form-input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required minLength={2} placeholder="Task title" /></div>
              <div><label className="form-label">Description</label><textarea className="form-input" rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Optional description" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="form-label">Status</label><select className="form-select" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}><option value="todo">To Do</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select></div>
                <div><label className="form-label">Priority</label><select className="form-select" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              </div>
              <div><label className="form-label">Assignee</label><select className="form-select" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}><option value="">Unassigned</option>{project.members.map((m) => (<option key={m.user._id} value={m.user._id}>{m.user.name} ({m.user.email})</option>))}</select></div>
              <div><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={closeTaskModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={taskSaving}>{taskSaving ? "Saving..." : editingTask ? "Update Task" : "Create Task"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Add Team Member</h2>
            <form onSubmit={addMember} className="space-y-4">
              {memberError && <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{memberError}</div>}
              <div><label className="form-label">Email Address</label><input type="email" className="form-input" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required placeholder="user@example.com" /></div>
              <div><label className="form-label">Role</label><select className="form-select" value={memberRole} onChange={(e) => setMemberRole(e.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={memberSaving}>{memberSaving ? "Adding..." : "Add Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Edit Project</h2>
            <form onSubmit={updateProject} className="space-y-4">
              <div><label className="form-label">Project Name</label><input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required minLength={2} /></div>
              <div><label className="form-label">Description</label><textarea className="form-input" rows={3} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
