import { useAuth } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variable.",
  );
}

export function useSupabaseClient() {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      createClient<Database>(supabaseUrl, supabaseAnonKey, {
        accessToken: () => getToken(),
      }),
    [getToken],
  );
}
