#!/usr/bin/env bash
# themeize.sh — apply a theme from lib/themes.json to an SVG on stdin.
#
# Reads an SVG on stdin, writes a themed SVG to stdout.
# The SVG body is expected to contain a fixed set of sentinel hex values
# (see lib/README-sentinels.md). This script:
#   1. Replaces each sentinel hex with a var(--token) reference.
#   2. Injects a <style> block setting --bg, --fg, --line, etc. for the
#      chosen theme, with color-mix() derivations for missing tokens.
#   3. Injects a system-ui font-family for text.
#
# Usage:
#   echo "<svg>...</svg>" | themeize.sh --theme tokyo-night
#   cat file.svg | themeize.sh --theme cursor-dark
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
THEMES_FILE="$SKILL_DIR/lib/themes.json"

# --- CLI parsing ---
THEME="default"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --theme)
      [[ $# -ge 2 ]] || { echo "ERROR: --theme requires a value" >&2; exit 2; }
      THEME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# *//'
      exit 0 ;;
    *) echo "ERROR: unknown arg '$1'" >&2; exit 2 ;;
  esac
done

[[ -f "$THEMES_FILE" ]] || { echo "ERROR: themes.json not found at $THEMES_FILE" >&2; exit 2; }

# --- Load theme fields ---
theme_field() {
  # theme_field <theme-name> <field-name> -> field value or empty
  local t="$1" f="$2"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const [t, f, p] = process.argv.slice(1);
      const d = JSON.parse(require("fs").readFileSync(p, "utf8"));
      const v = d[t] && d[t][f];
      process.stdout.write(v == null ? "" : String(v));
    ' -- "$t" "$f" "$THEMES_FILE"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c '
import json, sys
t, f, p = sys.argv[1], sys.argv[2], sys.argv[3]
d = json.load(open(p))
v = d.get(t, {}).get(f, "")
sys.stdout.write("" if v is None else str(v))
' "$t" "$f" "$THEMES_FILE"
  else
    # Fallback: reject anything that isn't a safe identifier.
    if [[ ! "$t" =~ ^[a-zA-Z0-9_-]+$ || ! "$f" =~ ^[a-zA-Z0-9_-]+$ ]]; then
      echo "ERROR: theme/field name must match ^[a-zA-Z0-9_-]+$ (awk fallback)" >&2
      return 1
    fi
    awk -v t="\"$t\"" -v f="\"$f\"" '
      BEGIN { in_theme = 0 }
      $0 ~ t "[[:space:]]*:[[:space:]]*\\{" { in_theme = 1; next }
      in_theme && /^[[:space:]]*\}/ { in_theme = 0 }
      in_theme && $0 ~ f "[[:space:]]*:" {
        sub(/^[^:]*:[[:space:]]*"?/, ""); sub(/"?[,[:space:]]*$/, "");
        print; exit
      }
    ' "$THEMES_FILE"
  fi
}

# --- Resolve theme → 7 tokens (some may be empty) ---
BG="$(theme_field "$THEME" bg)"
FG="$(theme_field "$THEME" fg)"
LINE="$(theme_field "$THEME" line)"
ACCENT="$(theme_field "$THEME" accent)"
MUTED="$(theme_field "$THEME" muted)"
SURFACE="$(theme_field "$THEME" surface)"
BORDER="$(theme_field "$THEME" border)"

# Fall back to `default` theme if the requested one is unknown.
if [[ -z "$BG" || -z "$FG" ]]; then
  echo "WARN: theme '$THEME' not found or missing bg/fg; falling back to 'default'" >&2
  THEME="default"
  BG="$(theme_field default bg)"
  FG="$(theme_field default fg)"
  LINE="$(theme_field default line)"
  ACCENT="$(theme_field default accent)"
  MUTED="$(theme_field default muted)"
  SURFACE="$(theme_field default surface)"
  BORDER="$(theme_field default border)"
fi

# --- Build the <style> block ---
opt_var() {
  local name="$1" value="$2" fallback="$3"
  if [[ -n "$value" ]]; then
    printf '%s:%s;' "--$name" "$value"
  else
    printf '%s:%s;' "--$name" "$fallback"
  fi
}
LINE_FB="color-mix(in srgb, var(--fg) 50%, var(--bg))"
ACCENT_FB="color-mix(in srgb, var(--fg) 85%, var(--bg))"
MUTED_FB="color-mix(in srgb, var(--fg) 40%, var(--bg))"
SURFACE_FB="color-mix(in srgb, var(--fg) 3%, var(--bg))"
BORDER_FB="color-mix(in srgb, var(--fg) 20%, var(--bg))"

VARS="$(printf -- '--bg:%s;--fg:%s;%s%s%s%s%s' \
  "$BG" "$FG" \
  "$(opt_var line    "$LINE"    "$LINE_FB")" \
  "$(opt_var accent  "$ACCENT"  "$ACCENT_FB")" \
  "$(opt_var muted   "$MUTED"   "$MUTED_FB")" \
  "$(opt_var surface "$SURFACE" "$SURFACE_FB")" \
  "$(opt_var border  "$BORDER"  "$BORDER_FB")")"

FONT='font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'

STYLE="<style>:where(svg){$VARS color:var(--fg);background:var(--bg);}:where(svg) text{$FONT fill:currentColor;}</style>"

# --- Do the substitution + style injection in a single awk pass ---
awk -v style="$STYLE" '
  BEGIN {
    RS = "\0";
    n = split("010203 0a0b0c 101112 202122 303132 404142 505152", hex, " ");
    split("--bg --fg --line --accent --muted --surface --border", var_, " ");
    split("1,2,3 10,11,12 16,17,18 32,33,34 48,49,50 64,65,66 80,81,82", rgb_, " ");
    for (i = 1; i <= n; i++) {
      tok[i] = "var(" var_[i] ")";
      h = tolower(hex[i]);
      hex_lower[i] = "#" h;
      hex_upper[i] = "#" toupper(h);
      hex_alpha_lower[i] = "#" h "ff";
      hex_alpha_upper[i] = "#" toupper(h) "FF";
      rgb_form[i] = "rgb\\(" rgb_[i] "\\)";
    }
  }
  {
    for (i = 1; i <= n; i++) {
      gsub(hex_lower[i], tok[i]);
      gsub(hex_upper[i], tok[i]);
      gsub(hex_alpha_lower[i], tok[i]);
      gsub(hex_alpha_upper[i], tok[i]);
      gsub(rgb_form[i], tok[i]);
    }
    gsub(/rgb\(0,0,0\)/, "currentColor");
    # <svg ...> may span multiple lines; the regex below uses [^>]* which still
    # does not cross a literal ">" but DOES cross newlines in whole-record mode.
    if (match($0, /<svg[^>]*>/)) {
      s = substr($0, 1, RSTART + RLENGTH - 1);
      rest = substr($0, RSTART + RLENGTH);
      printf "%s%s%s", s, style, rest;
    } else {
      printf "%s", $0;
    }
  }
'
