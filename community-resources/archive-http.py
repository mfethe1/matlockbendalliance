"""Archive public GET responses. Never submits forms or executes source HTML.
Usage: python3 community-resources/archive-http.py ID URL [ID URL ...]
New IDs only; receipts preserve redirects, failures and actual retrieval times.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys

ARCHIVE = Path(__file__).resolve().parent / 'archive' / 'visitor'


class TextAndLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hidden = 0
        self.text = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'):
            self.hidden += 1
        if tag == 'a':
            href = dict(attrs).get('href')
            if href:
                self.links.append(href)

    def handle_endtag(self, tag):
        if tag in ('script', 'style') and self.hidden:
            self.hidden -= 1

    def handle_data(self, data):
        if not self.hidden and data.strip():
            self.text.append(data.strip())


def fetch(pair):
    sid, url = pair
    if not sid.isalnum() or not url.startswith('https://'):
        raise ValueError('Alphanumeric ID and HTTPS URL required')
    target = ARCHIVE / (sid + '.response')
    if target.exists() or (ARCHIVE / (sid + '.json')).exists():
        raise ValueError('Use a new ID for each attempt: ' + sid)
    command = ['curl', '--silent', '--show-error', '--location',
               '--max-time', '75', '--proto', '=https', '--proto-redir', '=https',
               '--dump-header', str(ARCHIVE / (sid + '.headers')),
               '--output', str(target), '--write-out', '%{json}', url]
    run = subprocess.run(command, capture_output=True, text=True)
    metrics = json.loads(run.stdout) if run.stdout.strip() else {}
    body = target.read_bytes() if target.exists() else b''
    rec = {'id': sid, 'requested_url': url,
           'retrieved_at': datetime.now(timezone.utc).isoformat(),
           'status': metrics.get('http_code'), 'final_url': metrics.get('url_effective'),
           'redirect_count': metrics.get('num_redirects'), 'curl_exit': run.returncode,
           'error': run.stderr or None, 'bytes': len(body),
           'sha256': sha256(body).hexdigest() if target.exists() else None,
           'content_type': metrics.get('content_type'),
           'source_date': None, 'event_date': None, 'quotations': [],
           'scope': 'Retrieved wording only; not independent acceptance or live capacity.'}
    if body and 'pdf' not in (rec['content_type'] or ''):
        parser = TextAndLinks()
        parser.feed(body.decode('utf-8', errors='replace'))
        (ARCHIVE / (sid + '.txt')).write_text('\n'.join(parser.text) + '\n')
        rec['links'] = list(dict.fromkeys(parser.links))
    (ARCHIVE / (sid + '.json')).write_text(json.dumps(rec, indent=2) + '\n')
    return {key: rec[key] for key in ('id', 'status', 'bytes', 'curl_exit', 'final_url')}


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or len(args) % 2:
        raise SystemExit(__doc__)
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    pairs = list(zip(args[::2], args[1::2]))
    if len({pair[0] for pair in pairs}) != len(pairs):
        raise SystemExit('Duplicate source IDs')
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(fetch, pairs):
            print(json.dumps(result), flush=True)
