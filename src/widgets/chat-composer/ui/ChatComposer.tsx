import { useRef, useState, type KeyboardEvent } from 'react';
import { sendMessage } from '@/features/send-message';
import { notifyTyping, stopTyping } from '@/features/typing';
import { useChatStore } from '@/shared/lib/chat';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/lib';

export function ChatComposer() {
  const [text, setText] = useState('');
  const draftRef = useRef(text);
  draftRef.current = text;
  const connStatus = useChatStore((s) => s.connStatus);
  const offline = connStatus !== 'connected';
  const taRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const value = draftRef.current;
    if (!value.trim()) return;
    sendMessage(value);
    setText('');
    stopTyping();
    requestAnimationFrame(() => taRef.current?.focus());
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-panel/80 px-3 py-3 backdrop-blur md:px-6 md:py-4">
      <div
        className={cn(
          'mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-elevated p-2 shadow-inner',
          'focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20',
        )}
      >
        <label className="sr-only" htmlFor="composer">
          Message
        </label>
        <textarea
          id="composer"
          ref={taRef}
          rows={1}
          value={text}
          disabled={offline}
          onChange={(e) => {
            setText(e.target.value);
            notifyTyping();
          }}
          onKeyDown={onKeyDown}
          onBlur={() => stopTyping()}
          placeholder={offline ? 'Reconnecting…' : 'Message… (Enter to send, Shift+Enter for newline)'}
          className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-relaxed text-foreground placeholder:text-muted/70 focus:outline-none disabled:opacity-50"
        />
        <Button
          onClick={submit}
          disabled={offline || !text.trim()}
          className="mb-0.5 shrink-0 rounded-xl px-4"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl px-1 text-[11px] text-muted">
        Plain text only · max 4000 characters
      </p>
    </div>
  );
}
