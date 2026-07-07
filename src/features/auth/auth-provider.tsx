"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { bootstrapSession, onSessionExpired } from "@/lib/api/client";
import { tokenStore } from "@/lib/auth/token-store";
import { authApi } from "./api";
import { AuthPayload, AuthUser, Role } from "./schemas";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthPayload>;
  register: (email: string, password: string) => Promise<AuthPayload>;
  logout: () => Promise<void>;
  /** Re-lee /auth/me (p. ej. tras activar un perfil, los roles cambian). */
  refreshUser: () => Promise<AuthUser | null>;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  // rehidratación al montar: rota el refresh persistido y carga /auth/me
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ok = await bootstrapSession();
      if (cancelled) return;
      if (!ok) {
        setStatus("anonymous");
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          tokenStore.clear();
          setStatus("anonymous");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // sesión muerta (refresh reusado/expirado) → estado anónimo global
  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus("anonymous");
      }),
    [],
  );

  const login = useCallback(async (email: string, password: string) => {
    const payload = await authApi.login(email, password);
    setUser(payload.user);
    setStatus("authenticated");
    return payload;
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const payload = await authApi.register(email, password);
    setUser(payload.user);
    setStatus("authenticated");
    return payload;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
      return me;
    } catch {
      return null;
    }
  }, []);

  const hasRole = useCallback(
    (role: Role) => user?.roles.includes(role) ?? false,
    [user],
  );

  return (
    <AuthContext.Provider
      value={{ status, user, login, register, logout, refreshUser, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
