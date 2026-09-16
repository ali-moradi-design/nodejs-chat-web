import { useChatStore } from '@/shared/lib/chat';

export function TypingIndicator() {
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const userId = useChatStore((s) => s.userId);
  const typing = useChatStore((s) => s.typingByRoom[activeRoomId] ?? {});

  const others = Object.entries(typing)
    .filter(([id]) => id !== userId)
    .map(([, v]) => v.displayName);

  if (others.length === 0) {
    return <div className="h-6 px-6" aria-live="polite" />;
  }

  const label =
    others.length === 1
      ? `${others[0]} is typing…`
      : others.length === 2
        ? `${others[0]} and ${others[1]} are typing…`
        : `${others[0]} and ${others.length - 1} others are typing…`;

  return (
    <div className="h-6 px-4 text-xs text-muted md:px-6" aria-live="polite">
      <span className="inline-flex items-center gap-1.5">
        <span className="flex gap-0.5">
          <span className="h-1 w-1 animate-pulse rounded-full bg-muted" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-muted [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-muted [animation-delay:300ms]" />
        </span>
        {label}
      </span>
    </div>
  );
}
