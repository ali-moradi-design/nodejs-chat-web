import { useEffect, type ReactNode } from 'react';
import { connectSocket, type ChatMessage, type ChatRoom, type PresenceUser } from '@/shared/lib/socket';
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
    const onHistory = (payload: { roomId: string; messages: ChatMessage[] }) => {
      upsertMessages(payload.roomId, payload.messages, 'replace');
    };
    const onNew = (payload: { message: ChatMessage }) => applyIncoming(payload.message);
    const onPresence = (payload: { roomId: string; users: PresenceUser[] }) =>
      setPresence(payload.roomId, payload.users);
    const onTypingStart = (p: { roomId: string; userId: string; displayName: string }) =>
      setTyping(p.roomId, p.userId, p.displayName, true);
    const onTypingStop = (p: { roomId: string; userId: string; displayName: string }) =>
      setTyping(p.roomId, p.userId, p.displayName, false);
    const onJoined = (payload: {
      room?: ChatRoom;
      users?: PresenceUser[];
    }) => {
      if (payload.room && payload.users) {
        setPresence(payload.room.id, payload.users);
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.on('auth:ok', onAuthOk);
    socket.on('room:list', onRoomList);
    socket.on('room:joined', onJoined);
    socket.on('message:history', onHistory);
    socket.on('message:new', onNew);
    socket.on('presence:update', onPresence);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);

    if (socket.connected) onConnect();
    else setConnStatus('reconnecting');

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.off('auth:ok', onAuthOk);
      socket.off('room:list', onRoomList);
      socket.off('room:joined', onJoined);
      socket.off('message:history', onHistory);
      socket.off('message:new', onNew);
      socket.off('presence:update', onPresence);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
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
