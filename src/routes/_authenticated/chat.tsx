import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mic, Square, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe, useProfiles } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/app/UserAvatar";
import { ReportButton } from "@/components/app/ReportButton";
import { uploadMedia } from "@/lib/media";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "Chat — Trilha" }, { name: "description", content: "Grupo Geral, grupos e mensagens diretas." }, { property: "og:title", content: "Chat — Trilha" }, { property: "og:description", content: "Grupo Geral, grupos e mensagens diretas." }] }),
  component: Chat,
});

const GENERAL = "00000000-0000-0000-0000-000000000001";
const AUDIO_PREFIX = "__TRILHA_AUDIO__:";

function Chat() {
  const { data: me } = useMe();
  const { data: profiles } = useProfiles();
  const qc = useQueryClient();
  const uid = me?.user.id;
  const [room, setRoom] = useState(GENERAL);
  const [text, setText] = useState("");
  const [groupName, setGroupName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const bottom = useRef<HTMLDivElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recordingStream = useRef<MediaStream | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [sendingAudio, setSendingAudio] = useState(false);

  useEffect(() => () => {
    recordingStream.current?.getTracks().forEach((track) => track.stop());
    if (audioPreview) URL.revokeObjectURL(audioPreview);
  }, [audioPreview]);

  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: async () => (await supabase.from("chat_rooms").select("*, room_members(user_id)").order("created_at")).data ?? [] });
  const { data: requests } = useQuery({ queryKey: ["dm-requests"], queryFn: async () => (await supabase.from("dm_requests").select("*")).data ?? [] });
  const { data: messages } = useQuery({ queryKey: ["messages", room], queryFn: async () => (await supabase.from("messages").select("*").eq("room_id", room).order("created_at").limit(300)).data ?? [] });

  useEffect(() => {
    const ch = supabase.channel(`msg-${room}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `room_id=eq.${room}` }, () => qc.invalidateQueries({ queryKey: ["messages", room] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [room, qc]);
  useEffect(() => { bottom.current?.scrollIntoView(); }, [messages]);

  const roomName = (r: NonNullable<typeof rooms>[number]) => r.kind === "dm" ? "💬 " + (profiles?.byId[r.room_members.find((m) => m.user_id !== uid)?.user_id ?? ""]?.display_name ?? "Conversa") : r.kind === "general" ? "👥 Grupo Geral" : "🔒 " + r.name;

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return toast.error("Este navegador não oferece suporte à gravação de áudio.");
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStream.current = stream;
      audioChunks.current = [];
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((type) => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: mediaRecorder.mimeType || "audio/webm" });
        if (blob.size > 0) {
          setAudioBlob(blob);
          setAudioPreview(URL.createObjectURL(blob));
        } else {
          toast.error("A gravação ficou vazia. Tente novamente.");
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStream.current = null;
        setRecording(false);
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível acessar o microfone.";
      toast.error(message.includes("Permission") || message.includes("NotAllowed") ? "Permita o acesso ao microfone nas configurações do navegador." : message);
    }
  }

  function stopRecording() {
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  function discardAudio() {
    if (audioPreview) URL.revokeObjectURL(audioPreview);
    setAudioPreview(null);
    setAudioBlob(null);
  }

  async function send() {
    if (!uid || sendingAudio || recording) return;
    let body = text.trim().slice(0, 1000);
    if (audioBlob) {
      setSendingAudio(true);
      try {
        const extension = audioBlob.type.includes("mp4") ? "m4a" : "webm";
        const file = new File([audioBlob], `mensagem-de-voz-${Date.now()}.${extension}`, { type: audioBlob.type || "audio/webm" });
        const url = await uploadMedia(file, uid, "chat-audio");
        body = `${AUDIO_PREFIX}${url}`;
      } catch (error) {
        toast.error(error instanceof Error ? `Não foi possível enviar o áudio: ${error.message}` : "Não foi possível enviar o áudio.");
        setSendingAudio(false);
        return;
      }
    }
    if (!body) { setSendingAudio(false); return; }
    const { error } = await supabase.from("messages").insert({ room_id: room, user_id: uid, body });
    if (error) {
      toast.error(me?.profile?.banned ? "Conta suspensa." : error.message);
      setSendingAudio(false);
      return;
    }
    setText("");
    discardAudio();
    setSendingAudio(false);
  }
  async function createGroup() {
    if (!groupName.trim() || !uid) return;
    const { data, error } = await supabase.from("chat_rooms").insert({ name: groupName.trim(), kind: "group", created_by: uid }).select().single();
    if (error || !data) return toast.error(error?.message ?? "Erro");
    await supabase.from("room_members").insert([uid, ...picked].map((user_id) => ({ room_id: data.id, user_id })));
    setGroupName(""); setPicked([]);
    qc.invalidateQueries({ queryKey: ["rooms"] });
    setRoom(data.id);
  }
  async function requestDm(to: string) {
    const { error } = await supabase.from("dm_requests").insert({ from_id: uid!, to_id: to });
    if (error) return toast.error("Pedido já enviado.");
    toast.success("Pedido enviado. A pessoa precisa autorizar.");
    qc.invalidateQueries({ queryKey: ["dm-requests"] });
  }
  async function respond(id: string, accept: boolean) {
    const { data, error } = await supabase.rpc("respond_dm", { _req: id, _accept: accept });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["dm-requests"] }); qc.invalidateQueries({ queryKey: ["rooms"] });
    if (data) setRoom(data);
  }

  const others = (profiles?.list ?? []).filter((p) => p.id !== uid && !p.banned);
  const incoming = requests?.filter((r) => r.to_id === uid && r.status === "pending") ?? [];
  const contacted = new Set(requests?.flatMap((r) => [r.from_id, r.to_id]));

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <aside className="space-y-5">
        <div className="space-y-1">{rooms?.map((r) => <button key={r.id} onClick={() => setRoom(r.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${room === r.id ? "bg-accent font-semibold" : "hover:bg-muted"}`}>{roomName(r)}</button>)}</div>
        {incoming.length > 0 && <div className="rounded-xl border bg-card p-3"><h3 className="mb-2 text-sm font-bold">Pedidos de conversa</h3>{incoming.map((r) => <div key={r.id} className="flex items-center gap-2 py-1 text-sm"><span className="flex-1">{profiles?.byId[r.from_id]?.display_name}</span><Button size="sm" onClick={() => respond(r.id, true)}>Autorizar</Button><Button size="sm" variant="ghost" onClick={() => respond(r.id, false)}>Recusar</Button></div>)}</div>}
        <div className="rounded-xl border bg-card p-3">
          <h3 className="mb-2 text-sm font-bold">Jogadores</h3>
          <div className="max-h-56 space-y-1 overflow-y-auto">{others.map((p) => (
            <div key={p.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={picked.includes(p.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, p.id] : picked.filter((x) => x !== p.id))} aria-label="Selecionar para grupo" />
              <UserAvatar profile={p} size={22} /><span className="flex-1 truncate">{p.display_name}</span>
              {!contacted.has(p.id) && <button className="text-xs text-primary underline" onClick={() => requestDm(p.id)}>Pedir DM</button>}
            </div>))}</div>
          <div className="mt-3 flex gap-2"><Input placeholder="Nome do grupo" value={groupName} onChange={(e) => setGroupName(e.target.value)} /><Button size="sm" onClick={createGroup} disabled={!picked.length}>Criar</Button></div>
        </div>
      </aside>
      <section className="flex h-[70vh] flex-col rounded-2xl border bg-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages?.map((m) => { const p = profiles?.byId[m.user_id]; return (
            <div key={m.id} className={`flex gap-2 ${m.user_id === uid ? "flex-row-reverse" : ""}`}>
              <UserAvatar profile={p} size={30} />
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.user_id === uid ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div className="text-xs font-bold opacity-80">{p?.display_name}</div>
                {m.body.startsWith(AUDIO_PREFIX) ? (
                  <audio className="mt-1 max-w-full" controls preload="metadata" src={m.body.slice(AUDIO_PREFIX.length)} aria-label={`Áudio enviado por ${p?.display_name ?? "usuário"}`} />
                ) : <div className="break-words">{m.body}</div>}
              </div>
              {m.user_id !== uid && <ReportButton type="message" targetId={m.id} targetUserId={m.user_id} />}
            </div>); })}
          <div ref={bottom} />
        </div>
        <div className="space-y-2 border-t p-3">
          {audioPreview && (
            <div className="flex items-center gap-2 rounded-lg bg-muted p-2">
              <audio className="min-w-0 flex-1" controls src={audioPreview} />
              <Button type="button" size="icon" variant="ghost" onClick={discardAudio} aria-label="Descartar áudio"><X className="h-4 w-4" /></Button>
            </div>
          )}
          <div className="flex gap-2">
            <Input value={text} maxLength={1000} disabled={!!audioBlob || recording || sendingAudio} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder={audioBlob ? "Áudio pronto para enviar" : recording ? "Gravando áudio…" : "Escreva uma mensagem"} />
            {recording ? (
              <Button type="button" variant="destructive" onClick={stopRecording} aria-label="Parar gravação"><Square className="mr-1 h-4 w-4" /> Parar</Button>
            ) : !audioBlob ? (
              <Button type="button" variant="outline" onClick={startRecording} aria-label="Gravar áudio" title="Gravar áudio"><Mic className="h-4 w-4" /></Button>
            ) : null}
            <Button onClick={send} disabled={recording || sendingAudio || (!text.trim() && !audioBlob)}>{sendingAudio ? "Enviando…" : "Enviar"}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
