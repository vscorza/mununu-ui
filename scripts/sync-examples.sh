#!/usr/bin/env bash
# Sync CTXDSL example files from mununu repo into mununu-ui/public/examples/
# Usage: ./scripts/sync-examples.sh [path-to-mununu-repo]
# Default: ../mununu

set -euo pipefail

MUNUNU_REPO="${1:-../mununu}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/examples"

if [ ! -d "$MUNUNU_REPO" ]; then
  echo "Error: mununu repo not found at '$MUNUNU_REPO'"
  echo "Usage: $0 [path-to-mununu-repo]"
  exit 1
fi

MUNUNU_REPO="$(cd "$MUNUNU_REPO" && pwd)"

echo "Syncing from: $MUNUNU_REPO"
echo "Syncing to:   $DEST"

# Clean and recreate
rm -rf "$DEST"
mkdir -p "$DEST/examples" "$DEST/property_examples" "$DEST/tutorial"

# Copy examples
if [ -d "$MUNUNU_REPO/examples" ]; then
  find "$MUNUNU_REPO/examples" -name '*.ctxdsl' | while read -r f; do
    rel="${f#$MUNUNU_REPO/examples/}"
    dir="$(dirname "$rel")"
    mkdir -p "$DEST/examples/$dir"
    cp "$f" "$DEST/examples/$rel"
  done
fi

# Copy property examples
if [ -d "$MUNUNU_REPO/docs/property_examples" ]; then
  find "$MUNUNU_REPO/docs/property_examples" -name '*.ctxdsl' | while read -r f; do
    cp "$f" "$DEST/property_examples/"
  done
fi

# Copy tutorial examples
if [ -d "$MUNUNU_REPO/tutorial/examples" ]; then
  find "$MUNUNU_REPO/tutorial/examples" -name '*.ctxdsl' | while read -r f; do
    cp "$f" "$DEST/tutorial/"
  done
fi

# Generate index.json manifest
echo "Generating index.json..."
entries=()
for category_dir in examples property_examples tutorial; do
  if [ ! -d "$DEST/$category_dir" ]; then continue; fi
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    name="$(basename "$f" .ctxdsl)"
    pretty="$(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"$category_dir\", \"path\": \"$rel\"}")
  done < <(find "$DEST/$category_dir" -name '*.ctxdsl' -type f | sort)
done

# Write JSON array with commas
echo "[" > "$DEST/index.json"
for i in "${!entries[@]}"; do
  if [ "$i" -lt $((${#entries[@]} - 1)) ]; then
    echo "${entries[$i]}," >> "$DEST/index.json"
  else
    echo "${entries[$i]}" >> "$DEST/index.json"
  fi
done
echo "]" >> "$DEST/index.json"

count=$(find "$DEST" -name '*.ctxdsl' | wc -l | tr -d ' ')
echo "Done: $count files synced."
