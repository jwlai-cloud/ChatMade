import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, readFile, writeFile, chmod, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validClientId } from '../build/server/twitch.js';
import { verifyRelease } from './verify-release.mjs';

const run = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
if (process.platform !== 'darwin') throw new Error('Current release packager targets macOS. Build and verify other platforms on their native hosts before shipping them.');
const { stdout: linked } = await run('otool', ['-L', process.execPath]);
for (const line of linked.split('\n').slice(1)) {
  const library = line.trim().split(' (')[0];
  if (library && !library.startsWith('/System/Library/') && !library.startsWith('/usr/lib/')) throw new Error('Use a self-contained official Node.js binary; this runtime depends on non-system libraries.');
}
const name = `ChatMade-macOS-${process.arch}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const folder = resolve(root, 'release', name);
await mkdir(resolve(root, 'release'), { recursive: true }); await mkdir(folder);
await mkdir(resolve(folder, 'runtime')); await mkdir(resolve(folder, 'scripts')); await mkdir(resolve(folder, 'node_modules')); await mkdir(resolve(folder, 'licenses'));
await cp(resolve(root, 'dist'), resolve(folder, 'dist'), { recursive: true });
await cp(resolve(root, 'build'), resolve(folder, 'build'), { recursive: true });
await cp(resolve(root, 'node_modules/ws'), resolve(folder, 'node_modules/ws'), { recursive: true });
await cp(process.execPath, resolve(folder, 'runtime/node')); await chmod(resolve(folder, 'runtime/node'), 0o755);
for (const file of ['start.mjs', 'launch.mjs']) await cp(resolve(root, 'scripts', file), resolve(folder, 'scripts', file));
for (const pkg of ['react', 'react-dom', 'ws']) await cp(resolve(root, 'node_modules', pkg, 'LICENSE'), resolve(folder, 'licenses', `${pkg}.txt`));
const nodeLicense = resolve(dirname(process.execPath), '../LICENSE'); await access(nodeLicense); await cp(nodeLicense, resolve(folder, 'licenses/node.txt'));
const project = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
await writeFile(resolve(folder, 'package.json'), JSON.stringify({ name: project.name, version: project.version, type: 'module', private: true }, null, 2));
let clientId = process.env.TWITCH_CLIENT_ID ?? '';
if (!clientId) { try { clientId = (await readFile(resolve(root, 'data/twitch-client-id.txt'), 'utf8')).trim(); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
if (clientId) { if (!validClientId(clientId)) throw new Error('Publisher Client ID is invalid.'); await writeFile(resolve(folder, 'publisher.json'), JSON.stringify({ twitchClientId: clientId })); }
await writeFile(resolve(folder, 'Start ChatMade.command'), '#!/bin/sh\nset -eu\ncd -- "$(dirname -- "$0")"\nexec ./runtime/node ./scripts/launch.mjs\n', { mode: 0o755 });
await writeFile(resolve(folder, 'START-HERE.md'), `# ChatMade preview\n\nChat builds the monster. The streamer survives it.\n\nThis package targets macOS ${process.arch}. It includes Node.js; no Node/npm installation is needed.\n\n1. Extract the ZIP into a writable folder.\n2. Double-click Start ChatMade.command and keep its Terminal window open while playing. Host controls open in your browser automatically.\n3. Connect Twitch, follow its device-code authorisation and select Live Twitch chat.\n4. Copy the read-only OBS URL from the host desk into an OBS Browser Source (1920 × 1080 suggested).\n5. Start a round. Viewers use !body, !power, !weakness, !vote and !help in existing Twitch chat.\n\n${clientId ? 'Publisher application is preconfigured.' : 'Publisher Client ID is not configured in this preview. Publisher must register a Public Twitch application and enter its public Client ID in the host desk before live chat can connect.'}\n\nSample mode works without Twitch. Original fallback artwork is used; runtime image generation is not implemented. The same artwork is shown for every body suggestion.\n\nClosing Terminal stops the app; a new host key is generated on restart. Twitch tokens stay in server memory and are forgotten at shutdown. Saved results stay in data/. To reopen host controls while running, open data/open-host.html. Do not share that file or data/host-key.txt.\n\nThis preview is not a notarized macOS installer. Check system compatibility and OBS output before using it live. No real Twitch playtest has yet been recorded. Third-party notices are in licenses/.\n`);
await verifyRelease(folder);
await run('ditto', ['-c', '-k', '--sequesterRsrc', '--keepParent', folder, `${folder}.zip`]);
console.log(`Release ZIP: ${folder}.zip\nPublisher configured: ${Boolean(clientId)}\nNo source data directory, host key or Twitch tokens included.`);
