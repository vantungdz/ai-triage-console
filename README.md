# AI Triage Console

A local assessment implementation for the Delements Senior IT AI Engineering practical assessment.

## Scope

- Deterministic mock-AI mode with no paid model key.
- Loads the supplied `assessment_requests.csv` when present; otherwise uses the local development fixture.
- Loads the supplied Mock-AI response map when present; otherwise uses the local deterministic response map.
- Human approval gate: AI can propose but cannot open tasks.
- Duplicate detection/merge for S1.
- Conflict review for S2.
- Missing-information clarification for S3.
- Security/privacy review for S4.
- Untrusted-input handling for S5.
- Viewer/Manager role switch with service-layer enforcement.
- Audit history for meaningful actions.
- Idempotent import by stable request ID.
- Local JSON persistence to keep the assessment simple and reproducible.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The first application request automatically seeds the available assessment fixture. The **Import fixture** button can be used to verify idempotency.

## Using the files supplied by Delements

The loader checks these locations for `assessment_requests.csv`:

1. `ASSESSMENT_REQUESTS_PATH` environment variable
2. project root: `assessment_requests.csv`
3. `data/assessment_requests.csv`
4. `fixtures/assessment_requests.csv`

The Mock-AI response map is loaded from:

1. `MOCK_AI_RESPONSE_PATH` environment variable
2. project root: `mock-ai-responses.json`
3. `data/mock-ai-responses.json`
4. `fixtures/mock-ai-responses.json`

The response-map loader accepts either an object keyed by request ID or an array containing `id`/`request_id` entries. It also supports deterministic `mode: "timeout"` and malformed response entries so the validation/fallback path can be exercised.

If Delements supplies a different filename or location, set the two environment variables in `.env.local`:

```env
ASSESSMENT_REQUESTS_PATH=./assessment_requests.csv
MOCK_AI_RESPONSE_PATH=./mock-ai-responses.json
```

Do not commit `.env.local` or real credentials.

## Tests

```bash
npm test
```

## Production build

```bash
npm run build
npm start
```

## Design note

The importer no longer hard-codes relationships such as `REQ-002 -> REQ-001`. Duplicate candidates can come from the deterministic AI response map (`duplicate_of`) and are still merged only by the Manager workflow. This keeps fixture-specific behavior in fixture data instead of spreading request IDs through application code.

The development files under `fixtures/` are local placeholders based on the assessment scenarios. They are intended to be replaced by the exact files supplied by Delements during the assessment.

Do not add real credentials, customer data, production URLs, or proprietary Delements source material.
