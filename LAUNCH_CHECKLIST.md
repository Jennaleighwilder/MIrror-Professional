# Launch Checklist (GitHub + Gumroad + Fiverr)

Use this checklist to publish the software for investors and paid customers.

## 1) GitHub (public or private)
- [ ] Create a new repo: `mirror-professional`
- [ ] Initialize git inside `release/`
- [ ] Commit all files
- [ ] Push to GitHub

Commands to run in `release/`:
```bash
git init
git add .
git commit -m "Mirror Professional release"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## 2) Gumroad (sellable download)
- [ ] Create a new product: "Mirror Professional™ - Luxury Matchmaking OS"
- [ ] Upload `mirror-pro-release.zip`
- [ ] Paste the Gumroad description from `marketing/gumroad.md`
- [ ] Set price and add license terms (from README)

## 3) Fiverr (service listing)
- [ ] Create a new gig: “Deploy Luxury Matchmaking Platform”
- [ ] Use copy from `marketing/fiverr.md`
- [ ] Add screenshots (dashboard, reports, client portal)
- [ ] Add FAQ (included in fiverr.md)

## 4) Demo flow (investor ready)
- [ ] Start backend + frontend
- [ ] Login with demo credentials
- [ ] Invite a client (send yourself the link)
- [ ] Complete Phase 1-4 with short text
- [ ] Generate a Dyad Engine report
- [ ] Show flags + role lock prediction
