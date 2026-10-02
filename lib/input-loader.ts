import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestInput } from '@/types/domain';

const csvCandidates = () => [
  process.env.ASSESSMENT_REQUESTS_PATH,
  path.join(process.cwd(), 'assessment_requests.csv'),
  path.join(process.cwd(), 'data', 'assessment_requests.csv'),
  path.join(process.cwd(), 'fixtures', 'assessment_requests.csv'),
].filter((value): value is string => Boolean(value));

const aiMapCandidates = () => [
  process.env.MOCK_AI_RESPONSE_PATH,
  path.join(process.cwd(), 'mock-ai-responses.json'),
  path.join(process.cwd(), 'data', 'mock-ai-responses.json'),
  path.join(process.cwd(), 'fixtures', 'mock-ai-responses.json'),
].filter((value): value is string => Boolean(value));

async function readFirstExisting(candidates: string[]): Promise<{ file: string; content: string } | undefined> {
  for (const file of candidates) {
    try {
      return { file, content: await fs.readFile(file, 'utf8') };
    } catch {
      // Try the next supported location.
    }
  }
  return undefined;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

function parseCsv(content: string): RequestInput[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) throw new Error('assessment_requests.csv must contain a header and at least one record');

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const required = ['id', 'source', 'department_hint', 'requester_role', 'submitted_at', 'content'];
  for (const field of required) {
    if (!headers.includes(field)) throw new Error(`assessment_requests.csv is missing required column: ${field}`);
  }

  return lines.slice(1).map((line, lineIndex) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const input: RequestInput = {
      id: row.id.trim(),
      source: row.source.trim(),
      department_hint: row.department_hint.trim(),
      requester_role: row.requester_role.trim(),
      submitted_at: row.submitted_at.trim(),
      content: row.content,
    };

    if (!input.id || !input.content) {
      throw new Error(`Invalid assessment_requests.csv row ${lineIndex + 2}: id and content are required`);
    }

    return input;
  });
}

export async function loadAssessmentRequests(fallback: RequestInput[]): Promise<RequestInput[]> {
  const result = await readFirstExisting(csvCandidates());
  if (!result) return fallback;

  return parseCsv(result.content);
}

export async function loadMockAiResponseMap(): Promise<Record<string, unknown> | undefined> {
  const result = await readFirstExisting(aiMapCandidates());
  if (!result) return undefined;

  try {
    const parsed: unknown = JSON.parse(result.content);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Mock-AI response map must contain a JSON object or array');
    }

    if (Array.isArray(parsed)) {
      const map: Record<string, unknown> = {};
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const record = item as Record<string, unknown>;
        const id = record.id ?? record.request_id ?? record.requestId;
        if (typeof id !== 'string' || !id) continue;
        const { id: _id, request_id: _requestId, requestId: _requestIdCamel, ...response } = record;
        void _id;
        void _requestId;
        void _requestIdCamel;
        map[id] = response;
      }
      return map;
    }

    const root = parsed as Record<string, unknown>;
    const responses = root.responses;
    if (responses && typeof responses === 'object' && !Array.isArray(responses)) {
      return responses as Record<string, unknown>;
    }

    return root;
  } catch (error) {
    throw new Error(`Unable to parse Mock-AI response map: ${(error as Error).message}`);
  }
}
