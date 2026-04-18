#!/usr/bin/env bash
# Send an email via Cloudflare Email Service REST API.
# Requires: CF_ACCOUNT_ID and CF_API_TOKEN environment variables.
#
# Usage:
#   ./send-email.sh --from you@domain.com --to dest@example.com \
#                   --subject "Hi" --body draft.md
#
# The --body file is treated as plain text for the "text" field and wrapped in
# minimal <pre> for the "html" field. For richer HTML, pass --html-body instead.

set -euo pipefail

FROM=""
TO=""
CC=""
BCC=""
REPLY_TO=""
SUBJECT=""
BODY_FILE=""
HTML_BODY_FILE=""

usage() {
  sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from)       FROM="$2"; shift 2 ;;
    --to)         TO="$2"; shift 2 ;;
    --cc)         CC="$2"; shift 2 ;;
    --bcc)        BCC="$2"; shift 2 ;;
    --reply-to)   REPLY_TO="$2"; shift 2 ;;
    --subject)    SUBJECT="$2"; shift 2 ;;
    --body)       BODY_FILE="$2"; shift 2 ;;
    --html-body)  HTML_BODY_FILE="$2"; shift 2 ;;
    -h|--help)    usage ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

: "${CF_ACCOUNT_ID:?Set CF_ACCOUNT_ID}"
: "${CF_API_TOKEN:?Set CF_API_TOKEN}"
[[ -n "$FROM"    ]] || { echo "--from required" >&2; exit 1; }
[[ -n "$TO"      ]] || { echo "--to required" >&2; exit 1; }
[[ -n "$SUBJECT" ]] || { echo "--subject required" >&2; exit 1; }
[[ -n "$BODY_FILE" || -n "$HTML_BODY_FILE" ]] || { echo "--body or --html-body required" >&2; exit 1; }

TEXT_BODY=""
HTML_BODY=""
if [[ -n "$BODY_FILE" ]]; then
  TEXT_BODY="$(cat "$BODY_FILE")"
  if [[ -z "$HTML_BODY_FILE" ]]; then
    HTML_BODY="<pre style=\"font-family:inherit;white-space:pre-wrap\">$(python3 -c 'import html,sys; print(html.escape(sys.stdin.read()))' < "$BODY_FILE")</pre>"
  fi
fi
if [[ -n "$HTML_BODY_FILE" ]]; then
  HTML_BODY="$(cat "$HTML_BODY_FILE")"
fi

export FROM TO SUBJECT TEXT_BODY HTML_BODY CC BCC REPLY_TO

PAYLOAD="$(python3 - <<'PY'
import json, os
payload = {
    "from": os.environ["FROM"],
    "to":   os.environ["TO"],
    "subject": os.environ["SUBJECT"],
}
if os.environ.get("TEXT_BODY"): payload["text"] = os.environ["TEXT_BODY"]
if os.environ.get("HTML_BODY"): payload["html"] = os.environ["HTML_BODY"]
if os.environ.get("CC"):        payload["cc"]   = [s.strip() for s in os.environ["CC"].split(",")]
if os.environ.get("BCC"):       payload["bcc"]  = [s.strip() for s in os.environ["BCC"].split(",")]
if os.environ.get("REPLY_TO"):  payload["reply_to"] = os.environ["REPLY_TO"]
print(json.dumps(payload))
PY
)"

curl -sS -w "\nHTTP %{http_code}\n" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/email/sending/send" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"
