// apps/web/src/features/navigation/components/sidebar.tsx
//
// Persistent left-hand navigation for every /dashboard/* page. Role-aware:
// admin-only links only render for users with the appropriate role.
// Highlights the currently active route.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCurrentUser } from '@/features/users/api/use-current-user';
import { SignOutButton } from '@/features/auth/components/sign-out-button';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  // If set, only users with one of these roles see this link.
  roles?: Array<'PLATFORM_ADMIN' | 'INSTITUTION_ADMIN' | 'EDUCATOR'>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/documents', label: 'Documents' },
  { href: '/dashboard/assessments', label: 'Assessments' },
  { href: '/dashboard/question-bank', label: 'Question Bank' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/profile', label: 'My Profile' },
  {
    href: '/dashboard/admin/users',
    label: 'Manage Users',
    roles: ['PLATFORM_ADMIN', 'INSTITUTION_ADMIN'],
  },
  {
    href: '/dashboard/admin/institutions',
    label: 'Institutions',
    roles: ['PLATFORM_ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (currentUser && item.roles.includes(currentUser.role)),
  );

  return (
    <aside className="w-56 shrink-0 border-r bg-card min-h-screen flex flex-col p-4">
      <div className="mb-6">
        <p className="text-lg font-semibold text-primary">AI Assessment</p>
        <p className="text-xs text-muted-foreground">Platform</p>
      </div>

      <nav className="flex-1 space-y-1">
        {visibleItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-foreground hover:bg-muted',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t">
        <SignOutButton />
      </div>
    </aside>
  );
}