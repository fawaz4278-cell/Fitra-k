"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Segmented } from "@/components/ui";

const inputClass =
  "w-full rounded-xl bg-ios-card px-4 py-3.5 text-[17px] text-white placeholder:text-ios-label3 outline-none focus:ring-2 focus:ring-ios-blue";
const buttonClass =
  "w-full rounded-xl bg-ios-blue py-3.5 text-[17px] font-semibold text-white disabled:opacity-40";

function PasswordForm({ email, setEmail }: { email: string; setEmail: (v: string) => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      setError(
        error.message === "Invalid login credentials"
          ? "Wrong email or password. No password yet? Sign in with an email code, then tap Password on Home."
          : error.message,
      );
    } else {
      window.location.replace("/");
    }
  }

  async function signUp() {
    setBusy(true);
    setError("");
    setInfo("");
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setError(error.message);
    else if (data.session) window.location.replace("/");
    else setInfo("Account created. Confirm it from the email we sent, then sign in here.");
  }

  const ready = email.trim().length > 3 && password.length >= 6;

  return (
    <form onSubmit={signIn} className="w-full space-y-4">
      <input
        type="email"
        required
        autoComplete="username"
        inputMode="email"
        placeholder="you@example.com"
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
      <button type="submit" disabled={busy || !ready} className={buttonClass}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <button
        type="button"
        onClick={signUp}
        disabled={busy || !ready}
        className="w-full py-1 text-[15px] text-ios-blue disabled:opacity-40"
      >
        New here? Create account
      </button>
      {error && <p className="text-center text-[15px] text-ios-red">{error}</p>}
      {info && <p className="text-center text-[15px] text-ios-green">{info}</p>}
    </form>
  );
}

function CodeForm({ email, setEmail, initialError }: { email: string; setEmail: (v: string) => void; initialError: string }) {
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [info, setInfo] = useState("");

  async function sendEmail(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setStep("code");
      setCode("");
      setInfo(`We emailed a sign-in code to ${email.trim()}.`);
    }
  }

  // Typing the code signs in this app directly. On iPhone the home-screen app doesn't share
  // a login with Safari, so tapping the email link would only sign in Safari.
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await createClient().auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
    if (error) {
      setBusy(false);
      setError(error.message);
    } else {
      window.location.replace("/");
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={verifyCode} className="w-full space-y-4">
        <p className="text-[15px] text-ios-label2">{info}</p>
        <input
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={10}
          placeholder="Code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className={`${inputClass} text-center text-[24px] tracking-[0.3em]`}
        />
        <button type="submit" disabled={busy || code.length < 6} className={buttonClass}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        {error && <p className="text-center text-[15px] text-ios-red">{error}</p>}
        <div className="flex justify-between text-[15px]">
          <button type="button" onClick={() => { setStep("email"); setError(""); }} className="text-ios-blue">
            Change email
          </button>
          <button type="button" disabled={busy} onClick={() => sendEmail()} className="text-ios-blue disabled:opacity-40">
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendEmail} className="w-full space-y-4">
      <input
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <button type="submit" disabled={busy || !email} className={buttonClass}>
        {busy ? "Sending…" : "Email me a sign-in code"}
      </button>
      {error && <p className="text-center text-[15px] text-ios-red">{error}</p>}
    </form>
  );
}

function LoginForm() {
  const params = useSearchParams();
  const linkError = params.get("error") ? "That link was invalid or expired." : "";
  const [mode, setMode] = useState<"password" | "code">(linkError ? "code" : "password");
  const [email, setEmail] = useState("");

  return (
    <div className="w-full space-y-5">
      <Segmented
        options={[
          { value: "password", label: "Password" },
          { value: "code", label: "Email code" },
        ]}
        value={mode}
        onChange={setMode}
      />
      {mode === "password" ? (
        <PasswordForm email={email} setEmail={setEmail} />
      ) : (
        <CodeForm email={email} setEmail={setEmail} initialError={linkError} />
      )}
    </div>
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
