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

# --- Derive missing tokens via sRGB mix(fg, bg, pct) ---
# Output is concrete hex so the SVG renders identically in every renderer
# (browsers, librsvg, ImageMagick, kitten icat, GitHub preview, ...).
derive_hex() {
  local fg="$1" bg="$2" pct="$3"
  if command -v node >/dev/null 2>&1; then
    node -e '
      const [fg, bg, p] = process.argv.slice(1);
      const parse = (h) => {
        h = h.replace(/^#/, "");
        if (h.length === 3) h = h.split("").map((c) => c + c).join("");
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      };
      const [fr, fg_, fb] = parse(fg);
      const [br, bg_, bb] = parse(bg);
      const t = Number(p) / 100;
      const mix = (a, b) => Math.round(a * t + b * (1 - t));
      const out = [mix(fr, br), mix(fg_, bg_), mix(fb, bb)]
        .map((n) => n.toString(16).padStart(2, "0")).join("");
      process.stdout.write("#" + out);
    ' -- "$fg" "$bg" "$pct"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c '
import sys
fg, bg, p = sys.argv[1], sys.argv[2], sys.argv[3]
def parse(h):
    h = h.lstrip("#")
    if len(h) == 3: h = "".join(c*2 for c in h)
    return int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
fr,fg_,fb = parse(fg); br,bg_,bb = parse(bg)
t = float(p)/100
mix = lambda a,b: round(a*t + b*(1-t))
out = "".join(f"{c:02x}" for c in (mix(fr,br),mix(fg_,bg_),mix(fb,bb)))
sys.stdout.write("#" + out)
' "$fg" "$bg" "$pct"
  else
    # No interpreter — emit fg as-is (visible, suboptimal contrast, never invisible).
    printf '%s' "$fg"
  fi
}

[[ -z "$LINE"    ]] && LINE="$(derive_hex    "$FG" "$BG" 50)"
[[ -z "$ACCENT"  ]] && ACCENT="$(derive_hex  "$FG" "$BG" 85)"
[[ -z "$MUTED"   ]] && MUTED="$(derive_hex   "$FG" "$BG" 40)"
[[ -z "$SURFACE" ]] && SURFACE="$(derive_hex "$FG" "$BG"  3)"
[[ -z "$BORDER"  ]] && BORDER="$(derive_hex  "$FG" "$BG" 20)"

FONT='font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;'

STYLE="<style>:where(svg){color:$FG;background:$BG;}:where(svg) text{$FONT fill:currentColor;}</style>"

# --- Do the substitution + style injection in a single awk pass ---
# Sentinels are replaced with the theme's resolved hex (not var() refs), so the
# output SVG is self-contained and renders identically in every SVG consumer.
awk -v style="$STYLE" \
    -v c1="$BG"     -v c2="$FG"      -v c3="$LINE"   -v c4="$ACCENT" \
    -v c5="$MUTED"  -v c6="$SURFACE" -v c7="$BORDER" '
  BEGIN {
    RS = "\0";
    n = split("010203 0a0b0c 101112 202122 303132 404142 505152", hex, " ");
    split("1,2,3 10,11,12 16,17,18 32,33,34 48,49,50 64,65,66 80,81,82", rgb_, " ");
    tok[1]=c1; tok[2]=c2; tok[3]=c3; tok[4]=c4; tok[5]=c5; tok[6]=c6; tok[7]=c7;
    for (i = 1; i <= n; i++) {
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
      # Background <rect> so renderers that ignore CSS `background:` (librsvg,
      # ImageMagick, kitten icat) still paint the theme bg behind the diagram.
      bg_rect = "<rect width=\"100%\" height=\"100%\" fill=\"" c1 "\"/>";
      printf "%s%s%s%s", s, style, bg_rect, rest;
    } else {
      printf "%s", $0;
    }
  }
'
