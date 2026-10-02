# AI Usage

AI tools were used as an engineering assistant for scaffolding, UI iteration, TypeScript refactoring, test drafting, and review of the assessment requirements.

Human validation performed for the delivered behavior:

- Root layout includes required `<html>` and `<body>` tags.
- Structured AI output is validated before persistence.
- Import is idempotent by stable request ID.
- Viewer cannot approve, reject, merge, clarify, or edit through service-layer checks.
- Manager approval is the gate to `Open`.
- Needs Review approval requires an auditable decision reason.
- REQ-002 can merge into REQ-001 and creates audit evidence.
- REQ-003/REQ-004 remain in Needs Review after deterministic triage.
- REQ-005 records clarification.
- REQ-006 carries security/privacy risk flags.
- REQ-007 remains under normal workflow controls despite untrusted request text.
