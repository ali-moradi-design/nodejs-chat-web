import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageBubble } from '@/entities/message';
import { TypingIndicator } from '@/features/typing';
import { useChatStore } from '@/shared/lib/chat';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib';

export function ChatThread() {
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const rooms = useChatStore((s) => s.rooms);
  const messages = useChatStore((s) => s.messagesByRoom[activeRoomId] ?? []);
  const userId = useChatStore((s) => s.userId);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const presence = useChatStore((s) => s.presenceByRoom[activeRoomId] ?? []);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [stuckToBottom, setStuckToBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);

  const room = rooms.find((r) => r.id === activeRoomId);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    setStuckToBottom(true);
    setUnseen(0);
  }, []);

  useEffect(() => {
    if (stuckToBottom) {
      scrollToBottom(false);
    } else {
      setUnseen((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new messages
  }, [messages.length, activeRoomId]);

  useEffect(() => {
    setUnseen(0);
    setStuckToBottom(true);
    requestAnimationFrame(() => scrollToBottom(false));
  }, [activeRoomId, scrollToBottom]);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = dist < 80;
    setStuckToBottom(atBottom);
    if (atBottom) setUnseen(0);
  }

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-surface">
      <header className="flex items-center gap-3 border-b border-border px-3 py-3 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open rooms"
          onClick={() => setSidebarOpen(true)}
        >
          ☰
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight">
            # {room?.name ?? activeRoomId}
          </h1>
          <p className="text-xs text-muted">
            {presence.length} online
            {presence.length > 0
              ? ` · ${presence
                  .slice(0, 3)
                  .map((u) => u.displayName)
                  .join(', ')}${presence.length > 3 ? '…' : ''}`
              : ''}
          </p>
        </div>
      </header>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="relative min-h-0 flex-1 overflow-y-auto"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-2xl text-accent-fg">
              ✦
            </div>
            <h2 className="text-lg font-semibold text-foreground">Start the conversation</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              Messages appear here in real time. Say hello in #{room?.name ?? activeRoomId} —
              everyone in the room will see it instantly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-6">
            {messages.map((m, i) => {
              const prev = messages[i - 1];
              const showAvatar =
                !prev ||
                prev.userId !== m.userId ||
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000;
              return (
                <MessageBubble
                  key={m.clientMsgId}
                  message={m}
                  isOwn={m.userId === userId}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!stuckToBottom && unseen > 0 ? (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className={cn(
            'absolute bottom-16 left-1/2 z-10 -translate-x-1/2',
            'rounded-full border border-border bg-panel px-3 py-1.5 text-xs font-medium text-foreground shadow-lg',
            'hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          )}
        >
          {unseen} new message{unseen === 1 ? '' : 's'} ↓
        </button>
      ) : null}

      <TypingIndicator />
    </section>
  );
}
