"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getErrorMessage, login as apiLogin, signup as apiSignup } from "@/lib/api";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (mode === "signup") {
        await apiSignup(email, password);
        setMode("login");
        setError("회원가입이 완료되었습니다. 로그인해 주세요.");
        return;
      }
      await apiLogin(email, password);
      login();
      router.push("/watchlist");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 p-8 rounded-xl border border-border bg-surface"
      >
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Stock<span className="text-accent">Market</span>
          </h1>
          <p className="text-sm text-muted mt-1">{mode === "login" ? "로그인" : "회원가입"}</p>
        </div>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {error && <p className="text-sm text-up">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50"
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </form>
    </div>
  );
}
