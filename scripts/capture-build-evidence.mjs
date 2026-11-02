// Record real repository files and a fresh fixed-command test run.
// This evidence viewer is explicitly not a recording of the Codex application.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const run = promisify(execFile);
const output = resolve('release/video', `codex-build-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(join(output, 'raw'), { recursive: true });
const renderer = (await readFile('src/arena.ts', 'utf8')).split('\n').slice(9, 11).map((s, i) => `${i + 10}  ${s}`).join('\n');
const regression = await readFile('tests/arena.test.ts', 'utf8');
const contribution = (await readFile('docs/CONTRIBUTIONS.md', 'utf8')).split('\n').find(s => s.startsWith('Rotated successive'));
if (!contribution) throw Error('Documented contribution not found. Review the evidence source.');
const revision = (await run('git', ['rev-parse', '--short', 'HEAD'])).stdout.trim();
const sourceCommit = (await run('git', ['log', '-1', '--format=%h %s', '--', 'tests/arena.test.ts'])).stdout.trim();
const regressionSnippet = regression.split('\n').flatMap((line, i) => [6, 7, 11, 12, 13, 14].includes(i + 1) ? [`${i + 1}  ${line}`] : []).join('\n');
const evidence = { revision, sourceCommit, renderer, regression, regressionSnippet, contribution };
await writeFile(join(output, 'source-evidence.json'), JSON.stringify(evidence, null, 2));
let testStatus = 'idle', testOutput = '', testCode, testChild;
const append = data => { testOutput += data.toString(); };
const html = `<!doctype html><meta charset="utf-8"><title>ChatMade — Codex build evidence</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#100d20;color:#f6f0ff;font:26px Arial,sans-serif;padding:64px 76px}header{display:flex;justify-content:space-between;align-items:center;color:#b7a8d0;font-size:20px;letter-spacing:1px}.brand{color:#c5f45b;font-weight:bold}h1{font-size:52px;margin:32px 0 16px}h2{font-size:34px;color:#c5f45b}p{line-height:1.5;max-width:1600px}.tabs{display:flex;gap:16px;margin:24px 0}button{background:#2c2143;color:white;border:1px solid #78628f;border-radius:12px;padding:14px 24px;font-size:23px;cursor:pointer}button[aria-selected=true]{background:#c5f45b;color:#141020}.panel{display:none}.panel.active{display:block}pre{background:#191528;border:1px solid #44364f;border-radius:14px;padding:24px;font:21px/1.45 Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:18px 0}#renderer{font-size:24px}#terminal{height:440px;overflow:auto;color:#dbf8cf;font-size:22px}.note{font-size:23px;color:#d0bfdc}.pill{color:#c5f45b;font-size:24px}footer{position:fixed;bottom:26px;left:76px;font-size:20px;color:#b7a8d0}blockquote{margin:22px 0;border-left:5px solid #c5f45b;padding:12px 24px;line-height:1.6;font-size:29px}
</style>
<header><span class="brand">CHATMADE / CODEX BUILD EVIDENCE</span><span id="revision"></span></header>
<h1>From design decisions to checked behavior</h1>
<div class="tabs"><button data-tab="scope" aria-selected="true">1. Codex contribution</button><button data-tab="code">2. Actual code + regression</button><button data-tab="checks">3. Run tests</button></div>
<section id="scope" class="panel active"><h2>Scope → implementation → debugging</h2><p>Codex helped review the scope, build the local game and Twitch integration, and write regression tests. The owner directed the work and approved decisions.</p><blockquote id="contribution"></blockquote><p class="note">Source: docs/CONTRIBUTIONS.md — documented development work, not a recreated conversation.</p><pre id="commit"></pre></section>
<section id="code" class="panel"><h2>Attack warnings stay visible during slow / soften rescue</h2><p class="note">Current implementation: src/arena.ts:10 — stun suppresses attack warnings; the other rescue effects preserve them.</p><pre id="renderer"></pre><p class="note">Actual regression excerpt: tests/arena.test.ts — selected line numbers; setup omitted</p><pre id="regression"></pre></section>
<section id="checks" class="panel"><h2>Fresh execution against this checkout</h2><p>Command: <code>npm test</code> <span class="pill" id="status">Not started</span></p><button id="run">Run actual test suite</button><pre id="terminal" aria-live="polite"></pre><p class="note">Twitch service cases use mocks. A passing suite does not prove live reconnect, three viewers or OBS.</p></section>
<footer>Repository evidence viewer • actual source and command output • not a Codex chat recording</footer>
<script>
const evidence = ${JSON.stringify(evidence).replace(/</g, '\\u003c')};
for(const key of ['contribution','renderer'])document.getElementById(key).textContent=evidence[key];
document.getElementById('regression').textContent=evidence.regressionSnippet;
document.getElementById('revision').textContent='Checkout '+evidence.revision;
document.getElementById('commit').textContent='Tracked regression commit: '+evidence.sourceCommit;
for(const button of document.querySelectorAll('[data-tab]'))button.onclick=()=>{for(const tab of document.querySelectorAll('[data-tab]'))tab.setAttribute('aria-selected',String(tab===button));for(const p of document.querySelectorAll('.panel'))p.classList.toggle('active',p.id===button.dataset.tab);};
document.getElementById('run').onclick=async()=>{document.getElementById('run').disabled=true;await fetch('/run',{method:'POST'});const timer=setInterval(async()=>{const s=await(await fetch('/status')).json();document.getElementById('status').textContent=s.status==='done'?'Exit '+s.code:s.status;const el=document.getElementById('terminal');el.textContent=s.output;el.scrollTop=el.scrollHeight;if(s.status==='done')clearInterval(timer);},150);};
</script>`;
const server = createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(html); }
  if (req.method === 'GET' && req.url === '/status') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ status: testStatus, code: testCode, output: testOutput })); }
  if (req.method === 'POST' && req.url === '/run' && req.headers.origin === origin && testStatus === 'idle') {
    testStatus = 'running';
    testChild = spawn('npm', ['test'], { cwd: process.cwd(), env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' } });
    testChild.stdout.on('data', append); testChild.stderr.on('data', append);
    testChild.on('error', error => { testCode = -1; testStatus = 'done'; append(error.message); });
    testChild.on('close', code => { testCode = code; testStatus = 'done'; });
    return res.end('Started');
  }
  res.statusCode = 404; res.end('Not found');
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser, context, rawVideo, failure;
const hold = ms => new Promise(ok => setTimeout(ok, ms));
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: join(output, 'raw'), size: { width: 1920, height: 1080 } } });
  const page = await context.newPage(); await page.goto(origin); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, '01-contribution.png') }); await hold(6500);
  await page.getByRole('button', { name: '2. Actual code + regression', exact: true }).click();
  await page.screenshot({ path: join(output, '02-regression.png') }); await hold(8500);
  await page.getByRole('button', { name: '3. Run tests', exact: true }).click(); await hold(1000);
  await page.getByRole('button', { name: 'Run actual test suite', exact: true }).click();
  await page.getByText('Exit 0', { exact: true }).waitFor({ timeout: 60000 }); await hold(8500);
  await page.screenshot({ path: join(output, '03-test-output.png') });
  if (testStatus !== 'done' || testCode !== 0) throw Error('Fresh test run did not pass.');
  rawVideo = await page.video().path();
} catch (error) { failure = error; }
finally {
  await context?.close(); await browser?.close();
  if (testStatus === 'running') testChild?.kill('SIGTERM');
  await new Promise(ok => server.close(ok));
  await writeFile(join(output, 'npm-test.txt'), testOutput);
  await writeFile(join(output, 'capture.json'), JSON.stringify({ complete: !failure, rawVideo, testCode, revision, error: failure?.message, label: 'Repository evidence viewer; not Codex application recording' }, null, 2));
}
if (failure) throw failure;
const final = join(output, 'codex-build-evidence-1080p-silent.mp4');
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-n', '-i', rawVideo, '-vf', 'fps=30,format=yuv420p', '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-movflags', '+faststart', final]);
await run('ffmpeg', ['-v', 'error', '-i', final, '-f', 'null', '-']);
const duration = Number((await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', final])).stdout.trim());
await writeFile(join(output, 'edit.json'), JSON.stringify({ output: final, duration, silent: true, testsPassed: testCode === 0 }, null, 2));
console.log(JSON.stringify({ output: final, duration, testsPassed: testCode === 0, evidenceFolder: output }, null, 2));
