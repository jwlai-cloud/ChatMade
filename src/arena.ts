import { SIZE, type State } from '../shared/game';
export function drawArena(ctx: CanvasRenderingContext2D, s: State, creature: HTMLImageElement) {
  const { width: w, height: h } = SIZE;
  ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#16132b'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#27223e'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.strokeStyle = '#6b587e'; ctx.lineWidth = 3; ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.fillStyle = '#8b7caa'; ctx.font = '14px sans-serif'; ctx.fillText('CONTAINMENT AREA  /  01', 30, 40);
  const rescued = s.elapsed < s.rescueUntil;
  if (s.telegraph && !(rescued && s.selected?.weakness === 'stun')) {
    ctx.strokeStyle = '#ffb18c'; ctx.lineWidth = 3; ctx.setLineDash([10, 9]); ctx.beginPath();
    if (s.selected?.attack === 'burst') ctx.arc(s.monster.x, s.monster.y, 95, 0, Math.PI * 2);
    else { ctx.moveTo(s.monster.x, s.monster.y); ctx.lineTo(s.target.x, s.target.y); }
    ctx.stroke(); ctx.setLineDash([]); ctx.beginPath(); ctx.arc(s.target.x, s.target.y, 28, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffb18c'; ctx.font = 'bold 16px sans-serif'; ctx.fillText('INCOMING', Math.min(s.target.x + 35, 820), Math.max(60, s.target.y));
  }
  const soft = rescued && s.selected?.weakness === 'soften';
  for (const p of s.hazards) { ctx.fillStyle = '#ff766e'; ctx.beginPath(); ctx.arc(p.x, p.y, soft ? 5 : 9, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ffe6a1'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = rescued ? '#53e0ec22' : '#c5f45b15'; ctx.beginPath(); ctx.arc(s.monster.x, s.monster.y, soft ? 30 : 48, 0, Math.PI * 2); ctx.fill();
  if (creature.complete && creature.naturalWidth) ctx.drawImage(creature, s.monster.x - (soft ? 45 : 65), s.monster.y - (soft ? 48 : 72), soft ? 90 : 130, soft ? 90 : 130);
  if (rescued) { ctx.strokeStyle = '#53e0ec'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s.monster.x, s.monster.y, 65, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#53e0ec'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('RESCUED!', s.monster.x - 48, s.monster.y - 78); }
  ctx.fillStyle = s.invulnerable > 0 ? '#fff7e8' : '#53e0ec'; ctx.strokeStyle = '#0c182c'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(s.player.x, s.player.y, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#152539'; ctx.fillRect(s.player.x - 6, s.player.y - 5, 4, 5); ctx.fillRect(s.player.x + 3, s.player.y - 5, 4, 5);
  ctx.fillStyle = '#fff7e8'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('YOU', s.player.x, Math.max(20, s.player.y - 24)); ctx.textAlign = 'left';
  if (s.paused) { ctx.fillStyle = '#100b24cc'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#fff7e8'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', w / 2, h / 2); ctx.textAlign = 'left'; }
}
export async function exportResult(s: State, credits: boolean) {
  const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 675; const c = canvas.getContext('2d')!;
  const image = new Image(); image.src = '/creature.svg'; await image.decode();
  c.fillStyle = '#100b24'; c.fillRect(0, 0, 1200, 675); c.fillStyle = '#c5f45b'; c.font = 'bold 26px sans-serif'; c.fillText('CHATMADE  /  LOCAL SIMULATION', 60, 65);
  c.fillStyle = '#fff7e8'; c.font = 'bold 76px sans-serif'; c.fillText(s.outcome ?? 'RESULT', 60, 175);
  c.font = 'bold 42px sans-serif'; c.fillText(s.selected?.name ?? 'Creature', 60, 244); c.drawImage(image, 745, 120, 400, 400);
  c.font = '22px sans-serif'; c.fillStyle = '#b5acc9'; c.fillText(`${s.hearts} hearts left · ${s.rescues} rescues · ${Math.min(60, s.elapsed).toFixed(1)} seconds`, 60, 295);
  let y = 365;
  for (const i of s.selected?.ingredients ?? []) { c.fillStyle = '#fff7e8'; c.fillText(`${i.category.toUpperCase()}  ${i.text.slice(0, 42)}`, 60, y); c.fillStyle = '#b5acc9'; c.font = '18px sans-serif'; if (credits) c.fillText(i.house ? 'House suggestion' : i.name, 60, y + 26); c.font = '22px sans-serif'; y += 70; }
  c.fillStyle = '#b5acc9'; c.font = '16px sans-serif'; c.fillText(`Seed ${s.seed} · ${s.roundId} · Original fallback artwork`, 60, 635);
  const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob(b => b ? ok(b) : fail(new Error('Image export failed.')), 'image/png'));
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `chatmade-${s.roundId}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
