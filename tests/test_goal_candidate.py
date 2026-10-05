"""Portable static acceptance checks: python3 -m unittest discover -s tests -v."""
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
import unittest
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from urllib.request import urlopen
ROOT = Path(__file__).resolve().parent.parent
SURFACES = ['index.html', 'statewide/index.html', 'community-resources/index.html', 'community-resources/templates.html', 'community-resources/visitor-drafts.html', 'community-resources/visitor-evidence.html', 'evidence/index.html', 'goals/index.html', 'corrections/index.html', 'about/accessibility-privacy.html']
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'): self.ids.add(a['id'])
        if tag == 'a' and a.get('href'): self.links.append(a['href'])
class Candidate(unittest.TestCase):
    def test_original_goal_contract_retained(self):
        src = json.loads((ROOT/'community-resources/goal-contract.json').read_text())
        got = json.loads((ROOT/'goal-system.json').read_text())
        self.assertEqual([g['id'] for g in got['goals']], [f'G{i}' for i in range(1,13)])
        for a,b in zip(src['goals'],got['goals']):
            self.assertEqual(a['acceptance'],b['acceptance'])
            self.assertEqual(a['depends_on'],b['depends_on'])
            self.assertEqual(len(b['acceptance']),len(b['criterion_verification']))
            self.assertNotEqual(b['status'],'verified_complete')
            for item, criterion in zip(b['criterion_verification'],b['acceptance']):
                self.assertEqual(item['criterion'],criterion)
                if item['evidence']:
                    self.assertEqual(b['id'], 'G5')
                    self.assertEqual(item['status'], 'partial_software_checks_passed')
                    self.assertEqual(item['evidence'][0]['type'], 'pristine_export_test_result')
                else:
                    self.assertEqual(item['evidence'], [])
        self.assertEqual(got['baseline']['outreach_sent'],0)
        self.assertTrue(got['authorization']['public_publish'])
        for key in ('external_outreach','paid_services','sampling','recurring_jobs'):
            self.assertFalse(got['authorization'][key])
        self.assertIn('parent',got['authorization']['release_scope'].lower())
    def test_forms_disabled_and_chronology_correct(self):
        home=(ROOT/'index.html').read_text()
        self.assertNotIn('<form',home.lower())
        self.assertNotIn('2014 to 2026',home)
        self.assertIn('2007 and 2023',home)
        self.assertNotIn("feedbackForm.addEventListener",home)
        self.assertNotIn("subscriberCount.style",home)
        for f in SURFACES: self.assertTrue((ROOT/f).is_file(),f)
    def test_new_internal_links_and_fragments_exist(self):
        for f in SURFACES[1:]:
            parser=Links(); parser.feed((ROOT/f).read_text())
            for link in parser.links:
                u=urlsplit(link)
                if u.scheme or u.netloc: continue
                path=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else (ROOT/f).parent/unquote(u.path) if u.path else ROOT/f
                if path.is_dir(): path=path/'index.html'
                self.assertTrue(path.is_file(),f'{f}: {link}')
                if u.fragment and path.suffix=='.html':
                    target=Links(); target.feed(path.read_text()); self.assertIn(u.fragment,target.ids,f'{f}: {link}')
    def test_actual_archived_response_hashes_and_quotes(self):
        a=ROOT/'community-resources/archive'
        register=json.loads((a/'claim-register.json').read_text())
        receipts=json.loads((a/'community-http-receipts.json').read_text())
        self.assertEqual([x['id'] for x in register],[x['id'] for x in receipts])
        self.assertEqual(len(register),20)
        for rec in register:
            raw=a/(rec['id']+'.response')
            if rec.get('sha256'):
                self.assertTrue(raw.is_file(),rec['id'])
                self.assertEqual(hashlib.sha256(raw.read_bytes()).hexdigest(),rec['sha256'])
                self.assertTrue(rec['body_hash_verified'])
            for quote in rec['quotations']:
                self.assertIn(quote,(a/(rec['id']+'.txt')).read_text())
            self.assertTrue(rec['retrieved_at'])
        citations=json.loads((a/'statewide-citations.json').read_text())
        for sid in ('S03','S08','S14'):
            src=next(x for x in citations['sources'] if x['title']==sid)
            text=(a/(sid+'.txt')).read_text()
            for q in src['quotes']: self.assertIn(' '.join(q['text'].split()),' '.join(text.split()))
    def test_review_findings_do_not_regress(self):
        home = (ROOT/'index.html').read_text()
        self.assertNotIn('subscriberCount', home)
        self.assertNotIn('<span class="citation-tag">Verified</span>', home)
        self.assertIn('This site does not provide alerts or monitor hearings for you.', home)
        self.assertIn('Online intake is disabled.', home)
        self.assertIn('[Verified submission address — do not use an assumed recipient]', home)
        self.assertIn('not proof that data are absent from all public records', home)
        self.assertIn('unknown volumes are not proof that records do not exist', home)
        archive = ROOT/'community-resources/archive'
        register = (ROOT/'community-resources/evidence-register.md').read_text()
        for receipt in json.loads((archive/'community-http-receipts.json').read_text()):
            if 'bytes' not in receipt:
                continue
            raw = (archive/(receipt['id']+'.response')).read_bytes()
            self.assertEqual(len(raw), receipt['bytes'], receipt['id'])
            self.assertIn(f"- {receipt['id']}: HTTP {receipt['status']}; {len(raw)} response bytes;", register)
    def test_real_http_routes(self):
        class Quiet(http.server.SimpleHTTPRequestHandler):
            def log_message(self, format, *args): pass
        server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT)))
        thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
        try:
            for f in SURFACES+['goal-system.json','community-resources/archive/R03.response']:
                with urlopen(f'http://127.0.0.1:{server.server_port}/{f}') as response:
                    self.assertEqual(response.status,200); self.assertTrue(response.read())
        finally: server.shutdown(); server.server_close(); thread.join()
if __name__=='__main__': unittest.main()
