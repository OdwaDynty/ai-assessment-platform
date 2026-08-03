'use client';

import { useAdminUpdateUser } from '../api/use-admin-update-user';
import type { CurrentUser } from '../api/use-current-user';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLES = ['EDUCATOR', 'INSTITUTION_ADMIN', 'PLATFORM_ADMIN'] as const;

export function UsersTable({ users }: { users: CurrentUser[] }) {
  const { mutate } = useAdminUpdateUser();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Email</TableHead>
          <TableHead>Full name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.fullName ?? '—'}</TableCell>
            <TableCell>
              <Select
                value={user.role}
                onValueChange={(role) => mutate({ userId: user.id, role })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={user.isActive}
                  onCheckedChange={(isActive) =>
                    mutate({ userId: user.id, isActive })
                  }
                />
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}