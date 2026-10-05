# Visitor-answer slice verification contract

This candidate adds Loudon County practical resource coverage, not a statewide
service directory or a completed environmental intervention. Public source wording
is archived; provider acceptance/capacity and current Tennessee analyte/method
certification are not independently confirmed. No contact, form submission,
payment, sampling, signup or recurring job is performed by this slice.

## Evidence

- `archive/visitor/receipts.json`: actual GET receipts, status, final URL,
  redirect count, retrieval UTC, byte count, SHA-256, extraction method and quotes.
- `archive/visitor/L*.headers`: raw HTTP headers, including redirect chain.
- `archive/visitor/L*.response`: exact saved response bodies, including 403/404.
- `archive/visitor/L*.txt`: extracted visible source text. L25 uses the embedded
  Formstack JSON as data, never executed. L21's PDF visually renders clearly;
  extracted text overlaps, so its weekday rule was transcribed from page 1.
  L22 is scanned; no current certificate-validity claim is made from it.
- `visitor-evidence.html`: visitor-readable limits, quotations and raw downloads.
- `resource-register.json`: visible choices, actual routes and unresolved terms.

## Executable gates (no dependencies installed)

```text
python3 -m unittest discover -s tests -v
PLAYWRIGHT_CORE=/Users/mfethe/openclaw-shared/scrollcraft-home/builds/tnwaste/node_modules/playwright-core/index.mjs node tests/community-browser.mjs http://127.0.0.1:<port>/
node dossier/verify/{earth-timeline,sweep,chapter2,stage-fit,flight,copy-collision}.mjs http://127.0.0.1:<port>/dossier/
```

All eight gates must be run against a pristine `git archive` of the exact staged
Git tree. The bounded runner uses an ephemeral loopback-only server and shuts it
down in `finally`. It retains actual stdout/stderr, exit codes, tested tree and
browser screenshots/print PDFs outside the source tree. The parent handback is
the authoritative fresh tested-tree receipt; `goal-system.json` labels its old
receipt historical to avoid self-referential tree assertions.

The browser gate exercises desktop and 390/360-pixel mobile layouts, named links,
skip-link keyboard navigation, resource jump navigation, editable drafts, actual
clipboard readback, real denied-permission fallback, updated print mirrors and
JavaScript-disabled print/edit access. It does not click outbound agency/provider
links or submit forms. Static tests preserve all original goal acceptance/dependency
lists, disabled site intake, archival hashes/quotations and external authorization
limits. All six original dossier harnesses remain untouched.

## Release boundary

User-authorized publication is for the parent, after independent review, fresh
gates, the existing under-400-changed-line landing policy/split decision and live
readback. This slice does not commit, push, merge or deploy. A passing local suite
is neither a live release nor comprehensive accessibility/factual certification.
