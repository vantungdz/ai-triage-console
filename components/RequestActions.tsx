'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { RequestRecord, Role } from '@/types/domain';

export default function RequestActions({
  request,
  role,
  duplicateTarget,
}: {
  request: RequestRecord;
  role: Role;
  duplicateTarget?: RequestRecord;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [showEdit, setShowEdit] = useState(false);

  const canReview = role === 'manager' && ['Draft', 'Needs Review'].includes(request.state);
  const isNeedsReview = request.state === 'Needs Review';
  const isDuplicate = request.proposal?.risk_flags.includes('duplicate') && Boolean(duplicateTarget);
  const needsClarification = request.proposal?.risk_flags.includes('missing-information');

  async function submit(path: string, body?: Record<string, string>) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(body ?? {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Action failed');
      setMessage('Action completed successfully.');
      router.refresh();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (request.state === 'Open' || request.state === 'Rejected' || request.state === 'Merged') {
    return <div className="action-note">This request is in a terminal or executable state. No review action is available.</div>;
  }

  return (
    <div className="review-actions">
      {role === 'viewer' && (
        <div className="viewer-notice">
          <strong>Viewer mode</strong>
          <span>You can inspect this request, but Manager actions are disabled.</span>
        </div>
      )}

      {isDuplicate && (
        <div className="duplicate-box">
          <div className="review-icon duplicate-icon">D</div>
          <div className="review-copy">
            <strong>Duplicate candidate</strong>
            <span>
              This request appears to describe the same incident as{' '}
              <b>{duplicateTarget?.id}</b> — {duplicateTarget?.proposal?.summary ?? duplicateTarget?.content}
            </span>
          </div>
          <button
            className="btn secondary"
            type="button"
            disabled={!canReview || busy}
            onClick={() => submit(`/api/requests/${request.id}/merge`, { targetId: duplicateTarget!.id })}
          >
            Merge into {duplicateTarget?.id}
          </button>
        </div>
      )}

      {request.proposal?.risk_flags.includes('conflict') && (
        <div className="review-box conflict-box">
          <div className="review-icon">!</div>
          <div className="review-copy">
            <strong>Conflict detected</strong>
            <span>This request conflicts with another control or request and requires a Manager decision.</span>
          </div>
        </div>
      )}

      {request.proposal?.risk_flags.some((flag) => flag === 'security' || flag === 'privacy') && (
        <div className="review-box danger-box">
          <div className="review-icon danger-icon">!</div>
          <div className="review-copy">
            <strong>Security / privacy review</strong>
            <span>Access or customer-data risk is present. Do not treat the AI proposal as authorization.</span>
          </div>
        </div>
      )}

      {needsClarification && isNeedsReview && (
        <div className="clarify-box">
          <strong>Missing information</strong>
          <span>The request does not contain enough context for safe routing.</span>
          <button
            className="btn secondary"
            type="button"
            disabled={!canReview || busy}
            onClick={() => submit(`/api/requests/${request.id}/clarify`, {
              reason: 'Insufficient information to safely route the request. Clarification requested.',
            })}
          >
            Request clarification
          </button>
        </div>
      )}

      {canReview && (
        <div className="manager-action-grid">
          <div className="action-row">
            <button
              className="btn"
              type="button"
              disabled={busy || (isNeedsReview && !reason.trim())}
              onClick={() => submit(`/api/requests/${request.id}/approve`, { reason })}
            >
              {busy ? 'Working…' : 'Approve & Open'}
            </button>
            <button className="btn secondary" type="button" disabled={busy} onClick={() => setShowEdit((value) => !value)}>
              {showEdit ? 'Close Edit' : 'Edit proposal'}
            </button>
            <button
              className="btn danger"
              type="button"
              disabled={busy || !reason.trim()}
              onClick={() => submit(`/api/requests/${request.id}/reject`, { reason })}
            >
              Reject
            </button>
          </div>

          {isNeedsReview && (
            <label className="reason-field">
              <span>Manager decision reason <b>*</b></span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Explain why this request is approved or rejected."
                rows={3}
              />
            </label>
          )}

          {request.state === 'Draft' && (
            <label className="reason-field">
              <span>Optional decision note</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Optional note for the audit trail."
                rows={2}
              />
            </label>
          )}

          {showEdit && request.proposal && (
            <form
              className="edit-form"
              action={`/api/requests/${request.id}/edit`}
              method="post"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                submit(`/api/requests/${request.id}/edit`, Object.fromEntries(data.entries()) as Record<string, string>);
              }}
            >
              <div className="edit-grid">
                <label>
                  Department
                  <select name="department" defaultValue={request.proposal.department}>
                    {['IT', 'Marketing', 'E-commerce', 'Customer Service', 'SCM', 'Finance', 'HR', 'Production', 'Needs Review'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Priority
                  <select name="priority" defaultValue={request.proposal.priority}>
                    {['Critical', 'High', 'Medium', 'Low'].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Owner
                  <input name="proposed_owner" defaultValue={request.proposal.proposed_owner} />
                </label>
                <label className="edit-wide">
                  Summary
                  <textarea name="summary" defaultValue={request.proposal.summary} rows={2} />
                </label>
                <label className="edit-wide">
                  Proposed steps (one per line)
                  <textarea name="proposed_steps" defaultValue={request.proposal.proposed_steps.join('\n')} rows={4} />
                </label>
              </div>
              <button className="btn" type="submit" disabled={busy}>Save proposal</button>
            </form>
          )}
        </div>
      )}

      {message && <div className={`action-result ${message.includes('successfully') ? 'success-result' : 'error-result'}`}>{message}</div>}
    </div>
  );
}
