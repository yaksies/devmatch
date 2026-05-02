"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";

import { login, signup } from "./actions";

type Mode = "login" | "signup";

type Props = {
  initialMessage: string | null;
};

export function LoginForm({ initialMessage }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [message, setMessage] = useState<string | null>(initialMessage);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const confirmInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  useEffect(() => {
    if (mode === "signup") {
      window.setTimeout(() => confirmInputRef.current?.focus(), 220);
    }
  }, [mode]);

  function switchMode(nextMode: Mode) {
    if (nextMode === mode) return;
    setMode(nextMode);
    setMessage(null);
    setConfirmPassword("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (mode !== "signup") {
      return;
    }

    if (!confirmPassword) {
      event.preventDefault();
      setMessage("Please confirm your passcode.");
      confirmInputRef.current?.focus();
      return;
    }

    if (password !== confirmPassword) {
      event.preventDefault();
      setMessage("Passcodes do not match.");
      confirmInputRef.current?.focus();
    }
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-20 sm:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.06),transparent_30%)]" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-[var(--border)] bg-[var(--surface)]/95 p-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            Account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {mode === "login"
              ? "Log in to keep swiping and chat with your matches."
              : "Set up a profile, then confirm your passcode before joining."}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
              mode === "login"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg shadow-black/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
              mode === "signup"
                ? "bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg shadow-black/20"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Sign up
          </button>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
              Passcode
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-16 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
              mode === "signup"
                ? "max-h-40 translate-y-0 opacity-100"
                : "max-h-0 -translate-y-2 opacity-0"
            }`}
          >
            <div className="pt-1">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-[var(--foreground)]"
                >
                  Confirm passcode
                </label>
                <div className="relative">
                  <input
                    ref={confirmInputRef}
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 pr-16 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {message ? (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-300">
              {message}
            </p>
          ) : null}

          <div className="mt-2">
            {mode === "login" ? (
              <button
                formAction={login}
                className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-fg)] transition-transform transition-opacity hover:opacity-90 active:scale-[0.99]"
              >
                Log in
              </button>
            ) : (
              <button
                formAction={signup}
                className="w-full rounded-full bg-[var(--accent)] py-3 text-sm font-medium text-[var(--accent-fg)] transition-transform transition-opacity hover:opacity-90 active:scale-[0.99]"
              >
                Create account
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}