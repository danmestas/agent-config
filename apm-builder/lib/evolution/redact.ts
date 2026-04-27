// apm-builder/lib/evolution/redact.ts
const PATTERNS: { re: RegExp; label: string }[] = [
  { re: /sk-ant-[a-zA-Z0-9_-]{15,}/g, label: 'ANTHROPIC_KEY' },
  { re: /ghp_[a-zA-Z0-9]{15,}/g, label: 'GITHUB_PAT' },
  { re: /sk-[a-zA-Z0-9]{20,}/g, label: 'OPENAI_KEY' },
  { re: /xox[bsap]-[a-zA-Z0-9-]{10,}/g, label: 'SLACK_TOKEN' },
  { re: /AKIA[0-9A-Z]{16}/g, label: 'AWS_ACCESS_KEY' },
  { re: /\/Users\/[^/]+\/(?:Downloads|Desktop)\/[^\s)]+/g, label: 'PRIVATE_PATH' },
];

export function redact(input: string): string {
  let out = input;
  for (const { re, label } of PATTERNS) {
    out = out.replace(re, `<REDACTED:${label}>`);
  }
  return out;
}
