import { fixture } from './fixture';
import { loadAssessmentRequests } from './input-loader';
import { importRequests } from './importer';
import { listRequests } from './store';

let initialized = false;

export async function ensureSeeded(): Promise<void> {
  if (initialized) return;

  const requests = await listRequests();
  if (requests.length === 0) {
    const input = await loadAssessmentRequests(fixture);
    await importRequests(input);
  }

  initialized = true;
}
