"use client";

import { useEffect, useState } from "react";
import { Section, Sheet } from "@/components/ui";
import { createClient } from "@/lib/supabase";

const MIN_LENGTH = 6;

/** Lets a signed-in user set or change their password, so they can sign in without email. */
export function SetPasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setConfirm("");
      setError("");
      setDone(false);
    }
  }, [open]);

  const valid = password.length >= MIN_LENGTH && password === confirm;

  async function save() {
    setSaving(true);
    setError("");
    const { error } = await createClient().auth.updateUser({ password });
    setSaving(false);
    if (error) setError(error.message);
    else setDone(true);
  }

  const inputClass = "w-full bg-transparent py-3 text-[17px] text-white placeholder:text-ios-label3 outline-none";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Password"
      action={
        done ? (
          <button onClick={onClose} className="text-[17px] font-semibold text-ios-blue">
            Done
          </button>
        ) : (
          <button
            onClick={save}
            disabled={!valid || saving}
            className="text-[17px] font-semibold text-ios-blue disabled:opacity-30"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )
      }
    >
      {done ? (
        <p className="py-6 text-center text-[17px] text-ios-green">
          Password saved. You can now sign in with your email and password.
        </p>
      ) : (
        <>
          <Section footer={`At least ${MIN_LENGTH} characters.`}>
            <div className="border-b border-ios-sep/70 px-4">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="px-4">
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </div>
          </Section>
          {confirm && password !== confirm && (
            <p className="mx-4 -mt-3 text-[15px] text-ios-red">Passwords don&apos;t match.</p>
          )}
          {error && <p className="mx-4 text-[15px] text-ios-red">{error}</p>}
        </>
      )}
    </Sheet>
  );
}
