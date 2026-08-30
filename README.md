# Outreach Tracker

A lead/outreach tracker for LinkedIn, Facebook, Email, and Upwork prospecting.
Data is stored in Airtable, so it survives redeploys and restarts (unlike a plain
file on Render's free tier, which resets on every deploy or restart).

## 1. Get your Airtable Personal Access Token (PAT)

The base and table are already created for you:
- Base ID: `appJ0tbTCFcdBVX5h` (name: "Outreach Tracker")
- Table ID: `tblJByK0KN0KMMsVi` (name: "Leads")

To let this app read/write to it, you need your own token:

1. Go to https://airtable.com/create/tokens
2. Click **Create new token**
3. Name it anything, e.g. "Outreach Tracker App"
4. Under **Scopes**, add:
   - `data.records:read`
   - `data.records:write`
5. Under **Access**, add the base **"Outreach Tracker"**
6. Click **Create token** and copy it immediately (you won't see it again)

## 2. Test locally (optional but recommended)

```bash
cd outreach-tracker
npm install
cp .env.example .env
# edit .env and paste your real AIRTABLE_PAT
npm start
```

Open http://localhost:3000 — you should see the tracker, empty at first.

## 3. Push to GitHub

```bash
cd outreach-tracker
git init
git add .
git commit -m "Initial commit: outreach tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/outreach-tracker.git
git push -u origin main
```

(`.env` is already in `.gitignore` — your token will never be committed.)

## 4. Deploy on Render

1. Go to https://dashboard.render.com → **New** → **Web Service**
2. Connect your GitHub repo (`outreach-tracker`)
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. Under **Environment Variables**, add:
   - `AIRTABLE_PAT` = (the token from step 1)
   - `AIRTABLE_BASE_ID` = `appJ0tbTCFcdBVX5h`
   - `AIRTABLE_TABLE_ID` = `tblJByK0KN0KMMsVi`
5. Click **Create Web Service**

Render will build and deploy automatically. You'll get a URL like
`https://outreach-tracker.onrender.com`.

## Notes on the free tier

- The service **spins down after 15 minutes of no traffic** and takes about a
  minute to wake up on the next request. This is normal — just a cold-start
  delay, not a bug.
- Your data lives in Airtable, not on Render's disk, so **redeploys and
  restarts never wipe your leads**.
- You can also open the Airtable base directly (airtable.com) to view or bulk-edit
  your leads as a spreadsheet any time — it's the same data.

## How the follow-up flagging works

- A lead marked **Sent** turns amber ("Follow-up due") after 3 days with no status change.
- It turns red ("Overdue — 2nd follow-up") after 7 days.
- Once you mark it Replied / Booked / Won / Dead, the flag clears.

To change these thresholds, edit the `daysSince` comparisons (`>= 3` and `>= 7`)
in `public/index.html`.
