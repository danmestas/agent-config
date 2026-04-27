---
name: cloudflare-email
version: 0.1.0
description: >-
  Use when sending outbound transactional or one-off emails from a
  Cloudflare-managed domain without running a mail server or paying for a
  mailbox provider. Triggers on needs to send email programmatically from a
  custom domain, send-from-my-domain requests, or replacing SMTP relays.
  Cloudflare Email Service is REST API + Workers only — no SMTP, so it is NOT
  compatible with Gmail "Send mail as", Outlook, or any SMTP client.
type: skill
targets:
  - claude-code
category:
  primary: integrations
---

# Cloudflare Email Service (Sending)

Send outbound email from a Cloudflare-hosted domain via REST API or Workers binding. Complements Cloudflare Email Routing (inbound-only) to give a domain full send/receive with no mailbox provider.

## When to Use vs Not Use

Use when:
- Sending programmatically (alerts, transactional mail, one-off scripts)
- Domain is already on Cloudflare DNS
- You don't need a human-facing inbox / "Sent" folder

Do NOT use when:
- User wants to send from Gmail, Apple Mail, Thunderbird, or any SMTP client (Cloudflare exposes no SMTP endpoint — use Zoho/Workspace/Fastmail instead)
- User needs IMAP, a Sent folder, or threaded reply UI
- Sending from a domain not on Cloudflare DNS

## Prerequisites

1. **Domain on Cloudflare DNS** — zone active, nameservers delegated.
2. **Email Service enabled** — Dashboard → your domain → **Email** → **Email Service** → enable. This auto-adds MX/SPF/DKIM/DMARC records on a `cf-bounce.<yourdomain>` subdomain for bounce handling and authentication. Do not delete those records.
3. **Account ID** — dashboard sidebar, or `wrangler whoami`.
4. **API Token** — https://dash.cloudflare.com/profile/api-tokens → Create Token → custom token with **Email Sending: Edit** permission scoped to your account. Save as `CF_API_TOKEN`.
5. **Verified sender** — the `from` address must be on a domain where Email Service is enabled. Cloudflare rejects sends from unverified domains.

```bash
export CF_ACCOUNT_ID="your-account-id"
export CF_API_TOKEN="your-api-token"
```

## Send via REST API

```bash
curl -sS "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/email/sending/send" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from":    "you@yourdomain.com",
    "to":      "recipient@example.com",
    "subject": "Subject line",
    "text":    "Plain text body.",
    "html":    "<p>HTML body.</p>"
  }'
```

A `200` with `"success": true` means queued for delivery. A `400` usually means the sender domain isn't verified or Email Service isn't enabled on it.

## Payload Fields

| Field | Required | Notes |
|-------|----------|-------|
| `from` | yes | Must be on a domain with Email Service enabled |
| `to` | yes | Single recipient or array |
| `subject` | yes | |
| `text` | one of text/html required | Plain-text body |
| `html` | one of text/html required | HTML body |
| `cc`, `bcc` | no | Arrays of addresses |
| `reply_to` | no | Where replies go if different from `from` |

## Send from a Markdown File

Common one-off: turn a hand-written markdown draft into a sent email. See `scripts/send-email.sh` in this skill for a working helper. Usage:

```bash
./send-email.sh \
  --from you@yourdomain.com \
  --to   recipient@example.com \
  --subject "Subject line" \
  --body draft.md
```

It strips markdown for the `text` field, renders minimal HTML for the `html` field, and POSTs to the API.

## Send via Workers Binding

When sending from a Worker, use the binding instead of the REST API — lower latency, no token management:

```toml
# wrangler.toml
send_email = [
  { name = "SEND_EMAIL" }
]
```

```js
import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(req, env) {
    const msg = createMimeMessage();
    msg.setSender({ name: "App", addr: "you@yourdomain.com" });
    msg.setRecipient("recipient@example.com");
    msg.setSubject("Hello");
    msg.addMessage({ contentType: "text/plain", data: "Body" });

    await env.SEND_EMAIL.send(new EmailMessage(
      "you@yourdomain.com",
      "recipient@example.com",
      msg.asRaw()
    ));
    return new Response("sent");
  }
}
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Sender domain not verified` | Email Service not enabled on `from` domain | Dashboard → Email → enable Email Service |
| `Authentication error` | Token missing `Email Sending: Edit` | Recreate token with correct permission |
| `Invalid recipient` | Typo or unroutable domain | Verify the `to` address |
| `Missing required parameter` | No `text` and no `html` | Include at least one body field |
| DNS records missing in dashboard | Records manually deleted | Re-enable Email Service to restore |

## Receiving Replies

Cloudflare Email Service handles outbound only. To receive replies:
- Enable **Email Routing** on the same domain (separate product, same dashboard)
- Add a routing rule: `you@yourdomain.com` → forward to a real inbox (Gmail, iCloud, etc.)
- Replies then land in that inbox; you reply from that inbox's UI (which may itself need a Send-as alias to preserve the custom-domain `from`)

## Viewing Sent Mail

Dashboard → your domain → **Email Service** → **Email Sending** → **Activity Log** lists recent sends, destinations, and delivery status. Logs can take up to ~2 minutes to appear.

Only mail sent through Cloudflare (REST API or Workers binding) shows up. Mail that happens to use a `from` address on a Cloudflare-verified domain but is relayed by another service (e.g. Gmail's `smtp.gmail.com` delivering a "Send mail as" alias) bypasses Cloudflare entirely and will NOT appear in the Activity Log — this is a common point of confusion when debugging whether a send actually went through this service.

**Session detail view** exposes the RFC 5322 **Message-ID** (e.g. `<NpkoCxVOvUVmswnF9h9vvVjiZoW9lgivY4xH@yourdomain.com>`). Useful for:
- Matching bounces (bounce reports reference the Message-ID)
- Threading with the recipient's reply in their mail client
- Correlating with external logs if you shipped the payload to your own logger

The Message-ID is *not* returned in the `POST /email/sending/send` HTTP response — you only see it in the dashboard session view or embedded in the delivered email's headers.

## No API to Retrieve Sent Content

Cloudflare exposes no endpoint to list past sends, fetch a message by ID, or retrieve a previously-sent body. The send endpoint's 200 response body does not include a message_id either. If you need an audit trail of what was actually delivered:

- Log the JSON payload yourself before calling the API (disk, database, logging service)
- Or save a copy to an inbox you control via `bcc`

Do not rely on Cloudflare to store or resurface outbound content.

## Limitations

- **No SMTP.** This is the single biggest footgun — users frequently ask to point Gmail Send-as at Cloudflare. It does not work and cannot work. Redirect them to a real mailbox provider if they need SMTP.
- **Per-account rate limits apply.** Check current limits in Cloudflare docs — exceed them and sends queue or reject.
- **Bounces go to `cf-bounce.<domain>`.** Don't delete those DNS records.

## References

- Cloudflare docs: https://developers.cloudflare.com/email-service/
- Get started: https://developers.cloudflare.com/email-service/get-started/send-emails/
- Email Routing (for inbound): https://developers.cloudflare.com/email-routing/
