import type { AIProposal, Role, RiskFlag, State } from '@/types/domain';
import { addAudit, getRequest, saveRequest, updateState } from './store';
import { validateProposal } from './ai';

function managerOnly(role: Role): void {
  if (role !== 'manager') throw new Error('Manager role required');
}

function requireReviewReason(reason: string): string {
  const normalized = reason.trim();
  if (!normalized) throw new Error('Review reason required');
  return normalized;
}

export async function approve(id: string, role: Role, reason = '') {
  managerOnly(role);
  const request = await getRequest(id);
  if (!request) throw new Error('Request not found');

  if (!['Draft', 'Needs Review'].includes(request.state)) {
    throw new Error('Invalid approval transition');
  }

  const auditReason = request.state === 'Needs Review'
    ? requireReviewReason(reason)
    : reason.trim();

  return updateState(
    id,
    'Open',
    'manager',
    auditReason
      ? `Manager approved and opened task. Reason: ${auditReason}`
      : 'Manager approved request and opened task.',
    auditReason ? { reason: auditReason } : undefined,
  );
}

export async function reject(id: string, role: Role, reason: string) {
  managerOnly(role);
  const normalized = requireReviewReason(reason);
  const request = await getRequest(id);
  if (!request) throw new Error('Request not found');
  if (!['Draft', 'Needs Review'].includes(request.state)) {
    throw new Error('Invalid rejection transition');
  }

  return updateState(
    id,
    'Rejected',
    'manager',
    `Manager rejected request. Reason: ${normalized}`,
    { reason: normalized },
  );
}

export async function merge(id: string, targetId: string, role: Role) {
  managerOnly(role);

  const request = await getRequest(id);
  const target = await getRequest(targetId);

  if (!request || !target) throw new Error('Request not found');
  if (id === targetId) throw new Error('Cannot merge request into itself');
  if (request.state === 'Merged') throw new Error('Request is already merged');
  if (!request.proposal?.risk_flags.includes('duplicate')) {
    throw new Error('Only a duplicate request can be merged');
  }
  if (target.state === 'Merged' || target.state === 'Rejected') {
    throw new Error('Target request cannot receive a merge');
  }

  request.duplicate_of = targetId;
  request.state = 'Merged';
  request.updated_at = new Date().toISOString();
  await saveRequest(request);

  await addAudit({
    request_id: id,
    actor: 'manager',
    action: 'MERGED',
    message: `Manager merged ${id} into ${targetId}.`,
    metadata: { targetId },
  });

  await addAudit({
    request_id: targetId,
    actor: 'manager',
    action: 'DUPLICATE_MERGE_TARGET',
    message: `${id} was merged into this request.`,
    metadata: { sourceId: id },
  });

  return request;
}

export async function clarify(id: string, role: Role, reason: string) {
  managerOnly(role);
  const normalized = requireReviewReason(reason);
  const request = await getRequest(id);
  if (!request) throw new Error('Request not found');
  if (!request.proposal?.risk_flags.includes('missing-information')) {
    throw new Error('Clarification is only available for missing-information requests');
  }
  if (request.state !== 'Needs Review') throw new Error('Request is not in Needs Review');

  await addAudit({
    request_id: id,
    actor: 'manager',
    action: 'CLARIFICATION_REQUESTED',
    message: normalized,
    metadata: { reason: normalized },
  });

  return request;
}

export async function editProposal(
  id: string,
  role: Role,
  changes: Partial<Pick<AIProposal, 'department' | 'priority' | 'summary' | 'proposed_owner' | 'proposed_steps'>>,
) {
  managerOnly(role);
  const request = await getRequest(id);
  if (!request || !request.proposal) throw new Error('Request not found');
  if (!['Draft', 'Needs Review'].includes(request.state)) {
    throw new Error('Only Draft or Needs Review requests can be edited');
  }

  const proposal: AIProposal = {
    ...request.proposal,
    ...changes,
    summary: (changes.summary ?? request.proposal.summary).trim(),
    proposed_owner: (changes.proposed_owner ?? request.proposal.proposed_owner).trim(),
    proposed_steps: (changes.proposed_steps ?? request.proposal.proposed_steps)
      .map((step) => step.trim())
      .filter(Boolean),
  };

  validateProposal(proposal);
  request.proposal = proposal;
  request.updated_at = new Date().toISOString();
  await saveRequest(request);

  await addAudit({
    request_id: id,
    actor: 'manager',
    action: 'PROPOSAL_EDITED',
    message: 'Manager edited the AI proposal before approval.',
  });

  return request;
}

export function isRisk(requestRiskFlags: RiskFlag[] | undefined, flag: RiskFlag): boolean {
  return Boolean(requestRiskFlags?.includes(flag));
}

export function canTransition(state: State, action: 'approve' | 'reject' | 'merge' | 'clarify' | 'edit') {
  if (action === 'merge' || action === 'clarify' || action === 'edit') {
    return ['Draft', 'Needs Review'].includes(state);
  }
  return ['Draft', 'Needs Review'].includes(state);
}
