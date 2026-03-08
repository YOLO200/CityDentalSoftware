import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (data: { name: string; email: string; phone: string; password: string }) => Promise<string | null>;
  // TODO: Uncomment when SMS provider is connected to Supabase
  // sendPhoneOtp: (phone: string) => Promise<string | null>;
  // verifyPhoneOtp: (phone: string, token: string) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: (user.user_metadata?.name as string) ?? "",
    email: user.email ?? "",
    phone: (user.user_metadata?.phone as string) ?? (user.phone ?? ""),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? toAuthUser(session.user) : null);
      setIsLoading(false);
    });

    // Keep auth state in sync (token refresh, sign-out from another tab, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? toAuthUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signup = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, phone: data.phone } },
    });
    return error ? error.message : null;
  };

  // TODO: Uncomment when SMS provider is connected to Supabase
  // const sendPhoneOtp = async (phone: string): Promise<string | null> => {
  //   const { error } = await supabase.auth.signInWithOtp({ phone });
  //   return error ? error.message : null;
  // };

  // const verifyPhoneOtp = async (phone: string, token: string): Promise<string | null> => {
  //   const { error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  //   return error ? error.message : null;
  // };

  const logout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will set user to null automatically
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
