"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError, loginRequest } from "@/lib/api";
import { setToken } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("from") ?? "/map";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await loginRequest(username, password);
      setToken(token);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="block font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-1.5"
        >
          Username
        </label>
        <input
          type="text"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-[#111318] border border-[#1e2230] rounded-lg px-4 py-2.5
                     text-sm text-white placeholder-slate-600
                     focus:outline-none focus:border-cyan-500
                     transition-colors duration-150"
          placeholder="admin"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-1.5"
        >
          Password
        </label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#111318] border border-[#1e2230] rounded-lg px-4 py-2.5
                     text-sm text-white placeholder-slate-600
                     focus:outline-none focus:border-cyan-500
                     transition-colors duration-150"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50
                   text-black font-mono text-xs font-bold tracking-widest uppercase
                   rounded-lg py-3 mt-2
                   transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_theme(colors.cyan.400)] animate-pulse" />
          <span className="font-mono text-xs tracking-[.15em] uppercase text-slate-300">
            NyanLook
          </span>
        </div>

        <h1 className="text-2xl font-medium text-white mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-8">
          Enter your credentials to access the dashboard.
        </p>

        <Suspense
          fallback={<div className="text-slate-500 text-sm">Loading…</div>}
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
