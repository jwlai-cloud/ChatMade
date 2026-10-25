# Public device authorisation for reusable local Twitch connection

Status: Accepted implementation direction, 25 October 2026. The user asked to continue the reusable-streamer requirements and is registering the publisher application; no application credentials or live authorisation have been supplied yet.

Use Twitch's installed-chatbot model with a Public client, device-code authorisation and only `user:read:chat`. The verified authorised user is both the broadcaster and subscription user, so each installation connects its own streamer's channel without embedded channel IDs, a separate bot account or a distributed client secret. This follows the [chat auth guide](https://dev.twitch.tv/docs/chat/authenticating/) and [public device-code documentation](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow), checked today.

The publisher registers ChatMade once and distributes its public Client ID with the app. Streamers authorise through Twitch's own site. Tokens stay in server memory, refresh serially when needed and are validated at connection and hourly. A restart requires another authorisation; OS keychain persistence is deferred rather than saving reusable credentials in plaintext files. Local disconnect forgets tokens; users can revoke the grant in Twitch Connections.

Receive chat through EventSub WebSockets. Preserve subscriptions during a server-requested reconnect; recreate them after an ordinary connection loss. Deduplicate delivery and chat-message IDs across round resets, reject stale and foreign-channel events, and retain no raw-chat archive. A disconnect changes visible chat status while the encounter continues.

Choose sample or Twitch mode before starting a round. Twitch mode requires a connected account and rejects sample controls server-side. Persist mode and channel with the result. Device authorisation instructions are visible only to authenticated host connections; access/refresh/device tokens never appear in browser state.

This implements the transport and onboarding path, not proof of live Twitch compatibility. A real authorisation, three-viewer playtest and reconnect observation are still release gates. Initial downloadable packaging targets macOS Apple Silicon; other platforms and a notarized installer are not yet verified.
