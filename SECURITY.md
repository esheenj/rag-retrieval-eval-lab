# Security scope

This repository is an original fictional offline ranking evaluator. It is not a production search engine, LLM trust verifier or data-governance certificate.

- The browser uses a strict no-network CSP, self-hosted ES modules and DOM textContent for untrusted values.
- No database, model API, external fonts, telemetry, account authentication, paid service or live execution.
- Bounded input schemas and duplicate-ID checks reject malformed fixture data.
- Page deployment is CI-gated on the exact tested merged-main SHA; only three source files and a nojekyll marker are packaged.
- Retrieved relevance labels are provided locally and are not independently verified.

Never paste private documents, customer prompts, keys, financial/trading data or personal data into the demo. Report sensitive flaws privately through GitHub where available.
