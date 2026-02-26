---
name: meta-api-integration
description: Use when connecting Meta APIs (WhatsApp Business, Instagram Graph, Facebook Marketing), configuring OAuth flows or Embedded Signup, setting up webhooks, troubleshooting authentication errors and rate limits, when OAuth errors appear, when tokens expire unexpectedly, when webhook signatures fail validation, when Instagram content fails to publish, or when Facebook Ads data won't sync.
---

# Meta API Integration Skill

> **Purpose:** Configure and maintain connections to Meta's APIs for WhatsApp Business, Instagram, and Facebook Ads with best practices for OAuth, token management, and webhook handling.
> **Core Principle:** Centralize Meta config in `apps/api/src/_core/meta-config.ts`, validate webhook signatures on every request, and refresh tokens before expiry.

---

## When to Use

### Trigger Symptoms (Use this skill when...)

- Connecting Meta APIs (WhatsApp Business, Instagram, Facebook Ads)
- Implementing OAuth flows, token exchange, or refresh
- Configuring Embedded Signup for WhatsApp
- Setting up webhook endpoints for real-time events
- Debugging authentication errors, rate limits, or API failures
- Syncing Facebook Marketing API data for reporting
- OAuth errors appear (`OAuthException`)
- Tokens expire unexpectedly
- Webhook signatures fail validation
- Instagram content fails to publish
- Facebook Ads data won't sync
- Graph API version upgrade needed

### When NOT to Use

- Generic backend work → use `debugger` backend-debug pack
- Bug investigation → use `debugger` skill
- Planning new integrations → use `planning` skill

---

## Quick Start Checklists

### ✅ WhatsApp Business Platform

