import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ATTACKS, WEAKNESSES, PARTICIPANTS, SIZE, type State } from '../shared/game';
import { drawArena, exportResult } from './arena';
import './style.css';

const isHost = location.pathname !== '/broadcast';
const phases = ['COLLECT', 'SELECT', 'GENERATE', 'REVEAL', 'PLAY', 'RESULT'];
const phaseNames: Record<string, string> = { LOBBY: 'The lab is yours', COLLECT: 'A little chaos, please.', SELECT: 'Pick your problem.', GENERATE: 'Something is stirring.', REVEAL: 'Meet your masterpiece.', PLAY: 'Try to stay in one piece.', RESULT: 'That was a team effort.' };
function App() {
  const [state, setState] = useState<State | null>(null), [connected, setConnected] = useState(false), [authenticated, setAuthenticated] = useState(false);
  const [key, setKey] = useState(''), [message, setMessage] = useState(''), [sampleUser, setSampleUser] = useState(PARTICIPANTS[0].id), [command, setCommand] = useState('!body Jelly knight');
  const [reason, setReason] = useState(''), [credits, setCredits] = useState(true), [seed, setSeed] = useState(42), [threshold, setThreshold] = useState(3), [focused, setFocused] = useState(false);
  const ws = useRef<WebSocket | null>(null), hostKey = useRef(''), canvas = useRef<HTMLCanvasElement | null>(null), current = useRef(state);
  const send = (action: Record<string, unknown>) => { if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(action)); else setMessage('Server disconnected. Reconnecting…'); };
  current.current = state;
  useEffect(() => {
    let stopped = false, retry: ReturnType<typeof setTimeout>;
    function connect() {
      const socket = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`); ws.current = socket;
      socket.onopen = () => { setConnected(true); if (isHost && hostKey.current) socket.send(JSON.stringify({ type: 'auth', token: hostKey.current })); };
      socket.onmessage = e => { const data = JSON.parse(e.data); if (data.type === 'state') setState(data.state); else if (data.type === 'authenticated') { setAuthenticated(true); setKey(''); setMessage('Host controls unlocked.'); } else if (data.type === 'error' || data.type === 'ack') setMessage(data.message); };
      socket.onclose = () => { setConnected(false); setAuthenticated(false); if (!stopped) retry = setTimeout(connect, 1500); }; socket.onerror = () => socket.close();
    }
    connect(); return () => { stopped = true; clearTimeout(retry); ws.current?.close(); };
  }, []);
  useEffect(() => {
    if (state?.phase !== 'PLAY') return;
    const image = new Image(); image.src = '/creature.svg'; let frame = 0;
    function draw() { const c = canvas.current?.getContext('2d'); if (c && current.current) drawArena(c, current.current, image); frame = requestAnimationFrame(draw); }
    draw(); return () => cancelAnimationFrame(frame);
  }, [state?.phase]);
  useEffect(() => {
    if (!authenticated || state?.phase !== 'PLAY' || state.paused) return;
    const el = canvas.current; if (!el) return;
    const held = new Set<string>(); const keys = ['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'];
    const move = () => send({ type: 'move', x: Number(held.has('d') || held.has('arrowright')) - Number(held.has('a') || held.has('arrowleft')), y: Number(held.has('s') || held.has('arrowdown')) - Number(held.has('w') || held.has('arrowup')) });
    const down = (e: KeyboardEvent) => { if (keys.includes(e.key.toLowerCase())) { e.preventDefault(); held.add(e.key.toLowerCase()); move(); } };
    const up = (e: KeyboardEvent) => { held.delete(e.key.toLowerCase()); if (keys.includes(e.key.toLowerCase())) { e.preventDefault(); move(); } };
    const blur = () => { held.clear(); move(); setFocused(false); };
    el.addEventListener('keydown', down); el.addEventListener('keyup', up); el.addEventListener('blur', blur); window.addEventListener('blur', blur);
    const timer = setInterval(() => { if (held.size) move(); }, 100);
    return () => { clearInterval(timer); el.removeEventListener('keydown', down); el.removeEventListener('keyup', up); el.removeEventListener('blur', blur); window.removeEventListener('blur', blur); send({ type: 'move', x: 0, y: 0 }); };
  }, [authenticated, state?.phase, state?.paused]);
  const action = (type: string) => send({ type });
  if (!state) return <main className="loading"><span className="brand">chatmade<span>✳</span></span><h1>Opening the lab…</h1><p>{connected ? 'Receiving round state.' : 'Connecting to local server.'}</p></main>;
  const s = state, phase = s.phase, active = s.selected, canControl = isHost && authenticated && connected;
  const count = (id: number) => authenticated ? Object.values(s.votes).filter(v => v === id).length : s.votes[String(id)] ?? 0;
  const commandLabel = phase === 'COLLECT' ? '!body · !power · !weakness' : phase === 'SELECT' ? s.remaining > 0 ? '!vote 1 / 2 / 3' : 'Voting closed · host approval next' : phase === 'PLAY' ? '!help' : 'Dream up the next creature';
  return <main className={isHost ? 'app host' : 'app broadcast'}>
    <header className="topbar"><a className="brand" href={isHost ? '/host' : '/broadcast'}>chatmade<span>✳</span></a><span className="tagline">CHAT BUILDS THE MONSTER. STREAMER SURVIVES IT.</span><div className="status"><span className={connected ? 'dot' : 'dot offline'} />{connected ? 'LOCAL SIMULATION' : 'DISCONNECTED'}</div>{isHost && <a className="text-link" href="/broadcast" target="_blank" rel="noreferrer">Broadcast ↗</a>}</header>
    <section className="round-top"><div><div className="eyebrow">CREATURE LAB / SEED {s.seed.toString().padStart(6, '0')}</div><h1>{phaseNames[phase]}</h1></div><div className="phase-counter"><span>{s.paused ? 'PAUSED' : phase === 'SELECT' && !s.remaining ? 'AWAITING HOST' : phase}</span><strong>{s.remaining > 0 ? `${Math.ceil(s.remaining).toString().padStart(2, '0')}s` : '✳'}</strong></div></section>
    <nav className="steps" aria-label="Round progress">{phases.map((p, i) => <div key={p} className={phase === p ? 'step active' : 'step'}><span>{String(i + 1).padStart(2, '0')}</span>{({ COLLECT: 'Invent', SELECT: 'Vote', GENERATE: 'Incubate', REVEAL: 'Meet', PLAY: 'Survive', RESULT: 'Celebrate' } as Record<string, string>)[p]}</div>)}</nav>
    {s.notice.startsWith('Host rejected') || s.notice.startsWith('Paused after') ? <p className="round-notice" role="status">{s.notice}</p> : null}
    <div className="stage-layout"><section className={`stage phase-${phase.toLowerCase()}`} aria-label="Round stage">
      <div className="stage-label"><span>✳ EXPERIMENT {s.seed.toString().padStart(3, '0')}</span><span>{phase === 'PLAY' ? 'LIVE ENCOUNTER' : 'HANDLE WITH CURIOSITY'}</span></div>
      {phase === 'PLAY' ? <><div className="arena-hud"><span aria-label={`${s.hearts} hearts remaining`}>{'♥'.repeat(s.hearts)}<span className="empty-hearts">{'♡'.repeat(3 - s.hearts)}</span></span><span>{s.paused ? 'PAUSED' : `${Math.ceil(s.remaining)} SECONDS TO SURVIVE`}</span></div><canvas ref={canvas} width={SIZE.width} height={SIZE.height} tabIndex={canControl ? 0 : -1} onFocus={() => setFocused(true)} aria-label="Survival arena. Focus here and use WASD or arrow keys to dodge." /><div className="arena-hint">{isHost ? focused ? 'WASD / ARROWS TO MOVE · KEEP DODGING' : 'CLICK ARENA OR TAB HERE TO MOVE · WASD / ARROWS' : 'STREAMER DODGES · CHAT RESCUES'}</div></>
      : phase === 'SELECT' ? <div className="recipes">{s.recipes.map(r => <article key={r.id} className={`recipe ${s.winner === r.id ? 'winner' : ''}`}><div className="recipe-number">0{r.id + 1}<span>{count(r.id)} votes</span></div><img src="/creature.svg" alt="Original fallback jelly knight" /><h2>{r.name}</h2>{r.ingredients.map(i => <p key={i.category}><b>{i.category}</b>{i.text}<small>{i.house ? 'HOUSE' : i.name}</small></p>)}<div className="mapping">{ATTACKS[r.attack]}<br />{WEAKNESSES[r.weakness]}</div>{s.winner === r.id && <span className="winner-label">SELECTED · AWAITING APPROVAL</span>}</article>)}</div>
      : <div className="specimen-scene"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="specimen-meta"><span>SPECIMEN / {active ? 'APPROVED' : 'NOT QUITE ALIVE'}</span><span>THREAT LEVEL<br /><b>ADORABLY CONCERNING</b></span></div><img className={`creature ${phase === 'GENERATE' ? 'silhouette' : ''}`} src="/creature.svg" alt="A lime jelly knight with a lavender helmet, huge eyes and a mischievous smile" /><div className="platform"/><div className="specimen-title">{phase === 'RESULT' ? <><div className={`outcome ${s.outcome === 'CAUGHT' ? 'caught' : ''}`}>{s.outcome}</div><h2>{active?.name}</h2><p>{s.notice}</p></> : <><span className="pill">{phase === 'GENERATE' ? 'PREPARING FALLBACK · NO AI REQUEST' : 'ORIGINAL FALLBACK ART'}</span><h2>{active?.name ?? 'A very bad good idea.'}</h2><p>{phase === 'COLLECT' ? 'Give it a body. A power. One ridiculous weakness.' : phase === 'REVEAL' ? 'Crafted by chat. Cleared for chaos.' : 'Part imagination. Part monster. Entirely your fault.'}</p></>}</div></div>}
      {s.paused && phase !== 'PLAY' && <div className="pause-cover">PAUSED</div>}
    </section><aside className="dossier"><div className="eyebrow">FIELD NOTES <span>↗</span></div><h2>{active ? 'Know your monster.' : 'The recipe for trouble.'}</h2><p className="muted">{active ? 'These are the actual mechanics. Plan accordingly.' : 'Three ingredients. Unlimited questionable judgement.'}</p>
      {(active?.ingredients ?? [{ category: 'body', text: 'What does it look like?', name: 'Try: jelly knight' }, { category: 'power', text: 'How does it cause chaos?', name: 'Try: bouncing boots' }, { category: 'weakness', text: 'What makes it panic?', name: 'Try: rubber ducks' }]).map((i, n) => <div className="ingredient" key={i.category}><span className={`ingredient-icon icon-${n}`}>{['◈', 'ϟ', '◎'][n]}</span><div><label>{i.category}</label><strong>{i.text}</strong><small>{'house' in i && i.house ? 'HOUSE SUGGESTION' : i.name}</small></div></div>)}
      {active && <div className="mechanics"><b>IN THE ARENA</b><p>{ATTACKS[active.attack]}</p><p>{WEAKNESSES[active.weakness]}</p></div>}
      <div className="rescue-card"><span className="eyebrow">CHAT HAS YOUR BACK</span><h3>{phase === 'PLAY' && s.elapsed < s.rescueUntil ? 'Rescue activated!' : 'Build it. Then save them.'}</h3><div className="meter"><div style={{ width: `${Math.min(100, Object.keys(s.help).length / s.threshold * 100)}%` }}/></div><p>{phase === 'PLAY' && s.elapsed < s.cooldownUntil ? `Cooling down · ${Math.ceil(s.cooldownUntil - s.elapsed)}s` : `${Object.keys(s.help).length} / ${s.threshold} viewers · !help within 15s`}</p></div>
      {phase === 'RESULT' && <p className="save-status">{s.hearts} hearts · {s.rescues} rescues<br />{s.saveStatus}</p>}
    </aside></div>
    <section className="instruction-band"><div className="camera-space">YOUR CAMERA HERE<span>OBS SAFE SPACE</span></div><div><span className="eyebrow">{phase === 'PLAY' ? 'VIEWERS · TRIGGER THE WEAKNESS' : 'VIEWERS · JOIN THE EXPERIMENT'}</span><strong>{commandLabel}</strong><p>{phase === 'PLAY' ? `${s.threshold} different viewers. One collective rescue. You’ve got this.` : phase === 'COLLECT' ? 'One idea per category. Your latest idea counts.' : 'Local sample mode · no Twitch connection · no generated imagery'}</p></div><span className="band-star">✳</span></section>
    {phase === 'COLLECT' && s.suggestions.some(x => x.approved) && <section className="approved-strip" aria-label="Approved suggestions">{s.suggestions.filter(x => x.approved).slice(-6).map(x => <span key={x.id}><b>{x.name}</b> {x.text}</span>)}</section>}
    {isHost && <section className="controller"><div className="controller-heading"><div><div className="eyebrow">HOST DESK · NOT SHOWN ON BROADCAST</div><h2>Behind the chaos.</h2></div><span className="pill">{authenticated ? 'UNLOCKED' : 'LOCKED'}</span></div>
      {!authenticated ? <form className="unlock" onSubmit={e => { e.preventDefault(); hostKey.current = key.trim(); send({ type: 'auth', token: hostKey.current }); }}><label>Local host key<input type="password" autoComplete="off" value={key} onChange={e => setKey(e.target.value)} placeholder="Paste key from data/host-key.txt" required /></label><button disabled={!connected}>Unlock controls</button><p>Key stays in memory. Read-only broadcast needs no key.</p></form> : <>
      <div className="controls"><fieldset disabled={!canControl}>
        {phase === 'LOBBY' && <><label>Seed<input type="number" min="1" max="999999" value={seed} onChange={e => setSeed(Number(e.target.value))}/></label><label>Rescue threshold<select value={threshold} onChange={e => setThreshold(Number(e.target.value))}><option value={3}>3 viewers</option><option value={1}>1 viewer</option></select></label><button onClick={() => send({ type: 'settings', seed, threshold })}>Apply settings</button><button className="primary" onClick={() => action('start')}>Start experiment ↗</button></>}
        {phase === 'COLLECT' && <><button onClick={() => action('seed-samples')}>Load sample ideas</button><button onClick={() => action('extend')}>+15 seconds</button><button className="primary" onClick={() => action('assemble')}>Build recipes →</button></>}
        {phase === 'SELECT' && <>{s.remaining > 0 ? <button className="primary" onClick={() => action('close-vote')}>Close voting</button> : <button className="primary" onClick={() => action('approve')}>Approve selected recipe →</button>}<label>Rejection reason<input maxLength={100} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain to viewers"/></label><button disabled={!reason.trim()} onClick={() => send({ type: 'reject', reason })}>Reject & reopen</button></>}
        {phase === 'GENERATE' && <button onClick={() => action('fallback')}>Reveal fallback now</button>}
        {phase === 'REVEAL' && <button className="primary" onClick={() => action('play')}>Enter arena →</button>}
        {phase === 'RESULT' && <><label className="check"><input type="checkbox" checked={credits} onChange={e => setCredits(e.target.checked)}/>Include contributor names</label><button className="primary" onClick={() => void exportResult(s, credits).catch(e => setMessage(e.message))}>Export result PNG ↓</button></>}
        {!['LOBBY', 'RESULT'].includes(phase) && <button onClick={() => action('pause')}>{s.paused ? 'Resume' : 'Pause'}</button>}
        {phase !== 'LOBBY' && <button className="secondary" onClick={() => action('restart')}>{phase === 'RESULT' ? 'Next experiment' : 'Abort to lobby'}</button>}
      </fieldset></div>
      {['COLLECT', 'SELECT', 'PLAY'].includes(phase) && <form className="sample-form" onSubmit={e => { e.preventDefault(); send({ type: 'sample', user: sampleUser, command, eventId: crypto.randomUUID() }); }}><label>Simulated participant<select value={sampleUser} onChange={e => setSampleUser(e.target.value)}>{PARTICIPANTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Sample command<input value={command} maxLength={100} onChange={e => setCommand(e.target.value)} placeholder={phase === 'PLAY' ? '!help' : phase === 'SELECT' ? '!vote 1' : '!body Jelly knight'}/></label><button disabled={!canControl || s.paused}>Send sample</button><span>No real messages sent.</span></form>}
      {phase === 'COLLECT' && <div className="moderation"><h3>Review queue <span>{s.suggestions.length}</span></h3><p>Only approved ideas appear on broadcast. Replaced ideas need approval again.</p>{!s.suggestions.length && <p className="empty-queue">No ideas yet. Load samples or enter a command above.</p>}<div className="queue">{s.suggestions.map(x => <div className="queue-row" key={x.id}><span className="pill">{x.category}</span><div><b>{x.text}</b><small>{x.name}</small></div><button disabled={!canControl || s.paused} onClick={() => send({ type: 'moderate', id: x.id, approved: !x.approved })}>{x.approved ? 'Approved ✓ · undo' : 'Approve'}</button></div>)}</div></div>}
      </>}
      <p className="feedback" role="status">{message || 'Ready when you are.'}</p>
    </section>}
    <footer><span>CHATMADE / A COLLECTIVE BAD IDEA</span><span>LOCAL SAMPLE BUILD · ORIGINAL FALLBACK ART</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
