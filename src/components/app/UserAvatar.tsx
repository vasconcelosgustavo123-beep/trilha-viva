import type { Profile } from "@/lib/session";
import { cn } from "@/lib/utils";

export function UserAvatar({ profile, size = 40, className }: { profile?: Profile | null | undefined; size?: number; className?: string | undefined }) {
  if (!profile) return <div className={cn("rounded-full bg-muted", className)} style={{ width: size, height: size }} />;
  if (profile.avatar_url)
    return <img src={profile.avatar_url} alt={profile.display_name} className={cn("rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  return (
    <div
      className={cn("flex items-center justify-center rounded-full", className)}
      style={{ width: size, height: size, background: profile.avatar_color, fontSize: size * 0.5 }}
      aria-label={profile.display_name}
    >
      {profile.avatar_emoji}
    </div>
  );
}
