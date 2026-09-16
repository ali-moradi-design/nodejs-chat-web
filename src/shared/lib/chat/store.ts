import { create } from 'zustand';
import type {
  ChatMessage,
  ChatRoom,
  ConnStatus,
  PresenceUser,
} from '@/shared/lib/socket';

type TypingMap = Record<string, Record<string, { displayName: string; at: number }>>;

type ChatState = {
  userId: string | null;
  displayName: string | null;
  connStatus: ConnStatus;
  rooms: ChatRoom[];
  activeRoomId: string;
  messagesByRoom: Record<string, ChatMessage[]>;
  presenceByRoom: Record<string, PresenceUser[]>;
  typingByRoom: TypingMap;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';

  setAuth: (userId: string, displayName: string) => void;
  setConnStatus: (s: ConnStatus) => void;
  setRooms: (rooms: ChatRoom[]) => void;
  setActiveRoom: (roomId: string) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;

  upsertMessages: (roomId: string, messages: ChatMessage[], mode?: 'replace' | 'append' | 'prepend') => void;
  addOptimistic: (message: ChatMessage) => void;
  reconcileAck: (clientMsgId: string, patch: Partial<ChatMessage> & { status?: ChatMessage['status'] }) => void;
  markFailed: (clientMsgId: string) => void;
  applyIncoming: (message: ChatMessage) => void;

  setPresence: (roomId: string, users: PresenceUser[]) => void;
  setTyping: (roomId: string, userId: string, displayName: string, typing: boolean) => void;
};

function dedupeMessages(list: ChatMessage[]): ChatMessage[] {
  const byClient = new Map<string, ChatMessage>();
  const byId = new Map<string, ChatMessage>();
  for (const m of list) {
    const prevClient = byClient.get(m.clientMsgId);
    const prevId = byId.get(m.id);
    // Prefer server-confirmed over pending
    const prefer = (a: ChatMessage | undefined, b: ChatMessage) => {
      if (!a) return b;
      if (a.status === 'pending' && b.status !== 'pending') return b;
      if (b.status === 'pending' && a.status !== 'pending') return a;
      return b.createdAt >= a.createdAt ? b : a;
    };
    const chosen = prefer(prevClient ?? prevId, m);
    byClient.set(chosen.clientMsgId, chosen);
    byId.set(chosen.id, chosen);
  }
  const uniq = new Map<string, ChatMessage>();
  for (const m of byClient.values()) {
    uniq.set(m.clientMsgId, m);
  }
  return [...uniq.values()].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export const useChatStore = create<ChatState>((set, get) => ({
  userId: null,
  displayName: null,
  connStatus: 'offline',
  rooms: [],
  activeRoomId: 'general',
  messagesByRoom: {},
  presenceByRoom: {},
  typingByRoom: {},
  sidebarOpen: true,
  theme: 'dark',

  setAuth: (userId, displayName) => set({ userId, displayName }),
  setConnStatus: (connStatus) => set({ connStatus }),
  setRooms: (rooms) => set({ rooms }),
  setActiveRoom: (activeRoomId) => set({ activeRoomId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
      localStorage.setItem('chatTheme', theme);
      return { theme };
    }),

  upsertMessages: (roomId, messages, mode = 'replace') => {
    set((s) => {
      const prev = s.messagesByRoom[roomId] ?? [];
      let next: ChatMessage[];
      if (mode === 'replace') next = messages;
      else if (mode === 'append') next = [...prev, ...messages];
      else next = [...messages, ...prev];
      return {
        messagesByRoom: {
          ...s.messagesByRoom,
          [roomId]: dedupeMessages(next),
        },
      };
    });
  },

  addOptimistic: (message) => {
    const roomId = message.roomId;
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: dedupeMessages([...(s.messagesByRoom[roomId] ?? []), message]),
      },
    }));
  },

  reconcileAck: (clientMsgId, patch) => {
    set((s) => {
      const nextRooms: Record<string, ChatMessage[]> = {};
      for (const [roomId, list] of Object.entries(s.messagesByRoom)) {
        nextRooms[roomId] = list.map((m) =>
          m.clientMsgId === clientMsgId ? { ...m, ...patch, status: patch.status ?? 'sent' } : m,
        );
      }
      return { messagesByRoom: nextRooms };
    });
  },

  markFailed: (clientMsgId) => {
    get().reconcileAck(clientMsgId, { status: 'failed' });
  },

  applyIncoming: (message) => {
    const roomId = message.roomId;
    set((s) => {
      const prev = s.messagesByRoom[roomId] ?? [];
      // Drop matching optimistic pending by clientMsgId
      const filtered = prev.filter(
        (m) => !(m.clientMsgId === message.clientMsgId && m.status === 'pending'),
      );
      return {
        messagesByRoom: {
          ...s.messagesByRoom,
          [roomId]: dedupeMessages([...filtered, { ...message, status: 'sent' }]),
        },
      };
    });
  },

  setPresence: (roomId, users) =>
    set((s) => ({
      presenceByRoom: { ...s.presenceByRoom, [roomId]: users },
    })),

  setTyping: (roomId, userId, displayName, typing) =>
    set((s) => {
      const room = { ...(s.typingByRoom[roomId] ?? {}) };
      if (typing) room[userId] = { displayName, at: Date.now() };
      else delete room[userId];
      return { typingByRoom: { ...s.typingByRoom, [roomId]: room } };
    }),
}));

export function getLastMessageId(roomId: string): string | undefined {
  const list = useChatStore.getState().messagesByRoom[roomId] ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]!;
    if (m.status !== 'pending' && m.status !== 'failed') return m.id;
  }
  return undefined;
}
