#!/usr/bin/env node
/* Chapter 2 acceptance sweep.
 *
 * Runs verify/chapter2.mjs across the viewports that actually broke it. The
 * contrast bug that shipped was invisible at 360x780 and failed at 360x844,
 * so a single viewport proves nothing -- height is swept, not assumed.
 *
 *   node dossier/verify/sweep.mjs [baseUrl]
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const base = process.argv[2] || 'https://tnwaste.org/dossier/';
const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, 'chapter2.mjs');

// Desktop widths, then the phone heights: 640 and 844 are the PR #9 spec
// sizes; the rest bracket the band where contrast dipped under 3:1.
const VIEWPORTS = [
  [1440, 900], [1280, 900], [1024, 800],
  [390, 844],
  [360, 640], [360, 740], [360, 780], [360, 844], [360, 896],
];

let failed = 0;
for (const [w, h] of VIEWPORTS) {
  const r = spawnSync(process.execPath, [script, base, String(w), String(h)], { encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  const line = out.trim().split('\n').pop();
  const bad = !/RESULT PASS/.test(out);
  if (bad) failed++;
  console.log(`${String(w) + 'x' + h}`.padEnd(10), bad ? 'FAIL' : 'pass', bad ? line : '');
}
console.log(failed ? `SWEEP FAIL (${failed}/${VIEWPORTS.length})` : `SWEEP PASS (${VIEWPORTS.length} viewports)`);
process.exit(failed ? 1 : 0);
