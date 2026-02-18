---
name: apple-contacts
description: Search, list, create, update, and delete Apple Contacts via the `contactbook` CLI on macOS. Look up contacts by name, phone, email, or organization. Manage contact groups.
homepage: https://github.com/RyanLisse/Contactbook
metadata: {"clawdbot":{"emoji":"📇","os":["darwin"],"requires":{"bins":["contactbook"]},"install":[{"id":"source","kind":"script","script":"cd /tmp && git clone https://github.com/RyanLisse/Contactbook && cd Contactbook && swift build -c release && cp .build/release/contactbook /opt/homebrew/bin/contactbook","label":"Build contactbook from source (requires Swift 6.0+, macOS 13+)"}]}}
---

# Apple Contacts CLI (contactbook)

Use `contactbook` to manage Apple Contacts from the terminal. Supports searching, creating, updating, deleting contacts, managing groups, and phone number lookups.

Setup
- Build from source: `git clone https://github.com/RyanLisse/Contactbook && cd Contactbook && swift build -c release`
- Copy binary: `cp .build/release/contactbook /opt/homebrew/bin/contactbook`
- macOS-only; grant Contacts permission when prompted on first run.

Permissions
- On first run, macOS will prompt for Contacts access — click "Allow".
- Or manually enable in System Settings → Privacy & Security → Contacts.

List Contacts
- List all: `contactbook contacts list`
- With limit: `contactbook contacts list --limit 10`
- JSON output: `contactbook contacts list --limit 10 --json`

Search Contacts
- By name/email/phone/org: `contactbook contacts search "John" --json`

Get Contact by ID
- `contactbook contacts get <contact-id> --json`

Create Contact
- `contactbook contacts create --firstName "John" --lastName "Doe" --email "john@example.com" --phone "+1234567890"`

Update Contact
- `contactbook contacts update <contact-id> --jobTitle "Engineer"`

Delete Contact
- `contactbook contacts delete <contact-id> --force`

Groups
- List groups: `contactbook groups list --json`
- Group members: `contactbook groups members <group-id>`

Phone Lookup
- `contactbook lookup "+15551234567" --json`

Output Formats
- JSON (scripting): add `--json` to most commands
- Default: human-readable text

MCP Server
- Start MCP server: `contactbook mcp serve`
- Exposes all contact operations as MCP tools for AI agents.

Notes
- macOS-only (uses Apple Contacts framework).
- Requires Contacts permission — grant via System Settings if denied.
- Built with Swift 6.0+ / Swift Argument Parser.
