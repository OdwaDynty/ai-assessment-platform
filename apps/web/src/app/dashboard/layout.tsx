// apps/web/src/app/dashboard/layout.tsx
//
// Shared layout for every /dashboard/* page: renders the persistent
// sidebar alongside whatever page content is active. Individual pages
// no longer need their own nav button rows or Back links -- the
// sidebar replaces all of that.

import { Sidebar } from '@/features/navigation/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">{children}</div>
    </div>
  );
}