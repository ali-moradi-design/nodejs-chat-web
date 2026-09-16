import { memo } from 'react';
import type { ChatMessage } from '@/shared/lib/socket';
import { Avatar } from '@/shared/ui';
import { cn, formatTime } from '@/shared/lib';

type Props = {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
};

function MessageBubbleComponent({ message, isOwn, showAvatar }: Props) {
  const failed = message.status === 'failed';
  const pending = message.status === 'pending';

  return (
    <div
      className={cn(
        'group flex w-full gap-3 px-4 md:px-6',
        isOwn ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      <div className={cn('w-9 shrink-0', !showAvatar && 'invisible')}>
        {showAvatar ? <Avatar name={message.displayName} size="md" /> : null}
      </div>

      <div className={cn('flex max-w-[min(720px,85%)] flex-col gap-1', isOwn && 'items-end')}>
        {showAvatar && (
          <div
            className={cn(
              'flex items-baseline gap-2 px-1 text-xs text-muted',
              isOwn && 'flex-row-reverse',
            )}
          >
            <span className="font-medium text-foreground/80">{message.displayName}</span>
            <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
          </div>
        )}

        <div
          className={cn(
            'whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed',
            'border shadow-sm',
            isOwn
              ? 'rounded-br-md border-accent/30 bg-accent/20 text-foreground'
              : 'rounded-bl-md border-border bg-elevated text-foreground',
            failed && 'border-danger/40 bg-danger/10',
            pending && 'opacity-70',
          )}
        >
          {message.text}
        </div>

        {(pending || failed) && (
          <span className={cn('px-1 text-[11px]', failed ? 'text-danger' : 'text-muted')}>
            {failed ? 'Failed to send' : 'Sending…'}
          </span>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
