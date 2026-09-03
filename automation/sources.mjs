/**
 * ATLAS research sources: public-API collectors, repo health audit, and the
 * persistent build queue. Zero dependencies; every network call is bounded.
 */

import { readFile, writeFile } from 'node:fs/promises';

const FETCH_TIMEOUT_MS = 20000;
const STALE_DAYS = 60;

export async function fetchJson(url) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'ATLAS-research-worker/1.0' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

export async function collectHackerNews(limit, log) {
  const data = await fetchJson(
    'https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=' + limit
  );
  return (data.hits || []).map((h) => ({
    source: 'hacker-news',
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    points: h.points,
    date: h.created_at,
    discussion: `https://news.ycombinator.com/item?id=${h.objectID}`,
  }));
}

export async function collectGithub(keywords, limit, log) {
  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const results = [];
  for (const kw of keywords) {
    try {
      const q = encodeURIComponent(`created:>${since} ${kw}`);
      const data = await fetchJson(
        `https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=${limit}`
      );
      for (const r of data.items || []) {
        results.push({
          source: 'github',
          title: `${r.full_name} ★${r.stargazers_count}`,
          url: r.html_url,
          description: r.description || '',
          date: r.created_at,
        });
      }
    } catch (err) {
      log('WARN', `github keyword "${kw}" failed: ${err.message}`);
    }
  }
  return results;
}

/**
 * One API call per cycle: classify the user's public repos into upgrade
 * candidates (missing license/description, staleness, empty forks).
 * Private repos are not visible to the unauthenticated worker — agent
 * sessions cover those via the authenticated GitHub integration.
 */
export async function auditRepos(githubUser) {
  if (!githubUser) return [];
  const repos = await fetchJson(
    `https://api.github.com/users/${encodeURIComponent(githubUser)}/repos?per_page=100&sort=pushed`
  );
  const now = Date.now();
  const candidates = [];
  for (const r of repos) {
    if (r.archived) continue;
    const reasons = [];
    const ageDays = Math.floor((now - new Date(r.pushed_at).getTime()) / 86400000);
    if (!r.license) reasons.push('no license');
    if (!r.description) reasons.push('no description');
    if (ageDays > STALE_DAYS) reasons.push(`stale ${ageDays}d since last push`);
    if (r.fork && r.stargazers_count === 0) reasons.push('empty fork');
    if (reasons.length > 0) {
      candidates.push({
        kind: 'upgrade',
        repo: r.full_name,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        pushedDaysAgo: ageDays,
        reasons,
        addedAt: new Date().toISOString(),
      });
    }
  }
  // Highest value first: most recently touched repos with issues.
  candidates.sort((a, b) => a.pushedDaysAgo - b.pushedDaysAgo);
  return candidates;
}

/** Merge new candidates into the persistent build queue, deduped by url. */
export async function updateBuildQueue(queueFile, upgrades, ideas) {
  let prev = { updatedAt: null, upgradeCandidates: [], ideaCandidates: [] };
  try {
    prev = JSON.parse(await readFile(queueFile, 'utf8'));
  } catch {
    /* first run */
  }
  const byUrl = new Map();
  for (const item of [...prev.upgradeCandidates, ...upgrades]) byUrl.set(item.url, item);
  for (const item of [...prev.ideaCandidates, ...ideas]) byUrl.set(item.url, item);
  const all = [...byUrl.values()];
  const queue = {
    updatedAt: new Date().toISOString(),
    upgradeCandidates: all.filter((i) => i.kind === 'upgrade').slice(0, 50),
    ideaCandidates: all.filter((i) => i.kind === 'idea').slice(0, 50),
  };
  await writeFile(queueFile, JSON.stringify(queue, null, 2), 'utf8');
  return queue;
}
