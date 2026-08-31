'use client';

import { useSubscription } from '@/features/billing/api/use-subscription';
import { UpgradeButton } from '@/features/billing/components/upgrade-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function BillingPage() {
  const { data: subscription, isLoading, isError } = useSubscription();

  return (
    <main className="flex flex-col p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription plan.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-muted-foreground">Loading subscription...</p>}
          {isError && <p className="text-red-600">Failed to load subscription.</p>}
          {subscription && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant={subscription.plan === 'PRO' ? 'success' : 'outline'}>
                  {subscription.plan}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {subscription.status}
                </span>
              </div>
              {subscription.plan === 'FREE' && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    You&apos;re on the Free plan: 3 assessment generations per month.
                    Upgrade to Pro for unlimited generation.
                  </p>
                  <UpgradeButton />
                </div>
              )}
              {subscription.plan === 'PRO' && (
                <p className="text-sm text-muted-foreground">
                  You have unlimited assessment generation
                  {subscription.currentPeriodEnd &&
                    ` until ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                  .
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}