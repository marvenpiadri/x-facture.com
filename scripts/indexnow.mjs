const host = 'x-facture.com';
const sitemapUrl = 'https://x-facture.com/sitemap.xml';
const keyFileUrl = 'https://x-facture.com/ddbaab5b847ef316ce2b5fb1e24d518ab8ec194fcf1e818c51c61714cf0cface.txt';

const sitemapResponse = await fetch(sitemapUrl);
if (!sitemapResponse.ok) throw new Error(`Failed to fetch sitemap: ${sitemapResponse.status}`);
const xml = await sitemapResponse.text();
const keyResponse = await fetch(keyFileUrl);
if (!keyResponse.ok) throw new Error(`Failed to fetch IndexNow key file: ${keyResponse.status}`);
const key = (await keyResponse.text()).trim();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (!urls.length) throw new Error('No URLs found in sitemap');
if (key !== 'ddbaab5b847ef316ce2b5fb1e24d518ab8ec194fcf1e818c51c61714cf0cface') throw new Error('IndexNow key verification failed');

for (let i = 0; i < urls.length; i += 10000) {
  const batch = urls.slice(i, i + 10000);
  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: {'Content-Type': 'application/json; charset=utf-8'},
    body: JSON.stringify({host, key, urlList: batch})
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
  console.log(`IndexNow accepted ${batch.length} URLs for ${host}.`);
}
