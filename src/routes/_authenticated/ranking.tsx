import { createFileRoute } from "@tanstack/react-router";
import { useMe, useProfiles } from "@/lib/session";
import { UserAvatar } from "@/components/app/UserAvatar";
import { ReportButton } from "@/components/app/ReportButton";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Trilha" }, { name: "description", content: "Pódio e ranking dos jogadores." }, { property: "og:title", content: "Ranking — Trilha" }, { property: "og:description", content: "Pódio e ranking dos jogadores." }] }),
  component: Ranking,
});

const PODIUM = [
  { idx: 1, h: "h-28", color: "bg-silver", medal: "🥈" },
  { idx: 0, h: "h-40", color: "bg-gold", medal: "🥇" },
  { idx: 2, h: "h-20", color: "bg-bronze", medal: "🥉" },
];

function Ranking() {
  const { data } = useProfiles();
  const { data: me } = useMe();
  const list = (data?.list ?? []).filter((p) => !p.banned);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-extrabold">🏆 Ranking</h1>
      <div className="mt-10 grid grid-cols-3 items-end gap-3">
        {PODIUM.map(({ idx, h, color, medal }) => {
          const p = list[idx];
          return (
            <div key={idx} className="flex flex-col items-center">
              {p ? (<><UserAvatar profile={p} size={idx === 0 ? 80 : 60} className="ring-4 ring-background" /><div className="mt-2 text-center font-bold">{p.display_name}</div><div className="text-sm text-muted-foreground">{p.points} pts</div></>) : <div className="text-muted-foreground">—</div>}
              <div className={`mt-3 flex w-full items-start justify-center rounded-t-2xl border-2 border-foreground/80 pt-2 text-3xl ${h} ${color}`}>{medal}</div>
            </div>
          );
        })}
      </div>
      <ol className="mt-8 divide-y rounded-2xl border bg-card">
        {list.map((p, i) => (
          <li key={p.id} className={`flex items-center gap-3 px-4 py-3 ${p.id === me?.user.id ? "bg-accent" : ""}`}>
            <span className="w-8 font-display text-lg font-bold text-muted-foreground">{i + 1}º</span>
            <UserAvatar profile={p} size={36} />
            <span className="flex-1 font-semibold">{p.display_name}</span>
            <span className="font-display font-bold">{p.points}</span>
            {p.id !== me?.user.id && <ReportButton type="user" targetId={p.id} targetUserId={p.id} />}
          </li>
        ))}
      </ol>
    </div>
  );
}
