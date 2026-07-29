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
    <div className="flex flex-1 items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">{mode === "login" ? "로그인" : "회원가입"}</h1>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded px-3 py-2"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-black text-white rounded px-3 py-2 disabled:opacity-50"
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="text-sm text-gray-500 underline"
        >
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </form>
    </div>
  );
}
