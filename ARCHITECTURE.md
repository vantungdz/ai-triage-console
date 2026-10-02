# Architecture

## Runtime flow

```text
Assessment CSV / fixture
      |
      v
Input loader -> Import service -----> Deterministic AI adapter
      |                                      |
      |                                      v
      |                               Mock-AI response map
      |                        |
      |                        v
      |                 Validate structured output
      v                        |
Local JSON store <-------------+
      |
      v
Workflow service
  |       |       |
  v       v       v
Approve  Reject  Merge / Clarify / Edit
      |
      v
Audit service
```

## State model

`Received -> Triaged -> Draft | Needs Review -> Approved -> Open`

Terminal paths are `Rejected` and `Merged`.

The UI only exposes actions valid for the current state. The service layer checks the role and transition again, so hiding a button is not a security boundary.

## Data model

### requests

- id
- source
- department_hint
- requester_role
- submitted_at
- content
- proposal
- state
- duplicate_of
- created_at
- updated_at

### audit_logs

- id
- request_id
- actor
- action
- message
- timestamp
- metadata

## AI adapter

The default adapter is deterministic and local. The adapter first looks for the supplied Mock-AI response map and falls back to the development response map. This makes S1-S5 reproducible without a paid AI account or network call. A future provider can be added behind the same proposal validation boundary.

## Duplicate/conflict approach

Fixture-specific behavior is kept in data rather than importer code. The local response map marks `REQ-002` as a duplicate candidate of `REQ-001`; the Manager workflow performs the actual merge. `REQ-003` and `REQ-004` are routed to `Needs Review` because of the conflict/security scenario.

## Trade-offs

SQLite/PostgreSQL was intentionally not added because the assessment requires a reliable local run inside a four-hour timebox. JSON persistence is sufficient for the supplied mock data and keeps setup reproducible. A production implementation would replace the repository with a transactional database and add real authentication/authorization.
