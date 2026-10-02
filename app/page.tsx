import Link from 'next/link';
import { listRequests } from '@/lib/store';
import ImportButton from '@/components/ImportButton';

export const dynamic = 'force-dynamic';

type SearchParams = { state?: string };
const validFilters = ['Needs Review', 'Draft', 'Open', 'Rejected', 'Merged'] as const;

function stateClass(state: string) {
  return `state-badge state-${state.toLowerCase().replaceAll(' ', '-')}`;
}

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const rows = await listRequests();
  const filter = params.state;
  const filtered = filter && validFilters.includes(filter as (typeof validFilters)[number])
    ? rows.filter((request) => request.state === filter)
    : rows;

  const reviewCount = rows.filter((request) => request.state === 'Needs Review').length;
  const draftCount = rows.filter((request) => request.state === 'Draft').length;
  const openCount = rows.filter((request) => request.state === 'Open').length;
  const riskCount = rows.filter((request) => (request.proposal?.risk_flags.length ?? 0) > 0).length;

  return (
    <div className="content">
      <div className="page-hero">
        <div>
          <div className="eyebrow">OPERATIONS / IT TRIAGE</div>
          <h1>{filter === 'Needs Review' ? 'Needs Review' : 'Requests'}</h1>
          <p className="hero-copy">
            {filter === 'Needs Review'
              ? 'A controlled queue for requests that need a Manager decision before execution.'
              : 'Turn unstructured IT requests into reviewable, AI-assisted task proposals.'}
          </p>
        </div>
        <ImportButton />
      </div>

      <div className="grid stats">
        <Link href="/" className="card stat-link">
          <span className="stat-label">Total requests</span>
          <b>{rows.length}</b>
          <small>Imported source records</small>
        </Link>
        <Link href="/?state=Needs%20Review" className={`card stat-link stat-review ${filter === 'Needs Review' ? 'selected' : ''}`}>
          <span className="stat-label">Needs review</span>
          <b>{reviewCount}</b>
          <small>Manager action required</small>
        </Link>
        <Link href="/?state=Draft" className={`card stat-link ${filter === 'Draft' ? 'selected' : ''}`}>
          <span className="stat-label">Draft</span>
          <b>{draftCount}</b>
          <small>Awaiting decision</small>
        </Link>
        <Link href="/?state=Open" className={`card stat-link ${filter === 'Open' ? 'selected' : ''}`}>
          <span className="stat-label">Open</span>
          <b>{openCount}</b>
          <small>Approved execution tasks</small>
        </Link>
      </div>

      <div className="insight-strip">
        <div><strong>{riskCount}</strong><span>requests with risk signals</span></div>
        <div><strong>Mock AI</strong><span>deterministic, no paid key</span></div>
        <div><strong>Human gate</strong><span>AI cannot open tasks</span></div>
      </div>

      {filter === 'Needs Review' && (
        <div className="review-banner">
          <div className="review-banner-icon">!</div>
          <div>
            <strong>Manager review queue</strong>
            <div>Conflicts, security/privacy risk, missing information, or other conditions prevent automatic approval.</div>
          </div>
        </div>
      )}

      <div className="card table-card">
        <div className="table-toolbar">
          <div>
            <strong>{filter ? `${filter} Requests` : 'All Requests'}</strong>
            <span className="count-pill">{filtered.length}</span>
          </div>
          <div className="toolbar-meta">
            {filter && <Link href="/" className="clear-filter">Clear filter</Link>}
            <span className="toolbar-hint">Select a request to review details</span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Request</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Risk / Reason</th>
                <th>State</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id} className={request.state === 'Needs Review' ? 'review-row' : ''}>
                  <td><Link href={`/requests/${request.id}`} className="request-id">{request.id}</Link></td>
                  <td>
                    <Link href={`/requests/${request.id}`} className="request-summary-link">
                      <strong>{request.proposal?.summary ?? request.content.slice(0, 80)}</strong>
                      <span>{request.source} · {request.requester_role}</span>
                    </Link>
                  </td>
                  <td>{request.proposal?.department ?? '-'}</td>
                  <td>
                    <span className={`badge ${request.proposal?.priority === 'Critical' ? 'critical' : request.proposal?.priority === 'High' ? 'high' : ''}`}>
                      {request.proposal?.priority ?? '-'}
                    </span>
                  </td>
                  <td>
                    {request.proposal?.risk_flags?.length ? (
                      <div className="risk-list">
                        {request.proposal.risk_flags.map((flag) => (
                          <span key={flag} className={`risk-tag ${flag}`}>{flag}</span>
                        ))}
                      </div>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td><span className={stateClass(request.state)}>{request.state}</span></td>
                  <td>
                    <div className="confidence-cell">
                      <span>{request.proposal ? `${Math.round(request.proposal.confidence * 100)}%` : '-'}</span>
                      {request.proposal && <span className="confidence-track"><i style={{ width: `${Math.round(request.proposal.confidence * 100)}%` }} /></span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty">
            <strong>No requests in this queue.</strong>
            <div className="muted">Try another filter or import the fixture.</div>
          </div>
        )}
      </div>
    </div>
  );
}
