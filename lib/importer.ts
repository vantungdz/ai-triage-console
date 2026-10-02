import { mockAi, validateProposal } from './ai';
import { addAudit, listRequests, saveRequest } from './store';
import type { RequestInput, RequestRecord } from '@/types/domain';

/**
 * Find a duplicate target without depending on a fixed request ID.
 * The deterministic Mock-AI response may provide duplicate_of metadata; when it
 * does not, this lightweight token similarity fallback can identify an existing
 * candidate from the imported data. The Manager still makes the final merge decision.
 */
function findDuplicateTarget(request: RequestRecord, existing: RequestRecord[]): RequestRecord | undefined {
  if (!request.proposal?.risk_flags.includes('duplicate')) return undefined;

  const sourceTokens = tokenize(`${request.content} ${request.proposal.summary}`);
  if (sourceTokens.size === 0) return undefined;

  let best: { request: RequestRecord; score: number } | undefined;
  for (const candidate of existing) {
    if (candidate.state === 'Merged' || candidate.state === 'Rejected') continue;
    const candidateTokens = tokenize(`${candidate.content} ${candidate.proposal?.summary ?? ''}`);
    const score = lexicalSimilarity(sourceTokens, candidateTokens);
    if (!best || score > best.score) best = { request: candidate, score };
  }

  return best && best.score >= 0.30 ? best.request : undefined;
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function lexicalSimilarity(left: Set<string>, right: Set<string>): number {
  if (left.size === 0 || right.size === 0) return 0;
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  const jaccard = intersection / (left.size + right.size - intersection);
  const overlap = intersection / Math.min(left.size, right.size);
  return (jaccard * 0.6) + (overlap * 0.4);
}

export async function importRequests(rows: RequestInput[]) {
  const existing = new Set((await listRequests()).map((request) => request.id));
  let inserted = 0;

  for (const row of rows) {
    if (existing.has(row.id)) continue;

    const now = new Date().toISOString();
    const currentRequests = await listRequests();
    const aiResult = await mockAi({
      ...row,
      state: 'Received',
      created_at: now,
      updated_at: now,
    });

    validateProposal(aiResult.proposal);
    const proposal = aiResult.proposal;

    const state = proposal.recommended_state === 'Needs Review' ? 'Needs Review' : 'Draft';
    const record: RequestRecord = {
      ...row,
      proposal,
      state,
      created_at: now,
      updated_at: now,
    };

    // Duplicate metadata from the external Mock-AI map is optional. Otherwise,
    // derive the candidate from the current data instead of using fixed IDs.
    const duplicateTargetId = aiResult.duplicate_of ?? findDuplicateTarget(record, currentRequests)?.id;
    if (duplicateTargetId) record.duplicate_of = duplicateTargetId;

    await saveRequest(record);
    await addAudit({
      request_id: record.id,
      actor: 'system',
      action: 'IMPORTED',
      message: 'Imported request from assessment fixture.',
    });
    await addAudit({
      request_id: record.id,
      actor: 'ai',
      action: 'TRIAGED',
      message: 'Deterministic mock-AI proposal validated.',
      metadata: {
        confidence: proposal.confidence,
        recommended_state: proposal.recommended_state,
        risk_flags: proposal.risk_flags,
        duplicate_candidate: duplicateTargetId ?? null,
      },
    });

    existing.add(row.id);
    inserted += 1;
  }

  return { inserted, total: (await listRequests()).length };
}
