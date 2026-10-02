import './globals.css';
import { cookies } from 'next/headers';
import RoleSwitcher from '@/components/RoleSwitcher';
import Sidebar from '@/components/Sidebar';
import { ensureSeeded } from '@/lib/bootstrap';
import type { Role } from '@/types/domain';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureSeeded();
  const cookieStore = await cookies();
  const cookieRole = cookieStore.get('triage-role')?.value;
  const role: Role = cookieRole === 'viewer' ? 'viewer' : 'manager';

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="main">
            <header className="top">
              <div className="top-context">
                <span className="status-dot" />
                <span>Local mock mode</span>
              </div>
              <RoleSwitcher role={role} />
            </header>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
