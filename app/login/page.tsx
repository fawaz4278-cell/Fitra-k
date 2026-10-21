"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

const inputClass =
  "w-full rounded-xl bg-ios-card px-4 py-3.5 text-[17px] text-white placeholder:text-ios-label3 outline-none focus:ring-2 focus:ring-ios-blue";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
    } else {
      window.location.replace("/");
    }
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-[34px] font-bold tracking-tight">Fitrack</h1>
        <p className="mb-8 text-[15px] text-ios-label2">IPPT, weight and daily training for NS.</p>
        <form onSubmit={signIn} className="w-full space-y-4">
          <input
            type="email"
            required
            autoComplete="username"
            inputMode="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full rounded-xl bg-ios-blue py-3.5 text-[17px] font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          {error && <p className="text-center text-[15px] text-ios-red">{error}</p>}
        </form>
      </div>
    </main>
  );
}
