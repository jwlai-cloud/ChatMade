import { fork, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const child = fork(resolve(root, 'scripts/start.mjs'), [], { cwd: root, env: process.env, execArgv: [], stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
child.on('message', message => {
  if (!message || message.type !== 'ready') return;
  if (process.env.CHATMADE_NO_OPEN === '1') { process.send?.(message); return; }
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open';
  const browser = spawn(opener, [message.hostLauncher], { stdio: 'ignore' });
  browser.on('error', () => console.error('Could not open browser automatically. Open data/open-host.html yourself.'));
  browser.unref();
});
child.on('error', () => { console.error('Could not start ChatMade.'); process.exitCode = 1; });
child.on('exit', code => process.exit(code ?? 1));
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
