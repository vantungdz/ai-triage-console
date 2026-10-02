'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state = searchParams.get('state');

  return (
    <aside className="side">
      <div className="brand">AI Triage Console</div>
      <nav className="nav">
        <Link href="/" className={pathname === '/' && !state ? 'active' : ''}>Requests</Link>
        <Link href="/?state=Needs%20Review" className={`review-nav ${state === 'Needs Review' ? 'active' : ''}`}>Needs Review</Link>
        <Link href="/audit" className={pathname === '/audit' ? 'active' : ''}>Audit Logs</Link>
      </nav>
    </aside>
  );
}
