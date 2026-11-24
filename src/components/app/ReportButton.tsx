import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function ReportButton({ type, targetId, targetUserId, label }: { type: "user" | "comment" | "message"; targetId: string; targetUserId?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  async function send() {
    if (!reason.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("reports").insert({ reporter_id: u.user!.id, target_type: type, target_id: targetId, target_user_id: targetUserId ?? null, reason: reason.trim().slice(0, 500) });
    if (error) return toast.error(error.message);
    toast.success("Denúncia enviada para análise.");
    setOpen(false);
    setReason("");
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground" aria-label="Denunciar">
          <Flag className="h-3.5 w-3.5" />
          {label && <span className="ml-1 text-xs">{label}</span>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Denunciar</DialogTitle></DialogHeader>
        <Textarea placeholder="Descreva o motivo" value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        <DialogFooter><Button onClick={send}>Enviar denúncia</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
