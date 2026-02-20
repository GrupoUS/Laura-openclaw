# WhatsApp Configuration Guidelines

## Number Selection
- **Crucial Rule**: Avoid Twilio! Meta will block high-volume chat traffic acting as an AI assistant on a Twilio Business number due to their strict 24-hour reply window.
- **Recommendation**: Procure a REAL mobile number (eSIM from a local carrier). Avoid TextNow, Google Voice, or free VoIP services entirely.
- **Fallback**: Personal number (`selfChatMode: true`). Messages sent to yourself will enable the assistant, but do not spam friends.

## Configuration Policy
In `openclaw.json`:
- `dmPolicy` controls who can talk to the agent:
  - `"pairing"`: Default. Unknown senders get a pairing code. Approve via `openclaw pairing approve whatsapp <code>`.
  - `"allowlist"`: Direct approval list (E.164 numbers).
  - `"open"`: Allows everyone, generally highly discouraged for a personal assistant.

## Read Receipts and Reactions
- Set `sendReadReceipts: true` (default) to get blue ticks.
- Use `ackReaction` for immediate feedback before the LLM processes the message:
```json
{
  "whatsapp": {
    "ackReaction": {
      "emoji": "👀",
      "direct": true,
      "group": "mentions"
    }
  }
}
```

## Logging In
Run `openclaw channels login` to get the QR code. You must rescan if credentials corrupt.
