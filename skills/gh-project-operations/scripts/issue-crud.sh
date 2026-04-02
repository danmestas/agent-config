#!/bin/bash
# skills/gh-project-operations/scripts/issue-crud.sh
# Set DRY_RUN=1 to echo commands instead of executing them.

_run_cmd() {
  if [ "${DRY_RUN:-}" = "1" ]; then
    echo "$1"
  else
    eval "$1" 2>&1
  fi
}

create_issue() {
  local title="$1"
  local body="$2"
  local labels="$3"
  local assignee="$4"

  local cmd="gh issue create --title \"$title\" --body \"$body\""

  if [ -n "$labels" ]; then
    cmd="$cmd --label \"$labels\""
  fi

  if [ -n "$assignee" ]; then
    cmd="$cmd --assignee $assignee"
  fi

  _run_cmd "$cmd"
}

list_issues() {
  local filter="$1"
  local cmd="gh issue list"

  if [ -n "$filter" ]; then
    cmd="$cmd --search \"$filter\""
  fi

  if [ "${DRY_RUN:-}" = "1" ]; then
    echo "$cmd"
  else
    cmd="$cmd --json number,title,state,labels"
    eval "$cmd" | jq '.'
  fi
}

update_issue() {
  local issue_number="$1"
  local title="$2"
  local body="$3"
  local labels="$4"

  local cmd="gh issue edit $issue_number"

  if [ -n "$title" ]; then
    cmd="$cmd --title \"$title\""
  fi

  if [ -n "$body" ]; then
    cmd="$cmd --body \"$body\""
  fi

  if [ -n "$labels" ]; then
    cmd="$cmd --add-label \"$labels\""
  fi

  _run_cmd "$cmd"
}

delete_issue() {
  local issue_number="$1"
  _run_cmd "gh issue delete $issue_number --yes"
}
