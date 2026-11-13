# RAG Retrieval Evaluation Lab

**Support this open-source project (optional):** [Esheen Labs crypto support](https://esheenj.github.io/compound-intelligence-starter/support.html) accepts maintainer-supplied BTC on Bitcoin and USDT on Solana, Ethereum/ERC-20 or Tron/TRC-20. The destination addresses are **custodial Pionex exchange deposits** and may change; check the exact network, current address and minimum before sending. Contributions do not buy priority, access or execution authority. All demos and source remain free.

**Understand why a retrieval strategy helps—or misses—the right information.**

An original, offline Esheen Labs developer playground for comparing fictional ranked search results against supplied relevance judgments. Explore transparent precision@k, recall@k, hit@k, mean reciprocal rank@k and nDCG@k, with the same pure evaluation code available as a Node CLI.

**[Open the interactive playground](https://esheenj.github.io/rag-retrieval-eval-lab/)** · [Explore Esheen Labs projects](https://esheenj.github.io/compound-intelligence-starter/) · [Contribute](CONTRIBUTING.md)

> The live URL is an anticipated Pages destination until separate CI, GitHub Pages and independent HTTPS readback succeed.

## Try three fictional retrieval problems

- **Customer FAQ search:** a simulated keyword baseline versus a better ordered fictional reranker across three questions.
- **Incident runbook retrieval:** tests whether highly ranked fictional runbooks cover incident questions.
- **Hard-negative search:** two weak strategies that place plausible but irrelevant documents at the top.

Choose a scenario, change top-k (1 to 5), edit synthetic document IDs, and compare two strategy summaries side by side.

No actual embedding model, vector database, LLM, search engine, network API, customer data or telemetry is present.

## Reproducible developer usage

Node.js 20+ with zero required npm packages:

~~~sh
npm test
npm run check:site
npm run demo
npm run stage
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist/pages
~~~

Then open http://127.0.0.1:8000 locally.

Use a fictional custom JSON file and a cutoff k:

~~~sh
node bin/evaluate.mjs path/to/fictional-ranking.json 3
~~~

The CLI rejects files over 64 KiB. A scenario uses exactly these keys: id, title, queries, retrievers. Queries have id, text, relevant document IDs (ground truth); each retriever has id, label and results with queryId and ranked document IDs. Bounds and duplicate identifiers are checked before scoring.

## What the metrics mean

| Metric | Deterministic definition |
|---|---|
| Precision@k | Relevant items found in first k results divided by k |
| Recall@k | Relevant items found in first k results divided by the total known relevant items |
| Hit rate@k | Fraction of questions with at least one relevant item in top k |
| MRR@k | Mean of 1 / first relevant document rank inside top k, otherwise zero |
| nDCG@k | Rank-discounted gain normalized by an ideal ordering, using binary relevance |

Each per-question metric is computed from *supplied fictional relevance IDs*, then averaged across questions. Values lie between zero and one. They are not calibrated to real search quality. Duplicate results, unlisted queries, malformed IDs and unexpected schema fields fail closed.

A perfect numerical result does not prove retrieved content is trustworthy, useful, up to date, copyright-compliant, semantically correct or sufficient for a generated answer. It also does not verify real embeddings, retriever latency or downstream business outcomes.

## Repository contents

| Path | Role |
|---|---|
| src/metrics.mjs | Original retrieval metrics, strict fixture validation and invented examples |
| tests/metrics.test.mjs | Twenty deterministic metric and negative tests |
| index.html and app.mjs | Responsive comparison workbench |
| bin/evaluate.mjs | Offline CLI with bounded JSON input |
| scripts/stage-site.mjs | Exact four-file GitHub Pages source allowlist |
| scripts/browser-check.mjs | Real headless Chrome tests of all three scenarios |
| .github/workflows/ | Main-CI-gated Pages deployment using exact verified SHA |

All source and examples are original, MIT licensed and published from clean history, not exported from confidential Esheen Labs, employer or trading repositories. No real execution authority or financial APIs. **R0 additional recurring infrastructure spend**.

[Security and limitations](SECURITY.md) · [Contribution guide](CONTRIBUTING.md).
