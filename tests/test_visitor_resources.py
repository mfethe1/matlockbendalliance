"""Visitor resource regressions: public wording is not confirmed service."""
from datetime import datetime, timezone
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parent.parent
ARCHIVE = ROOT/'community-resources/archive/visitor'


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = []
        self.forms = []
        self.textareas = []
        self.scripts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        if tag == 'a':
            self.links.append(attrs.get('href'))
        if tag == 'form':
            self.forms.append(attrs)
        if tag == 'textarea':
            self.textareas.append(attrs)
        if tag == 'script':
            self.scripts.append(attrs)


def page(name):
    parser = Page()
    parser.feed((ROOT/'community-resources'/name).read_text())
    return parser


class VisitorResources(unittest.TestCase):
    def test_all_real_http_receipts_integrity_and_grounded_quotes(self):
        receipts = json.loads((ARCHIVE/'receipts.json').read_text())
        self.assertEqual([r['id'] for r in receipts], [f'L{i:02d}' for i in range(1,36)])
        for r in receipts:
            with self.subTest(source=r['id']):
                per_source = json.loads((ARCHIVE/(r['id']+'.json')).read_text())
                self.assertEqual(r, per_source)
                self.assertTrue((ARCHIVE/(r['id']+'.headers')).is_file())
                stamp = datetime.fromisoformat(r['retrieved_at'])
                offset = stamp.utcoffset()
                self.assertIsNotNone(offset)
                assert offset is not None
                self.assertEqual(offset.total_seconds(), 0)
                self.assertLessEqual(stamp, datetime.now(timezone.utc))
                self.assertIsNone(r['source_date'])
                self.assertIsNone(r['event_date'])
                raw = ARCHIVE/(r['id']+'.response')
                if raw.exists():
                    body = raw.read_bytes()
                    self.assertEqual(len(body),r['bytes'])
                    self.assertEqual(hashlib.sha256(body).hexdigest(),r['sha256'])
                else:
                    self.assertEqual(r['bytes'],0)
                    self.assertIsNone(r['sha256'])
                if r['quotations']:
                    self.assertEqual(r['status'],200)
                    self.assertEqual(r['curl_exit'],0)
                    text = ' '.join((ARCHIVE/(r['id']+'.txt')).read_text().split())
                    for quote in r['quotations']:
                        self.assertIn(' '.join(quote.split()),text)
                if r['status'] != 200:
                    self.assertEqual(r['quotations'],[])
        evidence = page('visitor-evidence.html')
        for r in receipts:
            self.assertIn(r['id'],evidence.ids)
            self.assertIn('archive/visitor/'+r['id']+'.json', evidence.links)

    def test_registered_visitor_routes_are_visible_and_cited(self):
        register = json.loads((ROOT/'community-resources/resource-register.json').read_text())
        self.assertEqual(len(register['resources']),13)
        resources = page('index.html')
        evidence = page('visitor-evidence.html')
        self.assertEqual(len(resources.ids),len(set(resources.ids)))
        for r in register['resources']:
            with self.subTest(resource=r['id']):
                self.assertIn(r['id'],resources.ids)
                for route in r['visitor_routes']:
                    self.assertIn(route,resources.links)
                self.assertTrue(r['unresolved'])
                for sid in r['source_ids']:
                    self.assertIn(sid,evidence.ids)
        self.assertEqual(sum(r['kind']=='testing' for r in register['resources']),2)
        for rid,sid in [('watercheck','L05'),('tapscore','L06')]:
            r = next(r for r in register['resources'] if r['id']==rid)
            self.assertIn(sid,r['source_ids'])
            receipt = json.loads((ARCHIVE/(sid+'.json')).read_text())
            self.assertTrue(any('well' in q.lower() for q in receipt['quotations']))

    def test_no_active_intake_or_outbound_draft_side_effects(self):
        drafts = page('visitor-drafts.html')
        self.assertFalse(drafts.forms)
        self.assertEqual(len(drafts.textareas),5)
        for attrs in drafts.textareas:
            self.assertNotIn('name',attrs)
        html = (ROOT/'community-resources/visitor-drafts.html').read_text()
        for forbidden in ('fetch(', 'XMLHttpRequest', 'sendBeacon', 'localStorage',
                          'sessionStorage', 'window.open(', 'location.href',
                          '<form', '<script src='):
            self.assertNotIn(forbidden,html)
        self.assertIn('navigator.clipboard.writeText(text.value)',html)
        self.assertIn('text.select()',html)
        self.assertIn('Nothing sent.',html)
        self.assertEqual(html.count('class="print-draft"'),5)

    def test_published_limits_are_not_promoted_to_complete(self):
        g=json.loads((ROOT/'goal-system.json').read_text())
        self.assertEqual(g['visitor_resource_slice']['verified_county_services'],[])
        self.assertTrue(g['authorization']['public_publish'])
        for key in ('external_outreach','paid_services','sampling','recurring_jobs'):
            self.assertFalse(g['authorization'][key])
        for goal in g['goals']:
            self.assertNotEqual(goal['status'],'verified_complete')
        text=(ROOT/'community-resources/index.html').read_text()
        for limit in ('Loudon County', 'not a complete Tennessee directory',
                      'unknown does not mean free or accepted',
                      'Ask TDEC cannot accept formal complaints',
                      'a loan, not a household grant',
                      'numeric', 'independently', 'local-only'):
            # Numeric holding time is worded "numerical" in the card.
            self.assertIn('numerical' if limit=='numeric' else limit,text)
        self.assertIn('$34,345 as the household limit',text)
        self.assertNotIn('Leila Reeves',text)
        self.assertNotIn('8 a.m.–4:30 p.m. ET',text)


if __name__ == '__main__':
    unittest.main()
