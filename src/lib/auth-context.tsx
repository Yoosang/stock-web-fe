"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { UNAUTHORIZED_EVENT } from "@/lib/api";

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const STORAGE_KEY = "stock-market-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage는 서버 렌더링 시점엔 없으므로 마운트 후 클라이언트에서만 읽어야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(localStorage.getItem(STORAGE_KEY));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  useEffect(() => {
    // API 호출 중 토큰이 만료/무효로 판명되면(401/403) 전역적으로 로그아웃 처리한다.
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  function login(newToken: string) {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
