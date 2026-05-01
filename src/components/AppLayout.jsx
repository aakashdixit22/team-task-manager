"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "📊" },
  { label: "Projects", href: "/projects", icon: "📁" },
  { label: "My Tasks", href: "/tasks", icon: "✅" },
];

export default function AppLayout({ children }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: "var(--accent-gradient)" }}>T</div>
            <span className="text-lg font-bold">TaskFlow</span>
          </div>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}
                className={`sidebar-link ${pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}>
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="avatar" style={{ background: "var(--accent-gradient)" }}>{initials}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">{user?.name}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" style={{ color: "var(--text-muted)" }} title="Logout">
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[280px]">
        <div className="lg:hidden flex items-center gap-4 p-4 border-b sticky top-0 z-20" style={{ borderColor: "var(--border-color)", background: "var(--bg-primary)" }}>
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>☰</button>
          <span className="font-semibold">TaskFlow</span>
        </div>
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
