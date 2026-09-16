import { useEffect, type ReactNode } from 'react';
import {
  connectSocket,
  SocketEvents,
  type ChatMessage,
  type ChatRoom,
  type PresenceUser,
} from '@/shared/lib/socket';
import { useChatStore } from '@/shared/lib/chat';
import { resyncActiveRoom } from '@/features/join-room';

type Props = {
  displayName: string;
  userId: string;
  children: ReactNode;
};

export function SocketProvider({ displayName, userId, children }: Props) {
  const setAuth = useChatStore((s) => s.setAuth);
  const setConnStatus = useChatStore((s) => s.setConnStatus);
  const setRooms = useChatStore((s) => s.setRooms);
  const upsertMessages = useChatStore((s) => s.upsertMessages);
  const applyIncoming = useChatStore((s) => s.applyIncoming);
  const setPresence = useChatStore((s) => s.setPresence);
  const setTyping = useChatStore((s) => s.setTyping);

  useEffect(() => {
    setAuth(userId, displayName);
    const socket = connectSocket({ displayName, userId });

    const onConnect = () => {
      setConnStatus('connected');
      resyncActiveRoom();
    };
    const onDisconnect = () => setConnStatus('offline');
    const onReconnectAttempt = () => setConnStatus('reconnecting');
    const onAuthOk = (payload: { userId: string; displayName: string }) => {
      setAuth(payload.userId, payload.displayName);
    };
    const onRoomList = (payload: { rooms: ChatRoom[] }) => setRooms(payload.rooms);
    const onHistory = (payload: {
      roomId: string;
      messages: ChatMessage[];
      afterId?: string;
      beforeId?: string;
    }) => {
      // Broadcast history: only full loads (no cursor) replace; cursor syncs append/prepend
      if (payload.afterId) {
        upsertMessages(payload.roomId, payload.messages, 'append');
      } else if (payload.beforeId) {
        upsertMessages(payload.roomId, payload.messages, 'prepend');
      } else {
        upsertMessages(payload.roomId, payload.messages, 'replace');
      }
    };
    const onNew = (payload: { message: ChatMessage }) => applyIncoming(payload.message);
    const onPresence = (payload: { roomId: string; users: PresenceUser[] }) =>
      setPresence(payload.roomId, payload.users);
    const onTypingStart = (p: { roomId: string; userId: string; displayName: string }) =>
      setTyping(p.roomId, p.userId, p.displayName, true);
    const onTypingStop = (p: { roomId: string; userId: string; displayName: string }) =>
      setTyping(p.roomId, p.userId, p.displayName, false);
    const onJoined = (payload: { room?: ChatRoom; users?: PresenceUser[] }) => {
      if (payload.room && payload.users) {
        setPresence(payload.room.id, payload.users);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on(SocketEvents.AuthOk, onAuthOk);
    socket.on(SocketEvents.RoomList, onRoomList);
    socket.on(SocketEvents.RoomJoined, onJoined);
    socket.on(SocketEvents.MessageHistory, onHistory);
    socket.on(SocketEvents.MessageNew, onNew);
    socket.on(SocketEvents.PresenceUpdate, onPresence);
    socket.on(SocketEvents.TypingStart, onTypingStart);
    socket.on(SocketEvents.TypingStop, onTypingStop);

    if (socket.connected) onConnect();
    else setConnStatus('reconnecting');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off(SocketEvents.AuthOk, onAuthOk);
      socket.off(SocketEvents.RoomList, onRoomList);
      socket.off(SocketEvents.RoomJoined, onJoined);
      socket.off(SocketEvents.MessageHistory, onHistory);
      socket.off(SocketEvents.MessageNew, onNew);
      socket.off(SocketEvents.PresenceUpdate, onPresence);
      socket.off(SocketEvents.TypingStart, onTypingStart);
      socket.off(SocketEvents.TypingStop, onTypingStop);
    };
  }, [
    displayName,
    userId,
    setAuth,
    setConnStatus,
    setRooms,
    upsertMessages,
    applyIncoming,
    setPresence,
    setTyping,
  ]);

  return children;
}
