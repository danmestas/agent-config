#!/usr/bin/env bash
set -uo pipefail
shopt -s nullglob
cd "$(dirname "$0")/.."

passed=0
failed=0
failed_names=()

for t in test/test_*.sh; do
  name="$(basename "$t")"
  if bash "$t" >/tmp/pikchr-test-$$.log 2>&1; then
    echo "PASS  $name"
    passed=$((passed + 1))
  else
    echo "FAIL  $name"
    while IFS= read -r line; do printf '      %s\n' "$line"; done < /tmp/pikchr-test-$$.log
    failed=$((failed + 1))
    failed_names+=("$name")
  fi
done
rm -f /tmp/pikchr-test-$$.log

echo
if (( failed > 0 )); then
  echo "Total: $((passed + failed))   Passed: $passed   Failed: $failed   (${failed_names[*]})"
else
  echo "Total: $((passed + failed))   Passed: $passed   Failed: $failed"
fi
[[ $failed -eq 0 ]]
