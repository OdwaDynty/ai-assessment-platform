// apps/web/src/features/billing/components/upgrade-button.tsx
//
// Fetches a signed PayFast payload from the backend, then builds and
// auto-submits a real HTML form POST to PayFast's hosted checkout --
// PayFast's API is form-based, not a redirect-by-URL or client-SDK
// flow, so we construct a hidden form in the DOM and submit it
// programmatically rather than just navigating to a URL.

'use client';

import { useSubscribe } from '../api/use-subscribe';
import { Button } from '@/components/ui/button';

export function UpgradeButton() {
  const { mutate, isPending, error } = useSubscribe();

  function handleUpgrade() {
    mutate(undefined, {
      onSuccess: (payload) => {
        const { actionUrl, ...fields } = payload;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = actionUrl;

        for (const [key, value] of Object.entries(fields)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
      },
    });
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleUpgrade} disabled={isPending}>
        {isPending ? 'Redirecting to PayFast...' : 'Upgrade to Pro — R249/month'}
      </Button>
      {error && (
        <p className="text-sm text-red-600">
          {error instanceof Error ? error.message : 'Failed to start upgrade'}
        </p>
      )}
    </div>
  );
}