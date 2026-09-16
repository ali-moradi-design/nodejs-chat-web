import { useState, type FormEvent } from 'react';
import { useChatStore } from '@/shared/lib/chat';
import { createRoom, joinRoom } from '@/features/join-room';
import { ConnectionPill } from '@/features/presence';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib';

export function ChatSidebar() {
  const rooms = useChatStore((s) => s.rooms);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const presenceByRoom = useChatStore((s) => s.presenceByRoom);
  const displayName = useChatStore((s) => s.displayName);
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const toggleTheme = useChatStore((s) => s.toggleTheme);
  const theme = useChatStore((s) => s.theme);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const n = newName.trim();
    if (!n) return;
    createRoom(n);
    setNewName('');
    setCreating(false);
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[280px] flex-col border-r border-border bg-panel',
          'transition-transform duration-200 md:static md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted">Realtime</p>
            <h2 className="text-lg font-semibold tracking-tight">Chat</h2>
          </div>
          <ConnectionPill />
        </div>

        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="text-xs text-muted">Guest session</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Rooms
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setCreating((v) => !v)}>
            {creating ? 'Cancel' : '+ New'}
          </Button>
        </div>

        {creating ? (
          <form onSubmit={onCreate} className="px-3 pb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Room name"
              maxLength={48}
              className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </form>
        ) : null}

        <nav className="flex-1 overflow-y-auto px-2 pb-4" aria-label="Rooms">
          <ul className="space-y-0.5">
            {rooms.map((room) => {
              const count = presenceByRoom[room.id]?.length ?? 0;
              const active = room.id === activeRoomId;
              return (
                <li key={room.id}>
                  <button
                    type="button"
                    onClick={() => {
                      joinRoom(room.id);
                      setSidebarOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                      active
                        ? 'bg-accent/15 text-foreground'
                        : 'text-muted hover:bg-elevated hover:text-foreground',
                    )}
                  >
                    <span className="truncate font-medium"># {room.name}</span>
                    <span
                      className={cn(
                        'ml-2 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums',
                        active ? 'bg-accent/25 text-accent-fg' : 'bg-elevated text-muted',
                      )}
                      title={`${count} online`}
                    >
                      {count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
