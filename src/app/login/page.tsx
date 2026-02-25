"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "options" | "email" | "phone" | "phone-verify";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { hd: "goodnessgardens.net" },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  async function handlePhoneSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setMode("phone-verify");
      setLoading(false);
    }
  }

  async function handlePhoneVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="bg-[var(--surface-1)] rounded-xl shadow-sm border border-[var(--border)] p-8 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[var(--accent)] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">GG</span>
          </div>
        </div>
        <h1 className="text-xl font-semibold [color:var(--text)] mb-1">
          Goodness Gardens
        </h1>
        <p className="text-sm [color:var(--text-2)] mb-6">Task Manager</p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Options mode */}
        {mode === "options" && (
          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm font-medium [color:var(--text-2)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[var(--surface-1)] px-2 [color:var(--text-2)]">or</span>
              </div>
            </div>

            <button
              onClick={() => setMode("email")}
              className="w-full flex items-center justify-center gap-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm font-medium [color:var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Sign in with Email
            </button>
            <button
              onClick={() => setMode("phone")}
              className="w-full flex items-center justify-center gap-2 bg-[var(--surface-1)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-sm font-medium [color:var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Sign in with Phone
            </button>
          </div>
        )}

        {/* Email mode */}
        {mode === "email" && (
          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] [color:var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] [color:var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("options"); setError(""); }}
              className="w-full text-sm [color:var(--text-2)] hover:underline"
            >
              Back to options
            </button>
          </form>
        )}

        {/* Phone mode */}
        {mode === "phone" && (
          <form onSubmit={handlePhoneSendOtp} className="space-y-3">
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] [color:var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Sending code…" : "Send verification code"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("options"); setError(""); }}
              className="w-full text-sm [color:var(--text-2)] hover:underline"
            >
              Back to options
            </button>
          </form>
        )}

        {/* Phone verify mode */}
        {mode === "phone-verify" && (
          <form onSubmit={handlePhoneVerify} className="space-y-3">
            <p className="text-sm [color:var(--text-2)]">
              Enter the code sent to {phone}
            </p>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface-1)] [color:var(--text)] text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent)] text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify & Sign in"}
            </button>
            <button
              type="button"
              onClick={() => { setMode("phone"); setError(""); }}
              className="w-full text-sm [color:var(--text-2)] hover:underline"
            >
              Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
