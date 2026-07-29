"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated) {
      router.replace("/login");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return { ...auth, ready: !auth.isLoading && auth.isAuthenticated };
}
