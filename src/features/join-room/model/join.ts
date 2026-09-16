import { getSocket, SocketEvents, type ChatMessage } from '@/shared/lib/socket';
import { getLastMessageId, useChatStore } from '@/shared/lib/chat';

export function joinRoom(roomId: string): void {
  const socket = getSocket();
  const { setActiveRoom, upsertMessages } = useChatStore.getState();
  setActiveRoom(roomId);

  if (!socket) return;

  socket.emit(SocketEvents.RoomJoin, { roomId }, () => {
    const existing = useChatStore.getState().messagesByRoom[roomId];
    if (!existing || existing.length === 0) {
      socket.emit(
        SocketEvents.MessageHistory,
        { roomId, limit: 50 },
        (res: { ok?: boolean; messages?: ChatMessage[] }) => {
          if (res?.messages) upsertMessages(roomId, res.messages, 'replace');
        },
      );
    }
  });
}

export function createRoom(name: string): void {
  const socket = getSocket();
  if (!socket) return;
  socket.emit(
    SocketEvents.RoomCreate,
    { name },
    (res: { ok?: boolean; room?: { id: string } }) => {
      if (res?.ok && res.room) joinRoom(res.room.id);
    },
  );
}

export function resyncActiveRoom(): void {
  const socket = getSocket();
  if (!socket?.connected) return;
  const { activeRoomId, upsertMessages } = useChatStore.getState();
  const afterId = getLastMessageId(activeRoomId);

  socket.emit(SocketEvents.RoomJoin, { roomId: activeRoomId });

  if (afterId) {
    socket.emit(
      SocketEvents.MessageHistory,
      { roomId: activeRoomId, afterId, limit: 100 },
      (res: { ok?: boolean; messages?: ChatMessage[] }) => {
        if (res?.messages?.length) upsertMessages(activeRoomId, res.messages, 'append');
      },
    );
  } else {
    socket.emit(
      SocketEvents.MessageHistory,
      { roomId: activeRoomId, limit: 50 },
      (res: { ok?: boolean; messages?: ChatMessage[] }) => {
        if (res?.messages) upsertMessages(activeRoomId, res.messages, 'replace');
      },
    );
  }
}
