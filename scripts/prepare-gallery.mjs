// Compose a project cover and genuine capture frames; no generated gameplay.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(execFile);
const [walkthrough, result] = process.argv.slice(2);
if (!walkthrough || !result) throw Error('Usage: node scripts/prepare-gallery.mjs /path/to/verified-live-walkthrough.mp4 /path/to/same-round-result.png');
const output = resolve('docs/submission-assets/gallery');
const source = resolve('release/gallery-source', new Date().toISOString().replace(/[:.]/g, '-'));
await mkdir(output, { recursive: true }); await mkdir(source, { recursive: true });
for (const [name, seconds] of [['rescue', 49.7], ['approval', 40.3]]) {
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-n', '-ss', String(seconds), '-i', resolve(walkthrough), ...(name === 'rescue' ? ['-vf', 'crop=1920:992:0:0'] : []), '-frames:v', '1', join(source, `${name}.png`)]);
}
const dataImage = async path => `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
const rescue = await dataImage(join(source, 'rescue.png'));
const approval = await dataImage(join(source, 'approval.png'));
const resultImage = await dataImage(resolve(result));
const creature = await readFile('public/creature.svg', 'utf8');
const architecture = await readFile('docs/submission-assets/architecture.svg', 'utf8');
const base = `*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden}body{background:#100b24;color:#fff7e8;font-family:'Helvetica Neue',Arial,sans-serif}h1,h2,p{margin:0}.lime{color:#c5f45b}.eyebrow{font-size:17px;letter-spacing:3px;text-transform:uppercase;font-weight:700}.sub{color:#bfb1d5}.foot{position:absolute;bottom:28px;left:64px;right:64px;display:flex;justify-content:space-between;font-size:17px;color:#bfb1d5}header{position:absolute;top:40px;left:64px;right:64px;display:flex;justify-content:space-between;align-items:center}header h1{font-size:38px;letter-spacing:-1px}.rule{height:2px;background:linear-gradient(90deg,#c5f45b,transparent);margin-top:26px;width:280px}.tag{border:1px solid #5f4c77;border-radius:30px;padding:12px 20px;font-size:17px;color:#d2c5e2}.shot{position:absolute;left:64px;right:64px;top:148px;bottom:86px;border:1px solid #534268;border-radius:18px;overflow:hidden;background:#161027}.shot img{width:100%;height:100%;object-fit:cover}.accent{color:#53e0ec}`;
const wrap = (css, body) => `<!doctype html><meta charset="utf-8"><style>${base}${css}</style>${body}`;
const head = (title, tag) => `<header><div><p class="eyebrow lime">CHATMADE</p><h1>${title}</h1></div><span class="tag">${tag}</span></header>`;
const foot = right => `<div class="foot"><span>Chat builds the monster. The streamer survives it.</span><span>${right}</span></div>`;
const pages = {
  cover: wrap(`body{background:radial-gradient(ellipse at 86% 40%,#463267 0,transparent 50%),#100b24}.copy{position:absolute;top:68px;left:64px;z-index:2}h1{font-size:90px;letter-spacing:-5px;line-height:1;margin:22px 0 42px}h2{font-size:57px;letter-spacing:-2px;line-height:1.08}p.subtitle{font-size:28px;line-height:1.4;margin-top:23px}.creature{position:absolute;width:440px;height:440px;right:22px;top:155px;transform:rotate(-7deg)}.creature svg{width:100%;height:100%;filter:drop-shadow(0 25px 35px #080512)}.steps{position:absolute;left:64px;right:64px;bottom:104px;display:flex;align-items:center;gap:20px}.step{border-top:1px solid #645373;padding:18px 0;width:30%;font-size:24px}.step small{display:block;color:#bfb1d5;font-size:16px;margin-top:6px}.num{color:#c5f45b;margin-right:10px}.arrow{color:#8d79aa;font-size:24px}`, `<div class="copy"><p class="eyebrow lime">A Twitch audience-participation game</p><h1>ChatMade<span class="lime">*</span></h1><h2>Chat builds<br>the monster.</h2><p class="subtitle sub">The streamer survives it.<br>Or chat comes to the rescue.</p></div><div class="creature">${creature}</div><div class="steps"><div class="step"><span class="num">01</span>Invent<small>Body · power · weakness</small></div><span class="arrow">→</span><div class="step"><span class="num">02</span>Vote<small>The host approves</small></div><span class="arrow">→</span><div class="step"><span class="num">03</span>Rescue<small>Help the streamer survive</small></div></div><div class="foot"><span>Built with OpenAI Codex</span><span>Original game artwork</span></div>`),
  rescue: wrap('.shot img{object-fit:contain;object-position:center}', head('Chat helps turn the encounter around.', 'Real Twitch test · one account') + `<div class="shot"><img src="${rescue}" alt="Actual recorded Twitch round and rescue effect"></div>` + foot('Rescue threshold 1 · actual captured gameplay')),
  approval: wrap('.shot img{object-fit:cover;object-position:top;height:auto}', head('Chat votes. The host has the final say.', 'Actual host controls') + `<div class="shot"><img src="${approval}" alt="Actual selected recipe awaiting host approval"></div>` + foot('One account · same original art across recipes')),
  result: wrap('.shot{display:flex;justify-content:center;align-items:center}.shot img{width:auto;max-width:100%;height:100%;object-fit:contain}', head('Every round leaves a shared result.', 'Actual exported PNG') + `<div class="shot"><img src="${resultImage}" alt="Actual CAUGHT result with contribution credits"></div>` + foot('Live Twitch test · one account · threshold 1')),
  architecture: wrap('.diagram{position:absolute;left:50px;right:50px;top:200px;bottom:160px;display:flex;align-items:center;justify-content:center}.diagram svg{width:100%;height:100%}.limit{position:absolute;left:64px;bottom:100px;right:64px;font-size:22px;color:#bfb1d5}', head('Built locally. Connected through Twitch.', 'Delivered architecture') + `<div class="diagram">${architecture.replace(/<\?xml[^>]*\?>/g, '').replace(/<!DOCTYPE[\s\S]*?\]>/g, '').replace(/<!DOCTYPE[^>]*>/g, '')}</div><p class="limit">Codex assisted development. Gameplay runs deterministic code; no runtime AI or generated creature art.</p>` + foot('Read-only broadcast view · designed for OBS')),
};
const server = createServer((req, res) => { const page = pages[req.url.slice(1)]; res.statusCode = page ? 200 : 404; res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(page ?? 'Not found'); });
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
let browser;
const files = [['cover', '01-thumbnail.png', 1200, 800], ['rescue', '02-live-rescue.png', 1920, 1080], ['approval', '03-host-approval.png', 1920, 1080], ['result', '04-live-result.png', 1920, 1080], ['architecture', '05-architecture.png', 1920, 1080]];
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [key, filename, width, height] of files) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${server.address().port}/${key}`);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(im => im.decode())); });
    await page.screenshot({ path: join(output, filename) }); await page.close();
  }
} finally { await browser?.close(); await new Promise(ok => server.close(ok)); }
await writeFile(join(output, 'provenance.json'), JSON.stringify({ walkthrough: resolve(walkthrough), result: resolve(result), frameSeconds: { rescue: 49.7, approval: 40.3 }, source, notes: 'Designed cover uses original public/creature.svg. Gallery frames are real captured UI with presentation headers; no synthetic gameplay. Result is from same one-account Twitch round.', files: files.map(([scene, file, width, height]) => ({ scene, file, width, height })) }, null, 2));
console.log(`Prepared 5 images in ${output}`);
