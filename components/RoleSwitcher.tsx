'use client';

import { useRouter } from 'next/navigation';
import type { Role } from '@/types/domain';

export default function RoleSwitcher({ role }: { role: Role }) {
  const router = useRouter();

  async function changeRole(nextRole: Role) {
    await fetch('/api/role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    });
    router.refresh();
  }

  return (
    <select
      className="role"
      value={role}
      aria-label="Current role"
      onChange={(event) => changeRole(event.target.value as Role)}
    >
      <option value="manager">Manager</option>
      <option value="viewer">Viewer</option>
    </select>
  );
}
