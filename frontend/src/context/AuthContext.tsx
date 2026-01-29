import React, { createContext, useContext, useMemo, useState } from "react";
import { apiFetch } from "../utils/api";
import type { User } from "../utils/types";

type AuthState = {
  token: string | null;
  user: User | null;
};

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, user: null });

  const value = useMemo<AuthContextValue>(
    () => ({
      token: state.token,
      user: state.user,
      login: async (email: string, password: string) => {
        const res = await apiFetch<{ token: string; user: User }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          }
        );
        setState({ token: res.token, user: res.user });
        return res.user;
      },
      logout: () => setState({ token: null, user: null }),
    }),
    [state.token, state.user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


