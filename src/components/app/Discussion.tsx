import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useProfiles } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { ReportButton } from "./ReportButton";

const EMOJIS = ["👍", "❤️", "😂", "🤯", "🔥", "👏"];

export function Discussion({ targetId }: { targetId: string }) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: profiles } = useProfiles();
  const [body, setBody] = useState("");
  const key = ["discussion", targetId];
  const { data } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [c, r] = await Promise.all([
        supabase.from("comments").select("*").eq("target_id", targetId).eq("archived", false).order("created_at", { ascending: false }),
        supabase.from("reactions").select("*").eq("target_id", targetId),
      ]);
      return { comments: c.data ?? [], reactions: r.data ?? [] };
    },
  });
  const uid = me?.user.id;
  async function toggle(emoji: string) {
    if (!uid) return;
    const mine = data?.reactions.find((r) => r.emoji === emoji && r.user_id === uid);
    const { error } = mine
      ? await supabase.from("reactions").delete().match({ user_id: uid, target_id: targetId, emoji })
      : await supabase.from("reactions").insert({ user_id: uid, target_id: targetId, emoji });
    if (error) toast.error("Não foi possível reagir.");
    qc.invalidateQueries({ queryKey: key });
  }
  async function post() {
    const text = body.trim().slice(0, 280);
    if (!text || !uid) return;
    const { error } = await supabase.from("comments").insert({ user_id: uid, target_id: targetId, body: text });
    if (error) return toast.error(me?.profile?.banned ? "Sua conta está suspensa." : error.message);
    setBody("");
    qc.invalidateQueries({ queryKey: key });
  }
  async function remove(id: string) {
    await supabase.from("comments").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: key });
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {EMOJIS.map((e) => {
          const count = data?.reactions.filter((r) => r.emoji === e).length ?? 0;
          const mine = data?.reactions.some((r) => r.emoji === e && r.user_id === uid);
          return (
            <button key={e} onClick={() => toggle(e)} className={`rounded-full border px-3 py-1 text-sm transition ${mine ? "border-primary bg-accent" : "bg-card hover:bg-muted"}`}>
              {e} {count > 0 && <span className="ml-1 font-semibold">{count}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input value={body} maxLength={280} onChange={(e) => setBody(e.target.value)} placeholder="Comentário curto (até 280 caracteres)" onKeyDown={(e) => e.key === "Enter" && post()} />
        <Button onClick={post}>Comentar</Button>
      </div>
      <ul className="space-y-3">
        {data?.comments.map((c) => {
          const p = profiles?.byId[c.user_id];
          return (
            <li key={c.id} className="flex gap-3 rounded-xl border bg-card p-3">
              <UserAvatar profile={p} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{p?.display_name ?? "Usuário"}</div>
                <p className="break-words text-sm">{c.body}</p>
              </div>
              {c.user_id === uid || me?.isAdmin ? (
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => remove(c.id)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
              ) : (
                <ReportButton type="comment" targetId={c.id} targetUserId={c.user_id} />
              )}
            </li>
          );
        })}
        {data && data.comments.length === 0 && <li className="text-sm text-muted-foreground">Seja o primeiro a comentar.</li>}
      </ul>
    </section>
  );
}
