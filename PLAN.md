# TN Waste Campaign — Implementation Plan

## Phase 1: Domain + Site Launch (Days 1-3)

| Step | Task | Owner | Verification |
|------|------|-------|------------|
| 1.1 | Point tnwaste.org DNS to GitHub Pages | Macklemore | DNS propagation check |
| 1.2 | Rebrand site: Matlock Bend Alliance → TN Waste | Jake | Visual diff |
| 1.3 | Update all internal links for new domain | Jake | Link checker |
| 1.4 | Add CNAME file to repo | Jake | GitHub Pages settings confirm |
| 1.5 | Verify HTTPS certificate | Lenny | SSL Labs test |
| 1.6 | Test mobile responsiveness | Lenny | iPhone + Android |

## Phase 2: Content + Features (Days 4-7)

| Step | Task | Owner | Verification |
|------|------|-------|------------|
| 2.1 | Add newsletter signup backend (Formspree/ConvertKit) | Macklemore | Test submission |
| 2.2 | Embed FOIA request templates as downloadable PDFs | Archie | Download + open test |
| 2.3 | Add "Take Action" form (email reps) | Jake | Send test email |
| 2.4 | Meeting alert signup (calendar integration) | Macklemore | Calendar invite test |
| 2.5 | SEO optimization for "TN landfill" keywords | Rosie | Search ranking check |

## Phase 3: Campaign Tools (Days 8-14)

| Step | Task | Owner | Verification |
|------|------|-------|------------|
| 3.1 | Build 95-county contact database | Rosie | Spot-check 5 counties |
| 3.2 | Draft legislator briefs per district | Rosie + Archie | Legal review |
| 3.3 | Create social media content calendar | Winnie | Post + engagement test |
| 3.4 | Set up automated meeting alerts | Macklemore | Receive test alert |
| 3.5 | Launch petition with signature goal | Winnie | Sign + confirm |

## Phase 4: State-Level Campaign (Days 15-30)

| Step | Task | Owner | Verification |
|------|------|-------|------------|
| 4.1 | Identify bill sponsors for PFAS/medical waste bans | Rosie | Legislator confirmation |
| 4.2 | Schedule meetings with key committee chairs | Winnie | Calendar invites sent |
| 4.3 | Produce video content for social sharing | Winnie | Publish + share test |
| 4.4 | Coordinate with SELC for precedent case files | Rosie | File receipt |
| 4.5 | Organize community meeting (in-person) | Winnie | Venue + attendance |

---

## Kanban Board Columns

1. **Backlog** — All tasks start here
2. **Ready** — Groomed, assigned, ready to start
3. **In Progress** — Active work
4. **Review** — Done, awaiting verification
5. **Verification Required** — Critical tasks need second check
6. **Done** — Verified and complete
7. **Blocked** — Waiting on external dependency

---

## Verification Rules

- **Standard tasks:** Self-verify + screenshot
- **Critical tasks (🚨):** Two-person verification required
- **Deployment tasks:** Automated test + manual check
- **Content tasks:** Spell check + fact check + legal review

## Blocked Items

| Item | Blocker | Resolution Path |
|------|---------|----------------|
| GitHub Projects kanban | Token lacks `project` scope | Regenerate token at github.com/settings/tokens |
| Railway deployment | No Railway project specified | Confirm: GitHub Pages vs Railway hosting |
| Precedent case docs | SELC contact needed | Call (615) 390-2300 |