1. [ ] Create Meta App at [developers.facebook.com](https://developers.facebook.com)
2. [ ] Add "WhatsApp" product to the app
3. [ ] Configure Embedded Signup (see [embedded-signup-flow.md](references/embedded-signup-flow.md))
4. [ ] Set environment variables (see [env-vars-template.md](references/env-vars-template.md))
5. [ ] Implement OAuth callback handler (see [oauth-flows.md](references/oauth-flows.md))
6. [ ] Configure webhooks (see [webhook-setup.md](references/webhook-setup.md))
7. [ ] Submit for Business Verification (production only)

### ✅ Instagram Graph API

1. [ ] Create Meta App with "Facebook Login" product
2. [ ] Request permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`
3. [ ] Link Facebook Page to Instagram Business/Creator account
4. [ ] Implement OAuth flow with token exchange (see [oauth-flows.md](references/oauth-flows.md))
5. [ ] Set `INSTAGRAM_*` environment variables

### ✅ Facebook Marketing API

1. [ ] Create Meta App at developers.facebook.com
2. [ ] Add "Marketing API" product
3. [ ] Request permissions: `ads_read`, `ads_management`, `business_management`
4. [ ] Complete App Review for Standard Access (non-expiring tokens)
5. [ ] Implement OAuth with long-lived token exchange (see [oauth-flows.md](references/oauth-flows.md))
6. [ ] Set `FACEBOOK_ADS_*` environment variables

---

## Reference Documents

| Document                                                      | Purpose                                               |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| [oauth-flows.md](references/oauth-flows.md)                   | OAuth 2.0 flows, token exchange, refresh patterns     |
| [embedded-signup-flow.md](references/embedded-signup-flow.md) | WhatsApp Embedded Signup implementation               |
| [webhook-setup.md](references/webhook-setup.md)               | Webhook configuration, signature validation, payloads |
| [env-vars-template.md](references/env-vars-template.md)       | Environment variable template with annotations        |
| [troubleshooting.md](references/troubleshooting.md)           | Common errors, debugging tools, solutions             |

---

## Codebase Reference

### Shared Configuration (Single Source of Truth)

All Meta services in NeonDash share `apps/api/src/_core/meta-config.ts`, which provides:

- **Unified Graph API version** (env-driven fallback in code) — change once, applies everywhere
- **`GRAPH_API_BASE`** / **`OAUTH_DIALOG_BASE`** — pre-built URL bases
- **`META_APP_ID`** / **`META_APP_SECRET`** — unified credentials with legacy fallbacks
- **Per-product scopes** — `INSTAGRAM_SCOPES`, `FACEBOOK_ADS_SCOPES`, `WHATSAPP_SCOPES`
- **Shared types** — `MetaTokenResponse`, `MetaLongLivedTokenResponse`
- **Helper functions** — `buildGraphUrl()`, `exchangeCodeForToken()`, `refreshLongLivedToken()`

> ⚠️ Agent rules for Meta services are documented in `apps/api/src/services/AGENTS.md`

### Implementation Files

| File                                                               | Purpose                                                                 |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `apps/api/src/_core/meta-config.ts`                                | **Shared config** — versions, credentials, scopes, helpers              |
| `apps/api/src/services/instagram-service.ts`                       | Instagram OAuth/token lifecycle + metrics sync                          |
| `apps/api/src/services/instagram-publish-service.ts`               | Instagram content publishing                                            |
| `apps/api/src/services/facebook-ads-service.ts`                    | Facebook Ads OAuth/token management/insights                            |
| `apps/api/src/services/meta-api-service.ts`                        | WhatsApp Cloud API service                                              |
| `apps/api/src/meta-api-router.ts`                                  | WhatsApp/Meta tRPC endpoints + Embedded Signup                          |
| `apps/api/src/webhooks/meta-webhook.ts`                            | Meta webhook handler + signature validation                             |
| `apps/api/src/instagram-router.ts`                                 | Instagram tRPC endpoints used by frontend (`saveToken`, sync, publish)  |
| `apps/web/src/hooks/use-facebook-sdk.ts`                           | Facebook JS SDK loader/init (`FB.init`, `FB.login`)                     |
| `apps/web/src/components/instagram/instagram-connection-card.tsx`  | Instagram JS SDK connection UI                                          |
| `apps/web/src/components/dashboard/instagram-onboarding-modal.tsx` | Alternate onboarding flow using JS SDK                                  |
| `apps/api/src/_core/index.ts`                                      | Hono OAuth callback routes (`/api/instagram/callback`, deletion/deauth) |

### Key Patterns in Codebase

```typescript
// OAuth Token Exchange (facebook-ads-service.ts)
exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResponse>

// Embedded Signup Callback (meta-api-router.ts)
configure: protectedProcedure.input(z.object({
  accessToken: z.string(),
  phoneNumberId: z.string(),
  wabaId: z.string(),
})).mutation(...)

// Webhook Signature Validation (webhooks/meta-webhook.ts)
const signature = req.headers['x-hub-signature-256'];
const expectedSignature = `sha256=${crypto.createHmac('sha256', APP_SECRET).update(JSON.stringify(body)).digest('hex')}`;
```

---

## OAuth Scope Reference

| Product       | Required Scopes                                               | Optional Scopes                                          |
| ------------- | ------------------------------------------------------------- | -------------------------------------------------------- |
| **WhatsApp**  | `whatsapp_business_management`, `whatsapp_business_messaging` | `business_management`                                    |
| **Instagram** | `instagram_basic`, `pages_show_list`                          | `instagram_content_publish`, `instagram_manage_comments` |
| **Ads**       | `ads_read`, `business_management`                             | `ads_management`, `read_insights`                        |

---

## Token Lifecycle

| Token Type                   | Validity     | Refresh Method            |
| ---------------------------- | ------------ | ------------------------- |
| Short-lived (Facebook Login) | 1-2 hours    | Exchange for long-lived   |
| Long-lived User Token        | 60 days      | Re-exchange before expiry |
| System User Token            | Non-expiring | Revoke and regenerate     |
| Page Token (from long-lived) | Non-expiring | Tied to user token        |

> ⚠️ **Important:** Marketing API Standard Access tokens (after App Review) don't expire but can be invalidated if password changes or permissions are revoked.

---

## Graph API Version

NeonDash uses an **env-driven** Graph API version (`META_GRAPH_API_VERSION`) with a code fallback.

As of **February 24, 2026**, Meta's Graph API changelog reports **`v25.0`** as the latest version (verify before upgrading; do not hardcode assumptions).

The backend version is centralized in `apps/api/src/_core/meta-config.ts` and reads from the environment:

```typescript
// apps/api/src/_core/meta-config.ts — single source of truth
export const GRAPH_API_VERSION = process.env.META_GRAPH_API_VERSION ?? "v24.0";
```

The frontend JS SDK version is currently set separately in `apps/web/src/hooks/use-facebook-sdk.ts` (default: `v24.0`), which creates **drift risk** if backend and frontend versions diverge.

> ⚠️ When upgrading: update `META_GRAPH_API_VERSION` in `.env`, align the frontend JS SDK version, test all OAuth flows, and verify webhook payloads.

---

## Security Best Practices

1. **Store tokens securely**: Use environment variables or encrypted database fields
2. **Validate webhook signatures**: Always verify `X-Hub-Signature-256` before processing
3. **Use server-side token exchange**: Never expose App Secret in frontend code
4. **Implement token refresh**: Schedule refresh 7 days before expiration
5. **Handle errors gracefully**: Implement exponential backoff for rate limits

---

## Troubleshooting Quick Reference

| Error Code              | Meaning                            | Solution                                                                                                    |
| ----------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `OAuthException` 190    | Invalid/expired token              | Refresh or re-authenticate                                                                                  |
| `OAuthException` 10     | Permission denied                  | Check scope, complete App Review                                                                            |
| HTTP 429                | Rate limit exceeded                | Implement exponential backoff                                                                               |
| HTTP 400                | Invalid request                    | Check payload structure                                                                                     |
| JS SDK Domain Error     | "JSSDK Unknown Host domain"        | Add domain in Meta Dashboard → Facebook Login → Settings → Allowed Domains for the JavaScript SDK           |
| `ERR_BLOCKED_BY_CLIENT` | SDK tracking blocked by ad-blocker | Not a bug — user's browser extension blocking Facebook tracking pixels                                      |
| OAuth redirect mismatch | `redirect_uri` error / HTTP 400    | Compare callback URL sent by app vs Meta dashboard character-by-character (scheme/host/path/trailing slash) |
| HTTPS enforcement       | Login popup fails on HTTP          | Facebook JS SDK auth actions require HTTPS (except limited localhost/dev scenarios)                         |
| Version drift           | Inconsistent SDK/API behavior      | Keep `use-facebook-sdk.ts` version aligned with `META_GRAPH_API_VERSION`                                    |

For detailed troubleshooting, see [troubleshooting.md](references/troubleshooting.md).

---

## NeonDash Instagram Connection Failure Runbook (JS SDK + Hono/tRPC)

Use this runbook before changing code when the Instagram/Meta connection is "implemented but failing".

### 1. Capture exact evidence (frontend + backend)

- Browser console error (full message, error code/type, failing domain)
- Network entries for:
  - `https://connect.facebook.net/.../sdk.js`
  - Facebook popup/login requests
  - tRPC call to `instagram.saveToken`
- Backend logs for `instagram-router` / `instagram-service` (`save_token_failed`, token exchange failures)
- Meta error payload (`error.code`, `error_subcode`, `fbtrace_id`) if present

### 2. Determine which Instagram auth flow is active (critical)

NeonDash currently has **two Instagram auth flows**:

1. **JS SDK flow (frontend-first)**
   `apps/web/src/components/instagram/*` → `use-facebook-sdk.ts` → `trpc.instagram.saveToken`
2. **Server OAuth callback flow (redirect-based)**
   `instagramService.getAuthUrl()` → `/api/instagram/callback` → `mentorados.instagramCallback`

> If debugging a "JavaScript connection failure", prioritize the **JS SDK flow** first. Do not apply redirect-only fixes until you confirm the JS SDK is not the failing path.

### 3. High-probability root causes in NeonDash (ranked)

1. **JSSDK host domain not whitelisted**
   - Symptom: `JSSDK Unknown Host domain`
   - Fix: add all real hosts to "Allowed Domains for JavaScript SDK" and "App Domains":
     - `localhost`
     - staging host
     - production host

2. **HTTPS requirement not met**
   - Symptom: popup/login blocked or silent failure in HTTP environments
   - Meta requires HTTPS for JS SDK auth actions on real domains.

3. **Frontend/backend Graph API version drift**
   - Backend reads `META_GRAPH_API_VERSION`; frontend hook hardcodes `v24.0`.
   - Upgrade one side only → inconsistent behavior.

4. **Redirect URI mismatch (only if redirect flow is used)**
   - Check `INSTAGRAM_REDIRECT_URI` vs Meta "Valid OAuth Redirect URIs".
   - Watch trailing slash and host mismatch (`staging` vs `production`).

5. **Token exchange succeeds but account discovery fails**
   - Frontend currently reads only the **first** page from `/me/accounts`.
   - If the first page has no linked Instagram Business account, UI reports failure even when another page is valid.

### 4. Hardening tasks after root cause is fixed

- Add structured error logging for SDK login, `/me/accounts`, and `saveToken`
- Normalize and reuse a single Instagram auth flow (preferred: choose one flow and deprecate the other)
- Align JS SDK version with backend Graph version via shared env/config
- Validate `saveToken` authorization (ensure user can only connect allowed `mentoradoId`)
- Keep token refresh path tested (`exchangeForLongLivedToken` + `refreshAccessToken`)

### 5. NeonDash-specific env guidance (Vite + Hono)

- **Frontend public vars:** `VITE_*` (for example `VITE_META_APP_ID`)
- **Server secrets:** no `VITE_` prefix (`META_APP_SECRET`, `INSTAGRAM_APP_SECRET`, etc.)
- Never expose App Secret in frontend bundle
- `INSTAGRAM_REDIRECT_URI` is required for redirect-based flow and must match Meta dashboard exactly

---

## External Resources

- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Facebook Marketing API Docs](https://developers.facebook.com/docs/marketing-api)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)

---

## Rationalization Table

| Excuse                                   | Reality                                                          |
| ---------------------------------------- | ---------------------------------------------------------------- |
| "I'll skip signature validation for now" | Without validation, anyone can spoof webhooks. Validate always.  |
| "Token won't expire anytime soon"        | Tokens expire at worst moments. Refresh 7 days before.           |
| "I'll hardcode the API version"          | Hardcoded versions break on deprecation. Use `meta-config.ts`.   |
| "App Secret in frontend is fine for MVP" | App Secret in frontend = compromised. Server-side only.          |
| "Rate limits won't affect us"            | Meta rate limits are aggressive. Implement backoff from day one. |
| "I'll handle errors later"               | Meta errors are cryptic. Handle all error codes upfront.         |
| "One Graph API call is fast enough"      | Sequential calls = slow. Batch requests when possible.           |
| "Webhooks can wait"                      | Real-time events need webhooks. Polling is not a solution.       |

---

## Red Flags — STOP and Fix

| Red Flag                         | Action                                               |
| -------------------------------- | ---------------------------------------------------- |
| No webhook signature validation  | Add `X-Hub-Signature-256` validation. Every request. |
| Token refresh not scheduled      | Add refresh 7 days before expiry.                    |
| App Secret in frontend code      | Move to server-side only. Rotate if exposed.         |
| No rate limit handling           | Add exponential backoff with jitter.                 |
| Hardcoded Graph API version      | Use `META_GRAPH_API_VERSION` env var.                |
| Missing error handling for OAuth | Handle all `OAuthException` codes.                   |
| Sequential API calls             | Batch requests or use parallel calls.                |
| No token storage strategy        | Store encrypted in DB or secure env vars.            |
