import { useState, type FormEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/shared/ui';
import { loadUserId, saveDisplayName, saveUserId } from '../lib/storage';

type Props = {
  onReady: (displayName: string, userId: string) => void;
};

export function DisplayNameGate({ onReady }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim().replace(/\s+/g, ' ').slice(0, 32);
    if (trimmed.length < 1) {
      setError('Please enter a display name');
      return;
    }
    const userId = loadUserId() ?? uuidv4();
    saveUserId(userId);
    saveDisplayName(trimmed);
    onReady(trimmed, userId);
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-panel p-8 shadow-2xl shadow-black/40">
        <div className="mb-6 space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/20 text-xl text-accent-fg">
            ✦
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to Chat
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Pick a display name to join. No account needed — your name is stored
            locally on this device.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground/90">Display name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              maxLength={32}
              placeholder="e.g. Ali"
              aria-invalid={!!error}
              aria-describedby={error ? 'name-error' : undefined}
              className="w-full rounded-xl border border-border bg-elevated px-4 py-3 text-foreground placeholder:text-muted/60 focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
          {error ? (
            <p id="name-error" className="text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="h-11 w-full rounded-xl">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
