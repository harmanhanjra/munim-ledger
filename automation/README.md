# ATLAS Automation

Hourly autonomous research + reporting cycle for the ATLAS system.

## What it does

Every hour, `automation/atlas-worker.mjs` runs one cycle:

1. **Collects research candidates** from public APIs:
   - Hacker News front page (Algolia API)
   - GitHub: newest repositories matching the keywords in `config.json`
2. **Deduplicates** against everything already seen (`knowledge-base/seen.json`,
   bounded to the last 5000 URLs).
3. **Writes a markdown report** to `knowledge-base/cycles/cycle-<timestamp>.md`.
4. **Emails the report** (only when Gmail credentials are configured — see below).
5. **Logs** every cycle to `automation/logs/worker.log`.

Failures in one source never abort the cycle; they are recorded in the report
and log. No secrets are ever written to the log.

## One-time setup: schedule the hourly task

Run this once in an elevated Command Prompt:

```bat
schtasks /create /tn "ATLAS_Hourly_Cycle" /tr "\"C:\Users\Administrator\.verdent\verdent-projects\can-you-make-automations\automation\run-cycle.cmd\"" /sc hourly /f
```

Verify:

```bat
schtasks /query /tn "ATLAS_Hourly_Cycle"
```

Remove it any time with:

```bat
schtasks /delete /tn "ATLAS_Hourly_Cycle" /f
```

## Enable email reports (Gmail)

The worker sends email via Gmail SMTP when both environment variables are set:

- `GMAIL_USER` — your Gmail address
- `GMAIL_APP_PASSWORD` — a Gmail App Password
  (Google Account → Security → 2-Step Verification → App passwords;
  a regular password will NOT work)

Set them system-wide (System Properties → Environment Variables) or add them to
`automation/run-cycle.cmd`. Also set the recipient in `automation/config.json`
(`"email": { "to": "..." }`; defaults to `GMAIL_USER` when empty). Install the
optional mail dependency once: `cd automation && npm install`.

## Run a cycle manually

```bat
automation\run-cycle.cmd
```

## What the cron job does NOT do

- It does not run the conversational agent — scoring, design, and coding
  decisions happen inside Verdent sessions, using the reports this worker
  collects.
- It does not push to GitHub on its own. Repository pushes happen from agent
  sessions (GitHub connected via Composio) after quality gates pass.
