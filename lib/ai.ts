import type { AIProposal, RequestRecord } from '@/types/domain';
import { loadMockAiResponseMap } from './input-loader';

type MockAIEntry = Partial<AIProposal> & {
  duplicate_of?: string;
  mode?: 'timeout' | 'malformed';
  response?: unknown;
  proposal?: unknown;
  delay_ms?: number;
};

export type AIAdapterResult = {
  proposal: unknown;
  duplicate_of?: string;
};

const base = (overrides: Partial<AIProposal>): AIProposal => ({
  department: 'Needs Review',
  priority: 'Medium',
  confidence: 0.5,
  summary: 'Request requires review.',
  proposed_owner: 'IT Team',
  proposed_steps: ['Review the request and confirm the required action.'],
  risk_flags: [],
  recommended_state: 'Draft',
  ...overrides,
});

/**
 * Generic local fallback only. Assessment-specific behavior must come from the
 * supplied Mock-AI response map; this fallback intentionally does not branch
 * on request IDs.
 */
function localFallback(request: RequestRecord): AIAdapterResult {
  const department = request.department_hint.trim();
  const normalizedDepartment = [
    'IT', 'Marketing', 'E-commerce', 'Customer Service', 'SCM',
    'Finance', 'HR', 'Production', 'Needs Review',
  ].includes(department)
    ? department as AIProposal['department']
    : 'Needs Review';

  return {
    proposal: base({
      department: normalizedDepartment,
      confidence: department ? 0.75 : 0.35,
      summary: request.content.trim().slice(0, 240) || 'Request requires review.',
      proposed_owner: department ? `${department} Team` : 'IT Triage',
      recommended_state: department ? 'Draft' : 'Needs Review',
      risk_flags: department ? [] : ['missing-information'],
    }),
  };
}

async function unwrapEntry(entry: MockAIEntry): Promise<AIAdapterResult> {
  if (entry.mode === 'timeout') throw new Error('Mock AI timeout');
  if (entry.delay_ms && entry.delay_ms > 0) {
    await new Promise((resolve) => setTimeout(resolve, entry.delay_ms));
  }

  const payload = entry.proposal ?? entry.response ?? entry;
  return { proposal: payload, duplicate_of: entry.duplicate_of };
}

export async function mockAi(request: RequestRecord): Promise<AIAdapterResult> {
  const responseMap = await loadMockAiResponseMap();
  if (!responseMap) return localFallback(request);

  const raw = responseMap[request.id];
  if (raw === undefined) throw new Error(`Mock-AI response missing for ${request.id}`);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { proposal: raw };

  return unwrapEntry(raw as MockAIEntry);
}

export function validateProposal(value: unknown): asserts value is AIProposal {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid proposal');
  }

  const proposal = value as Partial<AIProposal>;
  const departments = ['IT', 'Marketing', 'E-commerce', 'Customer Service', 'SCM', 'Finance', 'HR', 'Production', 'Needs Review'];
  const priorities = ['Critical', 'High', 'Medium', 'Low'];
  const risks = ['duplicate', 'conflict', 'security', 'privacy', 'missing-information'];

  if (!departments.includes(proposal.department ?? '')) throw new Error('Invalid department');
  if (!priorities.includes(proposal.priority ?? '')) throw new Error('Invalid priority');
  if (!Number.isFinite(proposal.confidence) || (proposal.confidence ?? 0) < 0 || (proposal.confidence ?? 0) > 1) throw new Error('Invalid confidence');
  if (typeof proposal.summary !== 'string' || !proposal.summary || proposal.summary.length > 240) throw new Error('Invalid summary');
  if (typeof proposal.proposed_owner !== 'string' || !proposal.proposed_owner.trim() || !Array.isArray(proposal.proposed_steps) || proposal.proposed_steps.length < 1) throw new Error('Invalid proposal');
  if (!proposal.proposed_steps.every((step) => typeof step === 'string' && step.trim())) throw new Error('Invalid proposed step');
  if (!Array.isArray(proposal.risk_flags) || !proposal.risk_flags.every((risk) => risks.includes(risk))) throw new Error('Invalid risk flag');
  if (!['Draft', 'Needs Review'].includes(proposal.recommended_state ?? '')) throw new Error('AI cannot recommend executable states');
}
