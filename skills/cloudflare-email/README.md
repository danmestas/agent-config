# cloudflare-email

Send outbound email from a Cloudflare-hosted domain without running a mail server or paying for a mailbox provider.

Uses the **Cloudflare Email Service** (REST API + Workers binding). Not SMTP — see [Limitations](#limitations) before planning to use this with Gmail Send-as or any IMAP/SMTP client.

## What this skill provides

- [`SKILL.md`](./SKILL.md) — agent instructions: prerequisites, REST API payload reference, Workers binding example, common errors, and reply handling
- [`scripts/send-email.sh`](./scripts/send-email.sh) — bash helper that takes a markdown draft and posts it as the email body

## Quick start

```bash
export CF_ACCOUNT_ID="your-account-id"
export CF_API_TOKEN="your-api-token"   # needs Email Sending: Edit permission

# Send a one-off email from a markdown file
./scripts/send-email.sh \
  --from    you@yourdomain.com \
  --to      recipient@example.com \
  --subject "Subject line" \
  --body    draft.md
```

Prerequisites (one-time):

1. Domain on Cloudflare DNS
2. Cloudflare Dashboard → your domain → **Email** → enable **Email Service** (auto-adds MX/SPF/DKIM/DMARC records)
3. Create an API token at https://dash.cloudflare.com/profile/api-tokens with **Email Sending: Edit** scope

Full details in [SKILL.md](./SKILL.md).

## Use cases

- Transactional email from a server-side app (confirmations, alerts)
- One-off outreach emails scripted from the terminal (e.g. vendor access requests)
- Workers that send notifications without a third-party email SDK
- Replacing paid SMTP relays for low-volume custom-domain sending

## Viewing sent mail

The Cloudflare dashboard has an **Activity Log** under Email Service → Email Sending showing recent sends and their status. Mail sent through a different route (e.g. Gmail's `smtp.gmail.com` with a Send-as alias) does **not** appear there, even if the `from` address is on a Cloudflare-verified domain — only direct sends via this API or a Worker do.

Clicking a row opens the session detail, which exposes the RFC 5322 Message-ID (e.g. `<NpkoCxVOvUVmswnF9h9vvVjiZoW9lgivY4xH@yourdomain.com>`) — useful for matching bounces or correlating with the recipient's mail client. The Message-ID is *not* returned in the HTTP 200 response body.

## Limitations

- **No SMTP endpoint.** Gmail "Send mail as", Apple Mail, Outlook, Thunderbird, and any IMAP/SMTP client cannot use Cloudflare. If you need a human inbox UI with your custom domain, use Zoho Mail (free tier), Google Workspace, Fastmail, or similar.
- **No API to retrieve sent content.** There's no list-sends, get-by-id, or body-fetch endpoint — only `POST /send`. The Activity Log is metadata only. If you need an audit trail, log the payload client-side before sending or `bcc` yourself.
- **Domain must be on Cloudflare DNS.** If your nameservers point elsewhere, Email Service is unavailable.
- **Bounces go to `cf-bounce.<yourdomain>`.** Don't delete those auto-added DNS records.

## Receiving replies

Cloudflare Email Service handles outbound only. To receive replies on the same address:

1. Enable **Email Routing** on the same domain (separate product, same Email dashboard)
2. Add a route: `you@yourdomain.com` → forward to a real inbox (Gmail, iCloud, etc.)

Replies land in that inbox. Composing replies from that inbox UI as `you@yourdomain.com` is a separate problem (needs a Send-as alias backed by a real SMTP provider).

## References

- Cloudflare Email Service docs: https://developers.cloudflare.com/email-service/
- Send Emails guide: https://developers.cloudflare.com/email-service/get-started/send-emails/
- Email Routing (inbound): https://developers.cloudflare.com/email-routing/
