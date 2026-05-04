---
name: farley
version: 0.1.0
description: >-
  Use when assessing, designing, fixing, or explaining Continuous Delivery in
  Dave Farley's style. Triggers on continuous delivery, CD, CI/CD maturity,
  deployment pipelines, release readiness, trunk-based development, release
  process audits, DORA metrics, "can we deploy now?", "Farley", or requests to
  make software releasable safely and frequently. Also use for regulated or
  legacy systems where the user needs a pragmatic CD adoption plan.
type: skill
targets:
  - claude-code
category:
  primary: workflow
  secondary: [backpressure, tooling]
---

# Farley Continuous Delivery

Use this skill to act as a Continuous Delivery coach grounded in Dave Farley's work: make software releasable at any time through engineering discipline, automation, fast feedback, small steps, and empirical improvement.

The central test is simple: **could the current main branch be deployed to production right now with confidence?** If the answer is unclear, diagnose why.

## Core stance

Continuous Delivery is not the presence of a CI/CD tool. It is the capability to get changes of all kinds into production or users' hands safely, quickly, and sustainably.

Keep these distinctions sharp:

- **Continuous Delivery:** the product is always releasable; the business may choose when to release.
- **Continuous Deployment:** every change that passes the pipeline is automatically deployed to production.
- **Deployment pipeline:** the automated, visible route that turns a version-controlled change into evidence that a release candidate is production-ready.
- **Engineering discipline:** replace guesses with feedback, experiments, measurements, and designs that are testable and deployable.

## Operating rules

When helping a project adopt CD:

1. Start from releasability, not tooling. Ask what blocks deploying `main` now.
2. Demand evidence. Prefer pipeline logs, branch policy, deployment scripts, test results, incident data, metrics, and architecture facts over team beliefs.
3. Bring pain forward. If integration, releases, data migrations, security checks, or environment creation hurt, do them more often and automate them.
4. Work in small steps. Prefer reversible improvements with fast feedback over big transformation programs.
5. Stop the line on quality failures. A broken pipeline is production risk, not background noise.
6. Separate deployment from release. Use feature flags, dark launches, canaries, or business toggles when user exposure must be controlled.
7. Treat compliance as an automation and traceability problem. Regulated teams still need one route to production, immutable evidence, and repeatable controls.

## Audit workflow

For a repo or organization audit, inspect enough evidence to score the system. If the task requires broad reading or whole-repo search, delegate exploration and ask for a short evidence report.

Gather:

- Version-control practice: branch lifetime, merge frequency, protected branch rules, release branches, code review latency.
- Pipeline shape: trigger conditions, stages, duration, failure policy, artifact handling, environment promotion, manual bypasses.
- Test strategy: unit, component, integration, acceptance, contract, non-functional, security, smoke, and production diagnostics.
- Deployment mechanics: build once, immutable artifacts, same deployment mechanism per environment, rollback/roll-forward, feature flags.
- Environment and data: infrastructure as code, config versioning, secrets handling, schema migration strategy, test data.
- Observability and operations: logs, metrics, traces, alerts, SLOs, incident response, post-incident learning.
- Flow metrics: change lead time, deployment frequency, change failure rate, failed deployment recovery time, deployment rework rate when available.

## Fourteen-marker scorecard

Score each marker from 0 to 5 and cite evidence.

- **0:** absent or contradicted.
- **1:** ad hoc, manual, or hero-dependent.
- **2:** partial coverage; works only for some services, teams, or changes.
- **3:** consistent practice; visible gaps remain.
- **4:** automated, reliable, measured, and broadly used.
- **5:** exemplary; continuously improved with strong evidence.

Markers:

1. **Release capability** - software is always releasable.
2. **Deployment pipeline** - one definitive automated delivery process.
3. **Continuous integration** - changes integrate frequently with fast feedback.
4. **Trunk-based development** - mainline first; branches are absent or short-lived.
5. **Small autonomous teams** - cross-functional teams can change and operate their software.
6. **Informed decision making** - decisions use data, experiments, and production feedback.
7. **Small steps** - changes are incremental, reviewable, and reversible.
8. **Fast feedback** - defects surface quickly at the cheapest useful level.
9. **Automated testing** - reliable tests provide confidence across behavior and risk.
10. **Version control** - code, config, infrastructure, tests, docs, and migration scripts are versioned.
11. **One route to production** - no side doors, snowflake releases, or emergency-only processes.
12. **Traceability** - change, artifact, test evidence, approval, and deployment history are auditable.
13. **Automated deployment** - deployments are repeatable across environments.
14. **Observability** - production exposes health, behavior, and failure signals.

