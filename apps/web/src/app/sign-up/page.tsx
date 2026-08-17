import Link from 'next/link';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-primary">AI Assessment Platform</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Academic assessment authoring, grounded in your course material.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Create your account</CardTitle>
          </CardHeader>
          <CardContent>
            <SignUpForm />
            <p className="text-sm text-muted-foreground text-center mt-4">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}