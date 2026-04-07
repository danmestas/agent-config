# Agent Toolkit

A Claude Code plugin marketplace. Install individual plugins or the entire collection.

## Plugins

| Plugin | Description | Skills |
|--------|-------------|--------|
| [software-philosophy](plugins/software-philosophy/) | Adversarial proofing for code and plans | tigerstyle, hipp, ousterhout, norman, dx-audit, idiomatic-go |
| [gh-project-management](plugins/gh-project-management/) | GitHub project management | gh-project-setup, gh-project-operations, gh-project-charter, gh-project-shared |
| [project-management](plugins/project-management/) | Issue tracking (Linear + Jira) | linear-method, atlassian-cli-jira |
| [dev-tools](plugins/dev-tools/) | Development & testing utilities | doppler, midscene-testing, deterministic-simulation-testing |
| [apple-contacts](plugins/apple-contacts/) | macOS contacts management | apple-contacts |
| [career-interview](plugins/career-interview/) | Career profile building | career-interview |

## Install

Add the marketplace:

```bash
claude plugin marketplace add danmestas/agent-skills
```

Install a single plugin:

```bash
claude plugin install software-philosophy
```

Install all plugins:

```bash
claude plugin install software-philosophy gh-project-management project-management dev-tools apple-contacts career-interview
```

## License

MIT