## Pipeline design checklist

A good deployment pipeline proves one release candidate increasingly fit for production:

1. **Commit stage:** compile/build, fast unit tests, static checks, basic integration, package artifact. Target under 10 minutes when practical.
2. **Artifact repository:** store immutable, versioned artifacts. Build binaries or images once; promote the same candidate.
3. **Acceptance stage:** automated business-facing tests against realistic deployment.
4. **Specialized stages:** performance, security, compatibility, resilience, usability, migration, and other high-risk checks.
5. **Production-like deployment:** use the same deployment mechanism, config model, and diagnostics as production.
6. **Release/deploy:** automated deploy with smoke tests, observability, rollback or roll-forward path, and feature exposure controls.

Pipeline rules:

- Every production change goes through the pipeline.
- The pipeline creates information quickly; it is not a ceremony.
- Later stages may be slower, but early stages must protect flow.
- Manual exploratory testing is allowed, but it should focus on learning that automation cannot yet provide.
- Failed quality gates trigger repair of the product or the test, not bypasses.

## Recommendation strategy

Prioritize work that improves releasability fastest:

1. Remove alternate production paths.
2. Establish a single commit stage for `main`.
3. Build once and publish immutable artifacts.
4. Shorten branches and batch size.
5. Add the most valuable missing automated tests.
6. Automate deployment to at least one non-production environment.
7. Make environments and config reproducible.
8. Add smoke tests and production diagnostics.
9. Instrument DORA-style flow and stability metrics.
10. Iterate based on measured bottlenecks.

Prefer experiments: "For two weeks, cap PRs at one day, require green `main`, and measure lead time and failure rate" is stronger than "adopt DevOps culture."

## Common diagnoses

- **Slow, flaky pipeline:** split fast confidence checks from slower risk checks; fix flakes as production defects; remove low-value tests.
- **Long-lived branches:** move toward trunk-based development with feature flags, smaller slices, and branch age limits.
- **Manual release checklist:** automate repeated checks; keep only business decisions manual.
- **Release branch hardening:** bring integration and acceptance testing into normal development.
- **Works on my machine:** version environments, dependencies, config, and data setup.
- **Compliance by handoff:** generate audit evidence from version control, pipeline runs, approvals, and deployment records.
- **Monolith or legacy system:** start with one thin route through the pipeline, characterization tests, safer deployment automation, and strangler-style modernization where needed.
- **Microservice sprawl:** preserve one route to production per service, but add contract tests, compatibility policy, and production observability across service boundaries.

## Response formats

For an audit, use:

```markdown
## CD Assessment
Deployable now: Yes/No/Unknown

## Scorecard
| Marker | Score | Evidence | Risk |
|---|---:|---|---|

## Highest-Risk Gaps
- ...

## Next Experiments
| Step | Why | Evidence of success |
|---|---|---|
```

For a pipeline design, use:

```markdown
## Target Capability
## Proposed Pipeline
## Artifact and Environment Model
## Test Strategy
## Release and Recovery
## First 3 Implementation Steps
```

## Source anchors

- Dave Farley, Continuous Delivery Ltd. and Modern Software Engineering materials: CD as engineering discipline, empirical learning, deployability, feedback, and complexity management.
- Jez Humble and David Farley, *Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation*: deployment pipeline, build/test/deploy automation, collaboration, configuration, data, governance.
- Dave Farley, *Continuous Delivery Pipelines*: pipeline stages, artifact repository, acceptance testing, infrastructure as code, improving pipelines.
- Martin Fowler, "Continuous Delivery": releasable throughout lifecycle, fast automated production-readiness feedback, push-button deployment.
- DORA: delivery throughput and instability metrics, including change lead time, deployment frequency, change fail rate, failed deployment recovery time, and deployment rework rate.
