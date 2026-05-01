"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

export default function ProjectsPage() {
  const { apiFetch } = useApi();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      const res = await apiFetch("/api/projects");
      const data = await res.json();
      if (res.ok) setProjects(data.projects);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await apiFetch("/api/projects", { method: "POST", body: JSON.stringify({ name, description }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProjects([data.project, ...projects]);
      setShowModal(false);
      setName("");
      setDescription("");
    } catch (err) { setError(err.message || "Failed"); } finally { setCreating(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="spinner" /></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p style={{ color: "var(--text-secondary)" }}>Manage your team projects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="mb-6" style={{ color: "var(--text-muted)" }}>Create your first project to get started</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project, i) => (
            <Link key={project._id} href={`/projects/${project._id}`} className="glass-card p-6 block animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: `hsl(${(project.name.charCodeAt(0) * 37) % 360}, 70%, 50%)` }}>
                  {project.name[0]?.toUpperCase()}
                </div>
                <span className="text-xs px-2 py-1 rounded-lg" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>
                  {project.members.length} member{project.members.length !== 1 ? "s" : ""}
                </span>
              </div>
              <h3 className="font-semibold text-lg mb-1">{project.name}</h3>
              <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>{project.description || "No description"}</p>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>Owner: {project.owner.name}</span><span>•</span>
                <span>{new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={createProject} className="space-y-5">
              {error && <div className="p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>}
              <div>
                <label className="form-label" htmlFor="project-name">Project Name</label>
                <input id="project-name" className="form-input" placeholder="My Awesome Project" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
              </div>
              <div>
                <label className="form-label" htmlFor="project-desc">Description (optional)</label>
                <textarea id="project-desc" className="form-input" rows={3} placeholder="What's this project about?" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>{creating ? "Creating..." : "Create Project"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
