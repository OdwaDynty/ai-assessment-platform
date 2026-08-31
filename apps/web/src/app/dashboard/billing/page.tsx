'use client';

import Link from 'next/link';
import { useSubscription } from '@/features/billing/api/use-subscription';
import { UpgradeButton } from '@/features/billing/components/upgrade-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const { data: subscription, isLoading, isError } = useSubscription();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Billing</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your subscription plan.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Current plan</CardTitle>
          <Link href="/dashboard">
            <Button variant="outline">Back</Button>
          </Link>
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