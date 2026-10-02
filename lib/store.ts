import fs from 'node:fs/promises';
import path from 'node:path';
import type { AuditLog, RequestRecord, State } from '@/types/domain';

export type Database = {
  requests: RequestRecord[];
  audit: AuditLog[];
};

const file = path.join(process.cwd(), 'data', 'db.json');
const empty: Database = { requests: [], audit: [] };

async function read(): Promise<Database> {
  try {
    const content = await fs.readFile(file, 'utf8');
    return JSON.parse(content) as Database;
  } catch {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(empty, null, 2));
    return { requests: [], audit: [] };
  }
}

async function write(db: Database): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(db, null, 2));
}

export async function listRequests(): Promise<RequestRecord[]> {
  return (await read()).requests;
}

export async function getRequest(id: string): Promise<RequestRecord | undefined> {
  const db = await read();
  return db.requests.find((request) => request.id === id);
}

export async function saveRequest(request: RequestRecord): Promise<RequestRecord> {
  const db = await read();
  const index = db.requests.findIndex((item) => item.id === request.id);

  if (index >= 0) db.requests[index] = request;
  else db.requests.push(request);

  await write(db);
  return request;
}

export async function addAudit(
  log: Omit<AuditLog, 'id' | 'timestamp'>,
): Promise<AuditLog> {
  const db = await read();
  const item: AuditLog = {
    ...log,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };

  db.audit.push(item);
  await write(db);
  return item;
}

export async function auditFor(requestId?: string): Promise<AuditLog[]> {
  const db = await read();
  const logs = requestId
    ? db.audit.filter((item) => item.request_id === requestId)
    : db.audit;

  return [...logs].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export async function updateState(
  id: string,
  state: State,
  actor: 'manager' | 'system',
  message: string,
  metadata?: Record<string, unknown>,
): Promise<RequestRecord> {
  const request = await getRequest(id);
  if (!request) throw new Error('Request not found');

  request.state = state;
  request.updated_at = new Date().toISOString();
  await saveRequest(request);

  await addAudit({
    request_id: id,
    actor,
    action: 'STATE_CHANGED',
    message,
    metadata: { state, ...metadata },
  });

  return request;
}

export async function resetStore(): Promise<void> {
  await write({ requests: [], audit: [] });
}
