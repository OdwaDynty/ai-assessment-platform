// apps/web/src/app/dashboard/question-bank/page.tsx
//
// Question Bank browse page. Follows the same page-header + Card
// layout pattern as the other dashboard pages.

'use client';

import Link from 'next/link';
import { BankQuestionsList } from '@/features/question-bank/components/bank-questions-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function QuestionBankPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-8 pt-16">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Question Bank</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Browse and reuse questions you've saved from past assessments.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved questions</CardTitle>
          <Link href="/dashboard">
            <Button variant="outline">Back</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <BankQuestionsList />
        </CardContent>
      </Card>
    </main>
  );
}