"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { getMe, logout as apiLogout, UNAUTHORIZED_EVENT } from "@/lib/api";

const SESSION_CHECK_INTERVAL_MS = 30_000;

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    const ok = await getMe();
    setIsAuthenticated(ok);
  }, []);

  useEffect(() => {
    // 마운트 시 서버에 세션(httpOnly 쿠키) 유효성을 확인하는 데이터 패칭이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkSession().finally(() => setIsLoading(false));
  }, [checkSession]);

  useEffect(() => {
    // 쿠키는 JS가 만료 시각을 읽을 수 없으니, 가만히 있다가 만료되는 경우를 잡기 위해 주기적으로 재확인한다.
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkSession]);

  const logout = useCallback(() => {
    apiLogout();
    setIsAuthenticated(false);
  }, []);

  useEffect(() => {
    // API 호출 중 세션이 만료/무효로 판명되면(401/403) 전역적으로 로그아웃 처리한다.
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  function login() {
    setIsAuthenticated(true);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
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
