# Twitch integration

Status, 25 October 2026: implemented and mock-tested; real authorisation and a live-viewer playtest remain pending publisher registration. Do not present the mock tests as live Twitch evidence.

## Official sources

The user supplied the [Example Chatbot Guide](https://dev.twitch.tv/docs/chat/chatbot-guide/). Current implementation also follows the [installed-chatbot authentication guide](https://dev.twitch.tv/docs/chat/authenticating/), [public device-code flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#device-code-grant-flow), [token validation requirements](https://dev.twitch.tv/docs/authentication/validate-tokens/), [refresh-token rules](https://dev.twitch.tv/docs/authentication/refresh-tokens/) and [EventSub WebSocket lifecycle](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/). These were checked on 25 October 2026.

## Implemented path

- Publisher registers one Public client for ChatMade. Its public Client ID can be saved in the host desk or configured through `TWITCH_CLIENT_ID`; packaged copies can include that ID. Each streamer authorises their own account without source edits or a distributed client secret.
- Host starts device authorisation. The backend requests only `user:read:chat`; host sees Twitch's human code and official activation link. Private device/access/refresh tokens never reach either browser view.
- Validate client ID, scope and account identity before subscribing. The verified account supplies both broadcaster and user IDs for `channel.chat.message`. There is no hardcoded channel or separate bot account.
- Handle `authorization_pending`, slower polling, denial, expiry and cancellation. Ignore stale async responses after disconnect. Keep tokens in memory only, validate hourly, and serialise refresh so a single-use public refresh token is not spent twice.
- Subscribe after welcome. Keepalive timeout and socket failures cause bounded-backoff fresh connections and resubscription. A Twitch-requested handoff connects to its exact validated Twitch URL, waits for the new welcome, then closes the old socket without recreating subscriptions.
- Deduplicate delivery and chat-message IDs for ten minutes, including across round resets. Filter stale, unrelated-channel and relayed shared-chat messages. Ignore ordinary chat; contain invalid phase/command errors without crashing the socket. No raw-chat archive or logging.
- Broadcast connection/channel status while withholding host-only authorisation instructions. A live round cannot start disconnected. Samples are rejected during live mode. A disconnect does not pause or reset gameplay; a revoked grant requires reauthorisation before a new live round.
- Save the actual round mode and channel with selected contributions and outcome. Do not infer mode from whether a browser happens to be connected.

Local disconnect forgets tokens. It does not revoke the publisher's application grant; users can do that in Twitch Connections. Restart requires reauthorisation. OS keychain persistence is deferred.

## Evidence

`tests/twitch.test.ts` checks device polling, denial, missing scope, client mismatch, cancellation, token privacy, identity-based subscriptions, deduplication, channel/staleness filtering, official reconnect handoff, timeout resubscription, public-token rotation, hourly validation and revocation.

`tests/server.test.ts` includes a mocked EventSub-to-live-round test: host authorises, live mode requires a connection, a real-adapter notification enters moderation, votes select a recipe, three unique help commands trigger rescue, samples are blocked, disconnect preserves gameplay, and a saved record retains live mode/channel without tokens. This uses a simulated Twitch service, not actual viewers.

## Required live checks

- [ ] Register the Public publisher application and configure Client ID.
- [ ] Authorise a real broadcaster account and confirm the displayed channel.
- [ ] Three real viewers submit suggestions, vote and activate rescue.
- [ ] Complete three rounds, including pause/resume and original-art fallback.
- [ ] Observe reconnect after a real network interruption; show unavailable chat state and no duplicate actions.
- [ ] Test another streamer without editing source or entering developer credentials.
- [ ] Record the Twitch interaction for the under-three-minute submission video.

Browser automation and PNG verification remain blocked by the earlier browser approval-review usage limit. Do not bypass the block using alternate browser surfaces or indirect execution.
