import Link from 'next/link';
import { auditFor } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function Audit() {
  const logs = await auditFor();

  return (
    <div className="content">
      <div className="page-hero">
        <div>
          <div className="eyebrow">CONTROL / AUDIT</div>
          <h1>Audit Logs</h1>
          <p className="hero-copy">A reviewable history of imports, AI triage, Manager decisions and workflow changes.</p>
        </div>
      </div>

      <div className="audit-summary">
        <div className="card"><strong>{logs.length}</strong><span>audit events</span></div>
        <div className="card"><strong>{new Set(logs.map((log) => log.request_id)).size}</strong><span>requests with history</span></div>
        <div className="card"><strong>{logs.filter((log) => log.actor === 'manager').length}</strong><span>Manager actions</span></div>
      </div>

      <div className="card table-card">
        <div className="table-toolbar">
          <div><strong>Activity history</strong><span className="count-pill">{logs.length}</span></div>
          <Link href="/" className="clear-filter">Back to requests</Link>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Time</th><th>Request</th><th>Actor</th><th>Action</th><th>Message</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="audit-time">{new Date(log.timestamp).toLocaleString()}</td>
                  <td><Link href={`/requests/${log.request_id}`} className="request-id">{log.request_id}</Link></td>
                  <td><span className={`actor-pill actor-${log.actor}`}>{log.actor}</span></td>
                  <td><span className="action-pill">{log.action}</span></td>
                  <td>{log.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
