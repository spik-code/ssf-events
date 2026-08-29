"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { MailIcon } from "../icons";

export function LoginForm({ next }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;

    setState("sending");
    setError("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`;

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo,
        // Don't create accounts for strangers who guess the URL.
        shouldCreateUser: true,
      },
    });

    if (err) {
      setState("error");
      setError(err.message);
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="auth-sent" role="status">
        <MailIcon />
        <p>
          Check <b>{email}</b> — the link is valid for one hour and works once.
        </p>
        <button className="btn btn-ghost" onClick={() => setState("idle")} type="button">
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="a-email">Email</label>
        <input
          id="a-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
          placeholder="you@example.com"
        />
      </div>

      {state === "error" && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
        <MailIcon />
        {state === "sending" ? "Sending…" : "Send me a link"}
      </button>
    </form>
  );
}
