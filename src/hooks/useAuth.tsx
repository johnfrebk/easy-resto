import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export type AppRole = "admin" | "cajero" | "mesero";

interface AuthState {
  user: User | null;
  role: AppRole | null;
  displayName: string | null;
  loading: boolean;
  sessionReady: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const initialized = useRef(false);

  const fetchUserMeta = async (userId: string) => {
    try {
      const [roleRes, profileRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("display_name").eq("user_id", userId).maybeSingle(),
      ]);
      setRole((roleRes.data?.role as AppRole) ?? null);
      setDisplayName(profileRes.data?.display_name ?? null);
    } catch (err) {
      console.error("Error fetching user meta:", err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchUserMeta(u.id);
      } else {
        setRole(null);
        setDisplayName(null);
      }
      // Always mark as ready when auth state changes
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
        setSessionReady(true);
      }
    });

    // Fallback: if onAuthStateChange hasn't fired within 3s, force ready
    const timeout = setTimeout(() => {
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
        setSessionReady(true);
      }
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setDisplayName(null);
  };

  const isAdmin = () => role === "admin";

  return (
    <AuthContext.Provider value={{ user, role, displayName, loading, sessionReady, signIn, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
