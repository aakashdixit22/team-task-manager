"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState("login");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(circle at 30% 50%, rgba(99,102,241,0.3), transparent 60%), radial-gradient(circle at 70% 80%, rgba(139,92,246,0.2), transparent 50%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl" style={{ background: "var(--accent-gradient)" }}>T</div>
            <span className="text-2xl font-bold">TaskFlow</span>
          </div>
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Manage your team&apos;s<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--accent-gradient)" }}>tasks effortlessly</span>
          </h1>
          <p className="text-lg max-w-md" style={{ color: "var(--text-secondary)" }}>
            Create projects, assign tasks, track progress — all with powerful role-based access control for your entire team.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: "Projects", icon: "📁", desc: "Organize work" },
              { label: "Tasks", icon: "✅", desc: "Track progress" },
              { label: "Teams", icon: "👥", desc: "Collaborate" },
            ].map((item) => (
              <div key={item.label} className="glass-card p-5 text-center" style={{ cursor: "default" }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm">{item.label}</div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Auth Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ background: "var(--accent-gradient)" }}>T</div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">{mode === "login" ? "Welcome back" : "Create account"}</h2>
          <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
            {mode === "login" ? "Sign in to continue to your dashboard" : "Get started with your free account"}
          </p>
          {mode === "login" ? <LoginForm /> : <SignupForm />}
          <div className="mt-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            {mode === "login" ? (
              <>Don&apos;t have an account?{" "}<button onClick={() => setMode("signup")} className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>Sign up</button></>
            ) : (
              <>Already have an account?{" "}<button onClick={() => setMode("login")} className="font-semibold hover:underline" style={{ color: "var(--accent-primary)" }}>Sign in</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>
      )}
      <div>
        <label className="form-label" htmlFor="login-email">Email</label>
        <input id="login-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="form-label" htmlFor="login-password">Password</label>
        <input id="login-password" type="password" className="form-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
    </form>
  );
}

function SignupForm() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--danger)" }}>{error}</div>
      )}
      <div>
        <label className="form-label" htmlFor="signup-name">Full Name</label>
        <input id="signup-name" type="text" className="form-input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div>
        <label className="form-label" htmlFor="signup-email">Email</label>
        <input id="signup-email" type="email" className="form-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label className="form-label" htmlFor="signup-password">Password</label>
        <input id="signup-password" type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
    </form>
  );
}
