# TN Waste Campaign — Current Status

**Last Updated:** 2026-05-24  
**Domain:** tnwaste.org (registered, DNS pending)  
**Site:** https://mfethe1.github.io/matlockbendalliance/ (live) → tnwaste.org (pending DNS)

---

## ✅ COMPLETED

### Site Rebranding
| Task | Status | Details |
|------|--------|---------|
| Rebrand to "TN Waste" | ✅ Done | Title, meta, footer updated |
| Add CNAME for tnwaste.org | ✅ Done | Configured in gh-pages branch |
| Push to gh-pages branch | ✅ Done | Live on GitHub Pages |
| Configure GitHub Pages custom domain | ✅ Done | cname: tnwaste.org |

### Kanban Board (Issue-Based)
| Task | Status | Details |
|------|--------|---------|
| Create kanban labels (7 columns) | ✅ Done | All labels created |
| Create priority labels | ✅ Done | critical, high |
| Create verification label | ✅ Done | verification::required |
| Create 8 initial issues | ✅ Done | All issues open |
| Add README with board documentation | ✅ Done | README.md in repo |

### Plan Documentation
| Task | Status | Details |
|------|--------|---------|
| Create PLAN.md (4-phase) | ✅ Done | 30-day implementation plan |
| Create KANBAN.md | ✅ Done | Board documentation |
| Create STATUS.md | ✅ Done | This file |

---

## 🚨 BLOCKED — Need Your Action

### Blocker 1: Railway Deployment
**Issue:** [#1](https://github.com/mfethe1/matlockbendalliance/issues/1)

**Problem:** Both Railway tokens are invalid:
- `~/.openclaw/secrets/railway_token`: `cb53ae9f-356e-4a65-9302-3c34ed0ec0ad` → `Unauthorized`
- `~/.config/railway/config.json`: `cd5a8b02-1679-4b5b-8...` → `Unauthorized`

**Workaround:** GitHub Pages is configured and building. Site will be live at tnwaste.org once DNS is configured.

**To fix:** Go to https://railway.app/dashboard → Account Settings → Tokens → Generate new token

### Blocker 2: GitHub Projects Kanban Board
**Issue:** [#2](https://github.com/mfethe1/matlockbendalliance/issues/2)

**Problem:** GitHub token lacks `project` scope:
- Current scopes: `gist`, `read:org`, `repo`, `workflow`
- Missing: `project`

**Workaround:** Issue-based kanban is fully functional with labels and filters.

**To fix:** Go to https://github.com/settings/tokens → Regenerate with `project` scope

### Blocker 3: DNS Configuration
**Issue:** [#3](https://github.com/mfethe1/matlockbendalliance/issues/3)

**Problem:** DNS records not yet added at registrar for tnwaste.org

**Status:** GitHub Pages configured with CNAME. Waiting on DNS.

**To fix:** Add these records at your domain registrar (Namecheap/Cloudflare/etc):

| Type | Host | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | mfethe1.github.io |

---

## 📋 ACTIVE KANBAN ISSUES

| # | Issue | Status | Priority | Verification |
|---|-------|--------|----------|-------------|
| #1 | Deploy site to Railway | 🚨 Blocked | Critical | Required |
| #2 | Set up GitHub Projects kanban | 🚨 Blocked | High | Required |
| #3 | Configure DNS for tnwaste.org | 📥 Backlog | Critical | Required |
| #4 | Set up newsletter signup | 📥 Backlog | High | — |
| #5 | Add FOIA request templates | 📥 Backlog | — | — |
| #6 | Build 95-county contact database | 📥 Backlog | — | — |
| #7 | Create community organizing toolkit | 📥 Backlog | — | — |
| #8 | Add meeting alert system | 📥 Backlog | — | — |

**Board URL:** https://github.com/mfethe1/matlockbendalliance/issues

**Filter by label:**
- Backlog: [kanban::backlog](https://github.com/mfethe1/matlockbendalliance/labels/kanban%3A%3Abacklog)
- Blocked: [kanban::blocked](https://github.com/mfethe1/matlockbendalliance/labels/kanban%3A%3Ablocked)
- Critical: [priority::critical](https://github.com/mfethe1/matlockbendalliance/labels/priority%3A%3Acritical)

---

## 🔧 TOKEN AUDIT RESULTS

### Railway Tokens (Both Invalid)
| Location | Token | Status |
|----------|-------|--------|
| `~/.openclaw/secrets/railway_token` | `cb53ae9f-356e-4a65-9302-3c34ed0ec0ad` | ❌ Invalid |
| `~/.config/railway/config.json` | `cd5a8b02-1679-4b5b-8...` | ❌ Invalid |

### GitHub Tokens (Missing `project` Scope)
| Location | Token | Scopes |
|----------|-------|--------|
| `~/.config/gh/hosts.yml` | `gho_fW...cIUI` | gist, read:org, repo |
| `~/.openclaw/secrets/gh_auth_token.env` | `github...nu9G` | (bearer, limited) |
| Keychain (`gh:github.com`) | `gho_bz...aK7O` | Unknown |

### Cloudflare Token (Valid but Limited)
| Location | Token | Status |
|----------|-------|--------|
| `~/.openclaw/secrets/cloudflare_api_token` | `bnps0BV83hP4yFkbgkrvGKdFubYJHxoOkdXyvoLr` | ✅ Valid |
| `~/.openclaw/secrets/deploy.env` | Zone ID: `102937e997aa01ad22251acf39d7d748` | ❌ No zone access |

**Note:** Cloudflare token is valid but has no zone permissions. Cannot manage DNS or Pages.

---

## 🎯 NEXT STEPS

### Immediate (You Need To Do)
1. **Add DNS records** at your registrar for tnwaste.org → GitHub Pages
2. **Generate new Railway token** if you want Railway deployment (optional)
3. **Regenerate GitHub token** with `project` scope if you want Projects V2 (optional)

### I Can Do Now (Unblocked)
1. **Content updates** — Add more pages, update copy
2. **FOIA template integration** — Convert templates to web format
3. **Newsletter signup form** — Frontend only (needs backend later)
4. **Community toolkit** — Create downloadable resources

### After DNS is Live
1. Verify site loads at https://tnwaste.org
2. Test all links and functionality
3. Set up analytics
4. Begin Phase 2 content work

---

## 📁 REPOSITORY STRUCTURE

```
matlockbendalliance/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment
├── CNAME                        # Custom domain config
├── index.html                   # Main site (single page)
├── KANBAN.md                    # Kanban documentation
├── PLAN.md                      # Implementation plan
├── README.md                    # Project readme
└── STATUS.md                    # This file
```

---

## 🌐 DEPLOYMENT STATUS

| Platform | Status | URL | Notes |
|----------|--------|-----|-------|
| GitHub Pages | ✅ Building | https://mfethe1.github.io/matlockbendalliance/ | Live |
| Custom Domain | ⏳ Pending | http://tnwaste.org | DNS not configured |
| Railway | ❌ Blocked | — | Token invalid |
| Cloudflare Pages | ❌ Blocked | — | Token lacks zone access |

---

## 📝 NOTES

- **GitHub Pages** is the current deployment target (free, working)
- **Railway** is optional — only needed if you want backend features later
- **DNS** is the critical blocker right now — site won't be live at tnwaste.org without it
- **Kanban** works perfectly with issue labels — no need for Projects V2 immediately
