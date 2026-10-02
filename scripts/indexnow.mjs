import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const host = 'x-facture.com';
const sitemapPath = 'public/sitemap.xml';
const keyFile = 'public/ddbaab5b847ef316ce2b5fb1e24d518ab8ec194fcf1e818c51c61714cf0cface.txt';
const key = (await readFile(keyFile, 'utf8')).trim();
const currentSitemap = await readFile(sitemapPath, 'utf8');
const fullSubmission = process.env.INDEXNOW_FULL === 'true';

function parseSitemap(xml) {
  const map = new Map();
  for (const block of xml.matchAll(/<url>[\\s\\S]*?<\\/url>/g)) {
    const loc = block[0].match(/<loc>([^<]+)<\\/loc>/)?.[1]?.trim();
    if (loc) map.set(loc, block[0]);
  }
  return map;
}

function changedUrls() {
  if (fullSubmission) return [...parseSitemap(currentSitemap).keys()];
  try {
    const previous = execFileSync('git', ['show', 'HEAD^:' + sitemapPath], { encoding: 'utf8' });
    const before = parseSitemap(previous);
    const after = parseSitemap(currentSitemap);
    const changed = new Set();
    for (const [url, block] of after) if (before.get(url) !== block) changed.add(url);
    for (const url of before.keys()) if (!after.has(url)) changed.add(url);
    return [...changed];
  } catch {
    return [...parseSitemap(currentSitemap).keys()];
  }
}

const urls = changedUrls();
if (!urls.length) {
  console.log(`IndexNow: no changed sitemap URLs for ${host}.`);
  process.exit(0);
}

for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  let accepted = false;
  for (let attempt = 1; attempt <= 40; attempt++) {
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {'Content-Type': 'application/json; charset=utf-8'},
      body: JSON.stringify({host, key, urlList: batch})
    });
    const body = await response.text();
    if (response.status === 200 || response.status === 202) {
      console.log(`IndexNow accepted ${batch.length} changed URLs for ${host}.`);
      accepted = true;
      break;
    }
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get('retry-after') || 60);
      console.warn(`IndexNow rate limited; retrying in ${retryAfter}s.`);
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      continue;
    }
    if (response.status === 403 && attempt < 40) {
      console.warn(`IndexNow key not verified yet; retrying in 15s (attempt ${attempt}/40).`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
      continue;
    }
    throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
  }
  if (!accepted) throw new Error('IndexNow submission did not complete.');
}
