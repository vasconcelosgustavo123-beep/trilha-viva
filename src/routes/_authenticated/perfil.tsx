import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { uploadMedia } from "@/lib/media";
import { UserAvatar } from "@/components/app/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Trilha" }, { name: "description", content: "Personalize seu avatar." }, { property: "og:title", content: "Meu perfil" }, { property: "og:description", content: "Personalize seu avatar." }] }),
  component: Perfil,
});

const EMOJIS = ["🦉", "🦊", "🐼", "🐸", "🐙", "🦄", "🐯", "🐧", "🚀", "🧠", "⚡", "🌵"];
const COLORS = ["#2563eb", "#e11d48", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#ca8a04", "#334155"];

function Perfil() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🦉");
  const [color, setColor] = useState<string>("#2563eb");
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!me?.profile) return;
    setName(me.profile.display_name); setEmoji(me.profile.avatar_emoji); setColor(me.profile.avatar_color); setPhoto(me.profile.avatar_url);
  }, [me?.profile]);
  if (!me?.profile) return null;
  const preview = { ...me.profile, display_name: name, avatar_emoji: emoji, avatar_color: color, avatar_url: photo };

  async function onFile(f?: File) {
    if (!f) return;
    try { setPhoto(await uploadMedia(f, me!.user.id, "avatar")); } catch (e) { toast.error("Falha no envio da foto"); }
  }
  async function save() {
    const { error } = await supabase.from("profiles").update({ display_name: name.trim().slice(0, 40) || "Estudante", avatar_emoji: emoji, avatar_color: color, avatar_url: photo }).eq("id", me!.user.id);
    if (error) return toast.error(error.message);
    toast.success("Perfil salvo!");
    qc.invalidateQueries({ queryKey: ["me"] }); qc.invalidateQueries({ queryKey: ["profiles"] });
  }
  return (
    <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-[220px_1fr]">
      <div className="flex flex-col items-center rounded-2xl border bg-card p-6">
        <UserAvatar profile={preview} size={120} />
        <div className="mt-3 font-display text-xl font-bold">{name}</div>
        <div className="text-3xl font-extrabold text-primary">{me.profile.points}</div>
        <div className="text-xs text-muted-foreground">pontos</div>
        {me.isAdmin && <span className="mt-2 rounded bg-highlight px-2 py-0.5 text-xs font-bold text-highlight-foreground">ADMIN</span>}
      </div>
      <div className="space-y-5">
        <div><Label>Nome de usuário</Label><Input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Emoji do avatar</Label><div className="mt-2 flex flex-wrap gap-2">{EMOJIS.map((e) => <button key={e} onClick={() => { setEmoji(e); setPhoto(null); }} className={`h-11 w-11 rounded-xl border text-2xl ${emoji === e && !photo ? "border-primary bg-accent" : ""}`}>{e}</button>)}</div></div>
        <div><Label>Cor</Label><div className="mt-2 flex gap-2">{COLORS.map((c) => <button key={c} onClick={() => setColor(c)} aria-label={c} className={`h-9 w-9 rounded-full ${color === c ? "ring-2 ring-foreground ring-offset-2" : ""}`} style={{ background: c }} />)}</div></div>
        <div><Label>Ou envie uma foto</Label><Input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />{photo && <button className="mt-1 text-sm text-muted-foreground underline" onClick={() => setPhoto(null)}>Remover foto</button>}</div>
        <Button onClick={save}>Salvar perfil</Button>
      </div>
    </div>
  );
}
