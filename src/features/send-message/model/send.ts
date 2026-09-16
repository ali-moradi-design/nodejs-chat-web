import { v4 as uuidv4 } from 'uuid';
import { getSocket, type MessageAck } from '@/shared/lib/socket';
import { useChatStore } from '@/shared/lib/chat';

export function sendMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  const socket = getSocket();
  const { activeRoomId, userId, displayName, addOptimistic, reconcileAck, markFailed } =
    useChatStore.getState();

  if (!userId || !displayName) return;

  const clientMsgId = uuidv4();
  const optimistic = {
    id: clientMsgId,
    clientMsgId,
    roomId: activeRoomId,
    userId,
    displayName,
    text: trimmed.slice(0, 4000),
    createdAt: new Date().toISOString(),
    status: 'pending' as const,
  };

  addOptimistic(optimistic);

  if (!socket || !socket.connected) {
    markFailed(clientMsgId);
    return;
  }

  socket.emit(
    'message:send',
    {
      roomId: activeRoomId,
      text: optimistic.text,
      clientMsgId,
    },
    (ack: MessageAck) => {
      if (!ack?.ok) {
        markFailed(clientMsgId);
        return;
      }
      reconcileAck(clientMsgId, {
        id: ack.id,
        createdAt: ack.createdAt,
        status: 'sent',
      });
    },
  );
}
