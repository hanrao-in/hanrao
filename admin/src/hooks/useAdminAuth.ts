import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  email: string;
};

export type AuthState = {
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
};

export function useAdminAuth(): AuthState {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync cookie helper
  const syncCookie = useCallback((token: string | null) => {
    const secureAttr = window.location.protocol === "https:" ? "; Secure" : "";
    if (token) {
      document.cookie = `admin_session=${token}; path=/; max-age=86400; SameSite=Lax${secureAttr}`;
    } else {
      document.cookie = "admin_session=; path=/; max-age=0; SameSite=Lax";
    }
  }, []);

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && session.user.email) {
        setUser({ id: session.user.id, email: session.user.email });
        syncCookie(session.access_token);
      } else {
        setUser(null);
        syncCookie(null);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && session.user.email) {
        setUser({ id: session.user.id, email: session.user.email });
        syncCookie(session.access_token);
      } else {
        setUser(null);
        syncCookie(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncCookie]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        // Sign in using Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data.user) {
          throw error || new Error("Failed to sign in.");
        }

        // Verify user has admin role
        let isAdmin = false;
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleError) {
          if (roleError.code === "PGRST205" || roleError.message?.includes("does not exist")) {
            console.warn(
              "[Database Warning] 'user_roles' table not found. Bypassing role verification for local development.",
            );
            isAdmin = true;
          } else {
            throw roleError;
          }
        } else if (roleData) {
          isAdmin = true;
        }

        if (!isAdmin) {
          // Sign out immediately if not authorized
          await supabase.auth.signOut();
          throw new Error("Access denied: You do not have administrator privileges.");
        }

        // Successful login
        setUser({ id: data.user.id, email: data.user.email! });
        if (data.session) {
          syncCookie(data.session.access_token);
        }
      } catch (e: any) {
        setUser(null);
        syncCookie(null);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [syncCookie],
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      syncCookie(null);
    } finally {
      setLoading(false);
    }
  }, [syncCookie]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }, []);

  return { user, loading, signIn, signOut, sendPasswordReset };
}
