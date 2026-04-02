# skills/gh-project-shared/scripts/context-detector.sh
#!/bin/bash
set -e

# Detect repository type by analyzing files
detect_repo_type() {
  local indicators=()

  # Check for package managers
  [ -f "package.json" ] && indicators+=("package.json")
  [ -f "Gemfile" ] && indicators+=("Gemfile")
  [ -f "requirements.txt" ] && indicators+=("requirements.txt")
  [ -f "Cargo.toml" ] && indicators+=("Cargo.toml")
  [ -f "go.mod" ] && indicators+=("go.mod")

  # Check for release/changelog
  [ -f "CHANGELOG.md" ] && indicators+=("CHANGELOG.md")
  [ -d "releases" ] && indicators+=("releases/")
  [ -d "docs/releases" ] && indicators+=("docs/releases/")

  # Check for research/spikes
  [ -d "docs/research" ] && indicators+=("docs/research/")
  [ -d "docs/spikes" ] && indicators+=("docs/spikes/")

  # Check for roadmap docs
  [ -d "docs/roadmap" ] && indicators+=("docs/roadmap/")
  [ -f "ROADMAP.md" ] && indicators+=("ROADMAP.md")

  # Output as JSON array
  if [ ${#indicators[@]} -eq 0 ]; then
    echo '[]'
  else
    printf '%s\n' "${indicators[@]}" | jq -R . | jq -s .
  fi
}

# Helper function to cap score at 100
cap_score() {
  local score=$1
  if [ $score -gt 100 ]; then
    echo 100
  else
    echo $score
  fi
}

# Score templates based on indicators and conversation
score_templates() {
  local conversation=$1
  local indicators
  indicators=$(detect_repo_type)

  local scores='{}'

  # Score Kanban (baseline)
  scores=$(echo "$scores" | jq '.kanban = 40')

  # Score Bug Tracker
  local bug_score=20
  if echo "$indicators" | jq -e '.[] | select(. == "package.json")' >/dev/null; then
    bug_score=$((bug_score + 10))
  fi
  if echo "$conversation" | grep -qi "bug"; then
    bug_score=$((bug_score + 30))
  fi
  bug_score=$(cap_score $bug_score)
  scores=$(echo "$scores" | jq ".\"bug-tracker\" = $bug_score")

  # Score Feature Development
  local feature_score=30
  if echo "$indicators" | jq -e '.[] | select(contains("package"))' >/dev/null; then
    feature_score=$((feature_score + 45))
  fi
  if echo "$conversation" | grep -qi "feature"; then
    feature_score=$((feature_score + 20))
  fi
  feature_score=$(cap_score $feature_score)
  scores=$(echo "$scores" | jq ".\"feature-development\" = $feature_score")

  # Score Release Planning
  local release_score=20
  if echo "$indicators" | jq -e '.[] | select(. == "CHANGELOG.md")' >/dev/null; then
    release_score=$((release_score + 40))
  fi
  if echo "$indicators" | jq -e '.[] | select(contains("releases"))' >/dev/null; then
    release_score=$((release_score + 25))
  fi
  if echo "$conversation" | grep -qi "release"; then
    release_score=$((release_score + 20))
  fi
  release_score=$(cap_score $release_score)
  scores=$(echo "$scores" | jq ".\"release-planning\" = $release_score")

  # Score Roadmap
  local roadmap_score=30
  if echo "$indicators" | jq -e '.[] | select(contains("roadmap"))' >/dev/null; then
    roadmap_score=$((roadmap_score + 30))
  fi
  if echo "$conversation" | grep -qi "roadmap\|quarter\|Q[1-4]"; then
    roadmap_score=$((roadmap_score + 30))
  fi
  roadmap_score=$(cap_score $roadmap_score)
  scores=$(echo "$scores" | jq ".roadmap = $roadmap_score")

  # Score Research
  local research_score=10
  if echo "$indicators" | jq -e '.[] | select(contains("research") or contains("spike"))' >/dev/null; then
    research_score=$((research_score + 50))
  fi
  if echo "$conversation" | grep -qi "research\|spike\|investigation"; then
    research_score=$((research_score + 30))
  fi
  research_score=$(cap_score $research_score)
  scores=$(echo "$scores" | jq ".research = $research_score")

  echo "$scores"
}

# Get template recommendation with reasoning
recommend_template() {
  local conversation=$1

  local indicators
  indicators=$(detect_repo_type)

  local scores
  scores=$(score_templates "$conversation")

  # Find highest scoring template
  local recommendation
  recommendation=$(echo "$scores" | jq -r 'to_entries | max_by(.value) | .key')

  local max_score
  max_score=$(echo "$scores" | jq -r ".[\"$recommendation\"]")

  # Build reasoning with detailed explanations
  local reasoning=()
  local indicator_count
  indicator_count=$(echo "$indicators" | jq 'length')

  if [ "$indicator_count" -gt 0 ]; then
    reasoning+=("Detected $indicator_count indicators in repository")
  fi

  if echo "$indicators" | jq -e '.[] | select(. == "CHANGELOG.md")' >/dev/null; then
    reasoning+=("Found CHANGELOG.md (suggests release planning workflow)")
  fi

  if echo "$indicators" | jq -e '.[] | select(contains("package"))' >/dev/null; then
    reasoning+=("Package manager detected (suggests active development)")
  fi

  if echo "$indicators" | jq -e '.[] | select(contains("releases"))' >/dev/null; then
    reasoning+=("Release directory found (suggests release tracking)")
  fi

  if echo "$indicators" | jq -e '.[] | select(contains("research") or contains("spike"))' >/dev/null; then
    reasoning+=("Research/spike directory found (suggests investigation workflow)")
  fi

  if echo "$indicators" | jq -e '.[] | select(contains("roadmap"))' >/dev/null; then
    reasoning+=("Roadmap directory found (suggests long-term planning)")
  fi

  if [ -n "$conversation" ]; then
    reasoning+=("User context analyzed for template preferences")
  fi

  # Build reasons JSON
  local reasons_json
  if [ ${#reasoning[@]} -eq 0 ]; then
    reasons_json='[]'
  else
    reasons_json="$(printf '%s\n' "${reasoning[@]}" | jq -R . | jq -s .)"
  fi

  # Output structured recommendation
  jq -n \
    --arg rec "$recommendation" \
    --argjson score "$max_score" \
    --argjson scores "$scores" \
    --argjson reasons "$reasons_json" \
    '{
      recommendation: $rec,
      confidence: (if $score >= 70 then "high" elif $score >= 50 then "medium" else "low" end),
      scores: $scores,
      reasoning: $reasons
    }'
}
