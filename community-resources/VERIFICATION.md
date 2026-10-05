# Reproducing the local website candidate

This static candidate is not published. No live intake, monitoring, outreach, records submission, paid service, sampling, or environmental outcome is established by these software checks. `goal-system.json` retains the original twelve goals, their dependencies, acceptance criteria, authorization limits, and separate unresolved blocker tasks.

## Surfaces

- `/statewide/`: limited, unranked investigation leads; discovery and publication queues are distinct.
- `/community-resources/`: well precautions/testing leads, disposal and service-policy questions, accountability routes, affordability uncertainties.
- `/community-resources/templates.html`: printable county checklists and unsent records/outcome/playbook drafts; usable with JavaScript disabled.
- `/evidence/`: actual HTTP receipts, raw-response hashes, extracted quotations, failure receipts and archived starter sources.
- `/goals/`, `/goal-system.md`, `/goal-system.json`: original goals and honest criterion-level pending/blocked states, not completed environmental outcomes.
- `/corrections/` and `/about/accessibility-privacy.html`: corrections, disabled intake, privacy and limited accessibility claims.

## Pristine archive check

Export your checked-out commit using `git archive HEAD`; serve that export on loopback, not a mutable worktree. No build step or network-installed dependency is required for site delivery. Python tests use only the standard library; browser tests require an already installed Chrome and Playwright Core. Nothing is sent to production.

From the export directory:

```sh
python3 -m unittest discover -s tests -v
python3 -m http.server 8876 --bind 127.0.0.1
```

In another terminal, set `PLAYWRIGHT_CORE` to the absolute path of your installed `playwright-core/index.mjs`, `CHROME_BIN` if Chrome uses a nonstandard path, and `VERIFY_OUTPUT` to a writable local artifact directory. Run:

```sh
node tests/community-browser.mjs http://127.0.0.1:8876/
node dossier/verify/earth-timeline.mjs http://127.0.0.1:8876/dossier/
node dossier/verify/sweep.mjs http://127.0.0.1:8876/dossier/
node dossier/verify/chapter2.mjs http://127.0.0.1:8876/dossier/
node dossier/verify/stage-fit.mjs http://127.0.0.1:8876/dossier/
node dossier/verify/flight.mjs http://127.0.0.1:8876/dossier/
node dossier/verify/copy-collision.mjs http://127.0.0.1:8876/dossier/
```

An exit code of zero is required from every command. Preserve stdout and the community-browser result JSON, screenshots and print PDF as evidence. The six original dossier harnesses remain unchanged. Basic heading, named-link, keyboard, print and overflow checks are not a complete WCAG audit.

The parent independently reviewed actual archived response hashes, corrected missing archive links and byte metadata, removed obsolete intake handlers, exercised the unsent generator/mobile navigation, narrowed unsupported homepage claims and fixed mobile overflow. Reproduction cannot establish current law, prices, county eligibility, lab turnaround, rural coverage, delivery capacity, resident consent, or improvement outcomes: those remain separate acceptance blockers requiring new verified evidence and, where applicable, Michael's explicit action approval.
