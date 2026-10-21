"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    params.get("error") ? "error" : "idle",
  );
  const [message, setMessage] = useState(params.get("error") ? "That link was invalid or expired." : "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
      setMessage("Check your email for the sign-in link.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl bg-ios-card px-4 py-3.5 text-[17px] text-white placeholder:text-ios-label3 outline-none focus:ring-2 focus:ring-ios-blue"
      />
      <button
        type="submit"
        disabled={status === "sending" || !email}
        className="w-full rounded-xl bg-ios-blue py-3.5 text-[17px] font-semibold text-white disabled:opacity-40"
      >
        {status === "sending" ? "Sending…" : "Send magic link"}
      </button>
      {message && (
        <p className={`text-center text-[15px] ${status === "error" ? "text-ios-red" : "text-ios-green"}`}>{message}</p>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center px-6 pt-safe pb-safe">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-[34px] font-bold tracking-tight">Fitrack</h1>
        <p className="mb-8 text-[15px] text-ios-label2">IPPT, weight and daily training for NS.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
