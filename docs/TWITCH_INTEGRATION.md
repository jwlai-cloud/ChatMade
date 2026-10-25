# Twitch integration follow-up

The user supplied the official [Example Chatbot Guide](https://dev.twitch.tv/docs/chat/chatbot-guide/), read on 24 October 2026. It demonstrates local EventSub WebSocket chat reception, token validation and subscription creation after `session_welcome`; the example also sends replies. ChatMade's first milestone does not connect to Twitch or send messages.

Use this guide as a starting point, not a production-ready reconnect implementation. Before milestone 2, verify the current [chat authentication requirements](https://dev.twitch.tv/docs/chat/authenticating/) and [EventSub WebSocket handling](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/). Request only scopes required by the chosen read-only chat flow; do not copy reply permissions just because the example replies.

Planned adapter responsibilities:

- Validate the selected broadcaster's identity, client ID, token scopes and expiry server-side. No credentials in browser state or logs.
- Subscribe to `channel.chat.message` using the welcome session ID. Map stable chatter IDs and display names to the existing input boundary.
- Deduplicate delivery IDs before applying an input. Handle invalid commands without crashing the connection.
- Handle welcome, keepalive timeout, reconnect instructions and revocation. Reconnection must not duplicate subscriptions or reset an encounter.
- Publish connecting/connected/reconnecting/revoked status. Keep simulation clearly separate from real chat.
- Moderate suggestions before broadcast and generation. Do not retain raw chat by default.

Not yet implemented or verified: OAuth setup, a real subscription, reconnect against Twitch, three-viewer playtest and live delivery timing. No Twitch credentials are present in this project.
