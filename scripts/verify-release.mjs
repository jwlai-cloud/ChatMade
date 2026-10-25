import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import { access, readFile, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

export async function verifyRelease(folder) {
  const data = resolve(folder, 'data');
  await assert.rejects(access(data), 'Release verification requires a fresh package without user data.');
  let log = '', completed = false;
  const child = fork(resolve(folder, 'scripts/launch.mjs'), [], { cwd: folder, execPath: resolve(folder, 'runtime/node'), execArgv: [], env: { ...process.env, CHATMADE_PORT: '0', CHATMADE_NO_OPEN: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  child.stdout.on('data', chunk => { log += chunk; });
  child.stderr.on('data', () => {});
  const exit = new Promise(ok => child.once('exit', ok));
  try {
    const ready = await new Promise((ok, fail) => {
      const timeout = setTimeout(() => fail(new Error('Packaged app did not become ready within 15 seconds.')), 15000);
      child.once('message', message => { clearTimeout(timeout); ok(message); });
      child.once('error', error => { clearTimeout(timeout); fail(error); });
      child.once('exit', () => { clearTimeout(timeout); fail(new Error('Packaged app exited before becoming ready.')); });
    });
    assert.equal(ready.type, 'ready');
    const response = await fetch(`${ready.origin}/api/state`);
    assert.equal(response.status, 200); const state = await response.json(); assert.equal(state.phase, 'LOBBY'); assert.equal(state.mode, 'sample');
    assert.ok(['unconfigured', 'disconnected'].includes(state.twitch.status));
    assert.equal((await fetch(`${ready.origin}/host`)).status, 200);
    assert.equal((await fetch(`${ready.origin}/broadcast`)).status, 200);
    assert.equal((await fetch(`${ready.origin}/data/open-host.html`)).status, 404);
    const key = await readFile(resolve(data, 'host-key.txt'), 'utf8');
    assert.equal((await stat(ready.hostLauncher)).mode & 0o777, 0o600);
    assert.ok((await readFile(ready.hostLauncher, 'utf8')).includes(`#host-key=${key}`));
    assert.ok(!log.includes(key));
    assert.ok(!JSON.stringify(state).includes(key));
    completed = true;
  } finally {
    child.kill('SIGTERM');
    let timeout;
    const code = await Promise.race([exit, new Promise((_, fail) => { timeout = setTimeout(() => { child.kill('SIGKILL'); fail(new Error('Packaged app did not shut down cleanly.')); }, 5000); })]).finally(() => clearTimeout(timeout));
    await rm(data, { recursive: true, force: true });
    if (completed) assert.equal(code, 0, 'Packaged app must shut down successfully.');
  }
  console.log('Packaged runtime smoke check passed: startup, host, broadcast, private launcher and clean shutdown.');
}
