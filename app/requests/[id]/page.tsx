import Link from 'next/link';
import { cookies } from 'next/headers';
import { auditFor, getRequest, listRequests } from '@/lib/store';
import RequestActions from '@/components/RequestActions';
import type { Role } from '@/types/domain';

export const dynamic = 'force-dynamic';

function riskClass(flag: string) {
  return `risk-tag ${flag}`;
}

export default async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const request = await getRequest(id);

  if (!request) {
    return (
      <div className="content">
        <Link className="back" href="/">← Back to requests</Link>
        <div className="card empty"><strong>Request not found.</strong></div>
      </div>
    );
  }

  const logs = await auditFor(id);
  const allRequests = await listRequests();
  const duplicateTargetId = request.duplicate_of;
  const duplicateTarget = duplicateTargetId ? allRequests.find((item) => item.id === duplicateTargetId) : undefined;
  const roleCookie = (await cookies()).get('triage-role')?.value;
  const role: Role = roleCookie === 'viewer' ? 'viewer' : 'manager';
  const risks = request.proposal?.risk_flags ?? [];

  return (
    <div className="content detail-page">
      <Link className="back" href="/">← Back to requests</Link>

      <div className="detail-heading">
        <div>
          <div className="eyebrow">REQUEST / {request.id}</div>
          <div className="detail-title-row">
            <h1>{request.id}</h1>
            <span className={`state-badge state-${request.state.toLowerCase().replaceAll(' ', '-')}`}>{request.state}</span>
          </div>
          <div className="muted">{request.source} · {request.requester_role} · submitted {new Date(request.submitted_at).toLocaleString()}</div>
        </div>
        <div className="confidence-hero">
          <span>AI confidence</span>
          <strong>{request.proposal ? `${Math.round(request.proposal.confidence * 100)}%` : '—'}</strong>
        </div>
      </div>

      {risks.length > 0 && (
        <div className="risk-overview">
          <div className="risk-overview-title">Review signals</div>
          <div className="risk-list">
            {risks.map((risk) => <span key={risk} className={riskClass(risk)}>{risk}</span>)}
          </div>
          <span className="muted">AI suggestions with risk signals must remain under human control.</span>
        </div>
      )}

      <div className="grid two detail-grid">
        <main className="grid">
          <section className="card original-card">
            <div className="section-heading">
              <div><span className="section-kicker">SOURCE DATA</span><h2>Original Request</h2></div>
              <span className="source-pill">{request.source}</span>
            </div>
            <p className="original-text">{request.content}</p>
            <div className="metadata-row">
              <span>Department hint: <b>{request.department_hint || 'Not provided'}</b></span>
              <span>Requester role: <b>{request.requester_role}</b></span>
            </div>
          </section>

          <section className="card proposal proposal-card">
            <div className="section-heading">
              <div><span className="section-kicker">AI OUTPUT</span><h2>AI Proposal</h2></div>
              <span className={`state-badge state-${request.proposal?.recommended_state.toLowerCase().replaceAll(' ', '-')}`}>{request.proposal?.recommended_state ?? '—'}</span>
            </div>
            {request.proposal ? (
              <>
                <div className="proposal-grid">
                  <div className="proposal-field proposal-wide"><span>Summary</span><strong>{request.proposal.summary}</strong></div>
                  <div className="proposal-field"><span>Department</span><strong>{request.proposal.department}</strong></div>
                  <div className="proposal-field"><span>Priority</span><strong>{request.proposal.priority}</strong></div>
                  <div className="proposal-field"><span>Owner</span><strong>{request.proposal.proposed_owner}</strong></div>
                  <div className="proposal-field"><span>Confidence</span><strong>{Math.round(request.proposal.confidence * 100)}%</strong></div>
                  <div className="proposal-field proposal-wide"><span>Risk flags</span><div className="risk-list">{risks.length ? risks.map((risk) => <span key={risk} className={riskClass(risk)}>{risk}</span>) : <span className="muted">None</span>}</div></div>
                </div>
                <div className="steps-block">
                  <span>Proposed steps</span>
                  <ol className="steps-list">
                    {request.proposal.proposed_steps.map((step, index) => <li key={`${step}-${index}`}><span>{index + 1}</span>{step}</li>)}
                  </ol>
                </div>
              </>
            ) : <p className="muted">No proposal available.</p>}
          </section>
        </main>

        <aside className="grid">
          <section className="card action-card">
            <div className="section-heading">
              <div><span className="section-kicker">HUMAN GATE</span><h2>Manager Actions</h2></div>
              <span className={`role-pill ${role}`}>{role}</span>
            </div>
            <p className="muted action-description">AI can propose. A Manager decides whether work can become an Open task.</p>
            <RequestActions request={request} role={role} duplicateTarget={duplicateTarget} />
          </section>

          <section className="card audit-card">
            <div className="section-heading">
              <div><span className="section-kicker">CONTROL HISTORY</span><h2>Audit History</h2></div>
              <span className="count-pill">{logs.length}</span>
            </div>
            <div className="audit timeline">
              {logs.map((log) => (
                <div className="audit-item" key={log.id}>
                  <span className={`timeline-dot actor-${log.actor}`} />
                  <div className="audit-head"><strong>{log.action}</strong><span>{log.actor}</span></div>
                  <div>{log.message}</div>
                  <small>{new Date(log.timestamp).toLocaleString()}</small>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
