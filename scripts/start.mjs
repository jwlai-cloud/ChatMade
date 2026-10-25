process.env.NODE_ENV = 'production';
await import('../build/server/index.js').then(async ({ createApp }) => {
  const port = Number(process.env.CHATMADE_PORT ?? 4317);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('CHATMADE_PORT must be 0–65535.');
  const app = await createApp({ port, production: true });
  console.log(`ChatMade: ${app.origin}/host\nBroadcast: ${app.origin}/broadcast\nOpen host controls: ${app.hostLauncher}`);
  process.send?.({ type: 'ready', origin: app.origin, hostLauncher: app.hostLauncher });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void app.close().then(() => process.exit(0)); });
}).catch(error => {
  console.error(error.code === 'EADDRINUSE' ? 'ChatMade is already using this port. Close the other instance, or open http://127.0.0.1:4317/host.' : 'ChatMade could not start. Run npm run build for the developer version, then try again.');
  process.exit(1);
});
