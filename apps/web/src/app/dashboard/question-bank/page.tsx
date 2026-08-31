// apps/web/src/app/dashboard/question-bank/page.tsx
//
// Question Bank browse page.

'use client';

import { BankQuestionsList } from '@/features/question-bank/components/bank-questions-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuestionBankPage() {
  return (
    <main className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Browse and reuse questions you&apos;ve saved from past assessments.
        </p>
      </div>
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Saved questions</CardTitle>
        </CardHeader>
        <CardContent>
          <BankQuestionsList />
        </CardContent>
      </Card>
    </main>
  );
}