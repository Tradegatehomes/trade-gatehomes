import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

/** Whether the signed-in user is staff. UI hint only — the database policies enforce access. */
export function useStaff() {
  const { user, loading } = useAuth();
  const q = useQuery({
    queryKey: ["is-staff", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_staff", { _user_id: user!.id });
      if (error) return false;
      return Boolean(data);
    },
  });
  return { user, isStaff: q.data ?? false, loading: loading || (!!user && q.isLoading) };
}
