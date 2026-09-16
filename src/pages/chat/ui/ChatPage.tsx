import { ChatSidebar } from '@/widgets/chat-sidebar';
import { ChatThread } from '@/widgets/chat-thread';
import { ChatComposer } from '@/widgets/chat-composer';

export function ChatPage() {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface">
      <ChatSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ChatThread />
        <ChatComposer />
      </div>
    </div>
  );
}
