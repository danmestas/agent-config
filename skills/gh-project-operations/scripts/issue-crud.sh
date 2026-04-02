#!/bin/bash
# skills/gh-project-operations/scripts/issue-crud.sh

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

  eval "$cmd" 2>&1
}

list_issues() {
  local filter="$1"
  local cmd="gh issue list --json number,title,state,labels"

  if [ -n "$filter" ]; then
    cmd="$cmd --search \"$filter\""
  fi

  eval "$cmd" | jq '.'
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

  eval "$cmd" 2>&1
}

delete_issue() {
  local issue_number="$1"
  eval "gh issue delete $issue_number --yes" 2>&1
}
