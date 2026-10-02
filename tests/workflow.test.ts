import { beforeEach, describe, expect, it } from 'vitest';
import { importRequests } from '../lib/importer';
import { listRequests, resetStore, getRequest, auditFor } from '../lib/store';
import { approve, merge, clarify, reject } from '../lib/workflow';
import { validateProposal } from '../lib/ai';
import type { AIProposal } from '../types/domain';
import { fixture } from '../lib/fixture';

beforeEach(async () => resetStore());

describe('assessment controls', () => {
  it('imports the 12 baseline requests and is idempotent', async () => {
    await importRequests(fixture);
    await importRequests(fixture);
    expect((await listRequests()).length).toBe(12);
  });

  it('requires Manager for approval', async () => {
    await importRequests(fixture);
    await expect(approve('REQ-001', 'viewer')).rejects.toThrow('Manager role required');
  });

  it('allows Manager approval and opens a task', async () => {
    await importRequests(fixture);
    const result = await approve('REQ-001', 'manager');
    expect(result.state).toBe('Open');
  });

  it('requires a decision reason for Needs Review approval', async () => {
    await importRequests(fixture);
    await expect(approve('REQ-003', 'manager')).rejects.toThrow('Review reason required');
    const result = await approve('REQ-003', 'manager', 'Security review completed and approved by Manager.');
    expect(result.state).toBe('Open');
  });

  it('merges REQ-002 into REQ-001 and writes audit evidence', async () => {
    await importRequests(fixture);
    const result = await merge('REQ-002', 'REQ-001', 'manager');
    expect(result.state).toBe('Merged');
    expect((await getRequest('REQ-002'))?.duplicate_of).toBe('REQ-001');
    expect((await auditFor('REQ-002')).some((log) => log.action === 'MERGED')).toBe(true);
  });

  it('does not allow a Viewer to merge', async () => {
    await importRequests(fixture);
    await expect(merge('REQ-002', 'REQ-001', 'viewer')).rejects.toThrow('Manager role required');
  });

  it('keeps REQ-003 and REQ-004 in Needs Review on import', async () => {
    await importRequests(fixture);
    expect((await getRequest('REQ-003'))?.state).toBe('Needs Review');
    expect((await getRequest('REQ-004'))?.state).toBe('Needs Review');
  });

  it('records clarification for REQ-005', async () => {
    await importRequests(fixture);
    await clarify('REQ-005', 'manager', 'Please provide the affected system and expected outcome.');
    expect((await auditFor('REQ-005')).some((log) => log.action === 'CLARIFICATION_REQUESTED')).toBe(true);
  });

  it('requires a rejection reason', async () => {
    await importRequests(fixture);
    await expect(reject('REQ-003', 'manager', '')).rejects.toThrow('Review reason required');
  });

  it('rejects malformed AI output before persistence', () => {
    const malformed = {
      department: 'Not A Department',
      priority: 'High',
      confidence: 0.5,
      summary: 'Bad output',
      proposed_owner: 'IT Team',
      proposed_steps: ['Review'],
      risk_flags: [],
      recommended_state: 'Draft',
    } as unknown as AIProposal;

    expect(() => validateProposal(malformed)).toThrow('Invalid department');
  });

  it('routes low-confidence AI output to Needs Review', async () => {
    await importRequests(fixture);
    const request = await getRequest('REQ-005');
    expect(request?.proposal?.confidence).toBeLessThan(0.5);
    expect(request?.proposal?.recommended_state).toBe('Needs Review');
  });
});
