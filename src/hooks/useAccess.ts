import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UseAccessResult {
  loading: boolean;
  signedIn: boolean | null;
  hasAccess: boolean;
}

export function useAccess(): UseAccessResult {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (active) {
            setSignedIn(false);
            setHasAccess(false);
            setLoading(false);
          }
          return;
        }

        if (active) {
          setSignedIn(true);
        }

        const { data: activeAccess, error } = await supabase.rpc("has_active_access", {
          _user_id: session.user.id,
        });

        if (error) {
          console.error("Error calling has_active_access RPC:", error);
          if (active) {
            setHasAccess(false);
          }
        } else {
          if (active) {
            setHasAccess(Boolean(activeAccess));
          }
        }
      } catch (err) {
        console.error("Failed to check user access status:", err);
        if (active) {
          setHasAccess(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        if (active) {
          setSignedIn(false);
          setHasAccess(false);
          setLoading(false);
        }
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (active) {
          setSignedIn(true);
          setLoading(true);
        }
        if (session) {
          try {
            const { data: activeAccess } = await supabase.rpc("has_active_access", {
              _user_id: session.user.id,
            });
            if (active) {
              setHasAccess(Boolean(activeAccess));
            }
          } catch (e) {
            console.error("Failed to re-check user access status on auth change:", e);
          }
        }
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { loading, signedIn, hasAccess };
}
