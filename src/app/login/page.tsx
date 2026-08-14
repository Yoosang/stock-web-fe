"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  getErrorMessage,
  login as apiLogin,
  signup as apiSignup,
  sendVerificationCode,
  confirmVerificationCode,
} from "@/lib/api";

const CODE_VALID_SECONDS = 180;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [message, setMessage] = useState<{ text: string; kind: "error" | "success" } | null>(null);
  const [pending, setPending] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!codeSent || verified || remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [codeSent, verified, remainingSeconds]);

  const codeExpired = codeSent && !verified && remainingSeconds <= 0;

  function resetVerification() {
    setCode("");
    setCodeSent(false);
    setVerified(false);
    setRemainingSeconds(0);
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setMessage(null);
    setPassword("");
    resetVerification();
  }

  async function handleSendCode() {
    setMessage(null);
    setPending(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      setVerified(false);
      setCode("");
      setRemainingSeconds(CODE_VALID_SECONDS);
    } catch (err) {
      setMessage({ text: getErrorMessage(err), kind: "error" });
    } finally {
      setPending(false);
    }
  }

  async function handleConfirmCode() {
    setMessage(null);
    setPending(true);
    try {
      await confirmVerificationCode(email, code);
      setVerified(true);
    } catch (err) {
      setMessage({ text: getErrorMessage(err), kind: "error" });
    } finally {
      setPending(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setPending(true);
    try {
      if (mode === "signup") {
        await apiSignup(email, password);
        setMode("login");
        setPassword("");
        resetVerification();
        setMessage({ text: "회원가입이 완료되었습니다. 로그인해 주세요.", kind: "success" });
        return;
      }
      await apiLogin(email, password);
      login();
      router.push("/watchlist");
    } catch (err) {
      setMessage({ text: getErrorMessage(err), kind: "error" });
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
          onChange={(e) => {
            setEmail(e.target.value);
            if (mode === "signup") resetVerification();
          }}
          disabled={mode === "signup" && verified}
          required
          className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-50"
        />

        {mode === "signup" && !verified && (!codeSent || codeExpired) && (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={pending || !email}
            className="rounded-lg border border-border hover:bg-surface-2 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50"
          >
            {codeExpired ? "인증번호 재발송" : "인증메일 발송"}
          </button>
        )}

        {mode === "signup" && codeSent && !verified && !codeExpired && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="인증번호 6자리"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={handleConfirmCode}
                disabled={pending || code.length !== 6}
                className="rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50"
              >
                확인
              </button>
            </div>
            <p className="text-xs text-muted">
              남은 시간 {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
            </p>
          </div>
        )}

        {mode === "signup" && verified && <p className="text-sm text-accent">이메일 인증이 완료되었습니다.</p>}

        {(mode === "login" || verified) && (
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        )}

        {message && (
          <p className={`text-sm ${message.kind === "error" ? "text-up" : "text-accent"}`}>{message.text}</p>
        )}

        <button
          type="submit"
          disabled={pending || (mode === "signup" && !verified)}
          className="rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50"
        >
          {mode === "login" ? "로그인" : "회원가입"}
        </button>
        <button
          type="button"
          onClick={switchMode}
          className="text-sm text-muted hover:text-foreground transition-colors"
        >
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </form>
    </div>
  );
}
