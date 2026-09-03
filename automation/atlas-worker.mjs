#!/usr/bin/env node
/**
 * ATLAS hourly cycle worker.
 *
 * Runs one autonomous cycle:
 *   1. Collect research candidates from public APIs (Hacker News, GitHub)
 *      via sources.mjs.
 *   2. Audit the configured user's public GitHub repos for upgrade candidates.
 *   3. Maintain knowledge-base/build-queue.json: prioritized upgrade +
 *      idea candidates for the next agent build cycle.
 *   4. Deduplicate against previously seen items.
 *   5. Write a markdown cycle report to knowledge-base/cycles/.
 *   6. Optionally email the report via Gmail SMTP
 *      (requires GMAIL_USER + GMAIL_APP_PASSWORD env vars; see automation/README.md).
 *
 * Design rules:
 *  - Zero required dependencies. Nodemailer is loaded dynamically only when
 *    email credentials are configured.
 *  - A failing source never aborts the cycle; failures are recorded.
 *  - Never logs secrets. Network timeouts are bounded.
 */

import { readFile, writeFile, mkdir, appendFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectHackerNews, collectGithub, auditRepos, updateBuildQueue } from './sources.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KB_DIR = path.join(ROOT, 'knowledge-base');
const CYCLES_DIR = path.join(KB_DIR, 'cycles');
const SEEN_FILE = path.join(KB_DIR, 'seen.json');
const QUEUE_FILE = path.join(KB_DIR, 'build-queue.json');
const LOG_FILE = path.join(ROOT, 'automation', 'logs', 'worker.log');
const CONFIG_FILE = path.join(ROOT, 'automation', 'config.json');

function log(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}`;
  console.log(line);
  appendFile(LOG_FILE, line + '\n').catch(() => {});
}

async function loadJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

async function loadConfig() {
  if (!existsSync(CONFIG_FILE)) {
    return { keywords: ['agriculture', 'accessibility', 'offline-first'], maxItemsPerSource: 5 };
  }
  return loadJson(CONFIG_FILE, {});
}

// --- Email (optional) --------------------------------------------------------

async function sendReportEmail(subject, body, config) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    log('INFO', 'email skipped: GMAIL_USER / GMAIL_APP_PASSWORD not configured');
    return false;
  }
  let nodemailer;
  try {
    nodemailer = (await import('nodemailer')).default;
  } catch {
    log('WARN', 'email skipped: nodemailer not installed (run npm install in automation/)');
    return false;
  }
  const to = config?.email?.to || user;
  const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({ from: `ATLAS Worker <${user}>`, to, subject, text: body });
  log('INFO', `report emailed to ${to}`);
  return true;
}

// --- Main cycle --------------------------------------------------------------

async function main() {
  const started = new Date();
  log('INFO', '--- cycle start ---');
  const config = await loadConfig();
  const limit = config.maxItemsPerSource || 5;
  const failures = [];

  await mkdir(CYCLES_DIR, { recursive: true });
  await mkdir(path.dirname(LOG_FILE), { recursive: true });

  const seen = await loadJson(SEEN_FILE, { urls: [] });
  const seenSet = new Set(seen.urls);

  let hn = [];
  let gh = [];
  try {
    hn = await collectHackerNews(limit, log);
  } catch (err) {
    failures.push(`hacker-news: ${err.message}`);
    log('WARN', `hacker-news failed: ${err.message}`);
  }
  try {
    gh = await collectGithub(config.keywords || [], limit, log);
  } catch (err) {
    failures.push(`github: ${err.message}`);
    log('WARN', `github failed: ${err.message}`);
  }

  let upgrades = [];
  try {
    upgrades = await auditRepos(config.githubUser);
  } catch (err) {
    failures.push(`repo-audit: ${err.message}`);
    log('WARN', `repo audit failed: ${err.message}`);
  }

  const all = [...hn, ...gh];
  const fresh = all.filter((item) => item.url && !seenSet.has(item.url));
  for (const item of fresh) seenSet.add(item.url);

  const ideas = gh.slice(0, limit).map((item) => ({
    kind: 'idea',
    title: item.title,
    url: item.url,
    description: item.description || '',
    addedAt: new Date().toISOString(),
  }));

  const queue = await updateBuildQueue(QUEUE_FILE, upgrades, ideas).catch((err) => {
    log('WARN', `build queue update failed: ${err.message}`);
    return null;
  });

  // Keep seen-list bounded (last 5000 urls).
  const seenUrls = [...seenSet].slice(-5000);

  const stamp = started.toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const reportPath = path.join(CYCLES_DIR, `cycle-${stamp}.md`);

  const lines = [
    `# ATLAS Research Cycle — ${started.toISOString()}`,
    '',
    `- Fresh items found: ${fresh.length}`,
    `- Failures: ${failures.length ? failures.join('; ') : 'none'}`,
    '',
    '## Hacker News (front page)',
    '',
    ...hn.map((h) => `- [${h.title}](${h.url}) — ${h.points ?? '?'} points`),
    '',
    '## GitHub — newly created repos by keyword',
    '',
    ...(gh.length
      ? gh.map((g) => `- [${g.title}](${g.url}) — ${g.description}`)
      : ['(no results or source failed)']),
    '',
    '## Fresh items not seen before',
    '',
    ...(fresh.length ? fresh.map((f) => `- [${f.title}](${f.url}) (${f.source})`) : ['(none)']),
    '',
    `## Repo health audit (${config.githubUser || 'not configured'})`,
    '',
    ...(upgrades.length
      ? upgrades
          .slice(0, 20)
          .map(
            (u) =>
              `- [${u.repo}](${u.url}) — ${u.reasons.join(', ')} (last push ${u.pushedDaysAgo}d ago)`
          )
      : ['(no issues found or audit unavailable)']),
    '',
    `## Build queue (upgrade: ${queue ? queue.upgradeCandidates.length : '?'}, ideas: ${queue ? queue.ideaCandidates.length : '?'})`,
    '',
    'Next agent build cycle should pick from knowledge-base/build-queue.json.',
    '',
  ];
  const report = lines.join('\n');
  await writeFile(reportPath, report, 'utf8');
  await writeFile(SEEN_FILE, JSON.stringify({ urls: seenUrls }, null, 2), 'utf8');
  log('INFO', `report written: ${path.relative(ROOT, reportPath)}`);

  let emailed = false;
  try {
    emailed = await sendReportEmail(
      `ATLAS research cycle ${stamp} — ${fresh.length} fresh items`,
      report,
      config
    );
  } catch (err) {
    failures.push(`email: ${err.message}`);
    log('WARN', `email failed: ${err.message}`);
  }

  log('INFO', `--- cycle done: ${fresh.length} fresh, ${failures.length} failures, emailed=${emailed} ---`);

  // Non-zero exit only if the whole cycle produced nothing AND sources failed.
  if (all.length === 0 && failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  log('ERROR', `cycle crashed: ${err.stack || err.message}`);
  process.exitCode = 1;
});
