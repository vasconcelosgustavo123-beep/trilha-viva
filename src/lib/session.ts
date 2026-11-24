import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  avatar_emoji: string;
  avatar_color: string;
  points: number;
  banned: boolean;
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      return {
        user: u.user,
        profile: profile as Profile | null,
        isAdmin: !!roles?.some((r) => r.role === "admin"),
      };
    },
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("points", { ascending: false });
      const list = (data ?? []) as Profile[];
      return { list, byId: Object.fromEntries(list.map((p) => [p.id, p])) as Record<string, Profile> };
    },
  });
}
