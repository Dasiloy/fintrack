import type { SessionUser } from '@fintrack/types/interfaces/session_user.interface';

export function sessionToUser(
  session: {
    user?: { id: string; name?: string | null; email?: string | null; image?: string | null };
  } | null,
): SessionUser {
  if (!session?.user?.name || !session?.user?.email) return null as unknown as SessionUser;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    avatar: session.user.image ?? undefined,
  };
}
