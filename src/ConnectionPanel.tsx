import { useState } from 'react';
import type { Phase } from '../shared/game';
import type { TwitchView } from '../shared/twitch';

type Props = { connection?: TwitchView; mode: 'sample' | 'twitch'; phase: Phase; enabled: boolean; send: (action: Record<string, unknown>) => void };
export function ConnectionPanel({ connection, mode, phase, enabled, send }: Props) {
  const [clientId, setClientId] = useState(''), [copied, setCopied] = useState('');
  const broadcastUrl = `${location.origin}/broadcast`;
  const canConnect = enabled && ['LOBBY', 'RESULT'].includes(phase);
  return <section className="connection-panel" aria-label="Streamer setup">
    <div className="setup-step"><div className="eyebrow">01 / TWITCH CONNECTION</div><h3>Your channel. Your community.</h3><p role="status">{connection?.message ?? 'Checking Twitch setup…'}</p>
      <div className="connection-actions">
        {connection?.status !== 'unconfigured' && !['connected', 'authorizing', 'connecting', 'reconnecting'].includes(connection?.status ?? '') && <button disabled={!canConnect} onClick={() => send({ type: 'twitch-connect' })}>Connect Twitch ↗</button>}
        {['connected', 'authorizing', 'connecting', 'reconnecting'].includes(connection?.status ?? '') && <button disabled={!enabled} onClick={() => send({ type: 'twitch-disconnect' })}>{connection?.status === 'authorizing' ? 'Cancel authorisation' : 'Disconnect Twitch'}</button>}
        {connection?.channel && <span className="pill">{connection.status.toUpperCase()} · {connection.channel}</span>}
      </div>
      {connection?.authorization && <div className="device-auth"><p>Enter this code on Twitch:</p><strong>{connection.authorization.userCode}</strong><a href={connection.authorization.verificationUri} target="_blank" rel="noreferrer">Authorise on Twitch ↗</a><p>ChatMade requests read-only chat access. Tokens stay on this computer and are forgotten when the app closes.</p></div>}
      {!canConnect && !['connected', 'authorizing', 'connecting', 'reconnecting'].includes(connection?.status ?? '') && <p>Finish or abort the current round before connecting an account.</p>}
      {['unconfigured', 'disconnected', 'error'].includes(connection?.status ?? '') && <details open={connection?.status === 'unconfigured'}><summary>Publisher setup · once per ChatMade installation</summary><p>Use ChatMade’s registered Public client ID. Streamers use the Connect button; no client secret is needed.</p><form onSubmit={e => { e.preventDefault(); send({ type: 'twitch-configure', clientId: clientId.trim() }); }}><label>Public Twitch Client ID<input value={clientId} onChange={e => setClientId(e.target.value)} autoComplete="off" maxLength={64} required /></label><button disabled={!enabled || phase !== 'LOBBY'}>Save Client ID</button></form></details>}
    </div>
    <div className="setup-step"><div className="eyebrow">02 / STREAM OUTPUT</div><h3>Put the experiment on stream.</h3><p>Add an OBS Browser Source using this address. Keep host controls in a separate window.</p><label>Read-only broadcast URL<input readOnly value={broadcastUrl}/></label><button onClick={() => void navigator.clipboard.writeText(broadcastUrl).then(() => setCopied('Broadcast URL copied.')).catch(() => setCopied('Select and copy the address above.'))}>Copy OBS URL</button><span role="status">{copied}</span><p>Suggested OBS source size: 1920 × 1080. Viewers participate in your existing Twitch chat.</p>
      <label>Round input<select disabled={!enabled || phase !== 'LOBBY'} value={mode} onChange={e => send({ type: 'mode', mode: e.target.value })}><option value="sample">Sample mode · simulated viewers</option><option value="twitch">Live Twitch chat</option></select></label>
    </div>
  </section>;
}
