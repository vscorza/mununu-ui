#!/usr/bin/env bash
# Sync CTXDSL and adapter example files from mununu repo into mununu-ui/public/examples/
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
mkdir -p "$DEST/examples" "$DEST/property_examples" "$DEST/tutorial" "$DEST/adapter_examples/xstate" "$DEST/adapter_examples/systemverilog" "$DEST/adapter_examples/agentic"

# Copy CTXDSL examples
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

# Copy adapter examples — XState JSON
if [ -d "$MUNUNU_REPO/examples/xstate" ]; then
  find "$MUNUNU_REPO/examples/xstate" -name '*.json' -type f | while read -r f; do
    cp "$f" "$DEST/adapter_examples/xstate/"
  done
fi

# Copy adapter examples — Agentic (XState JSON + CTXDSL)
if [ -d "$MUNUNU_REPO/examples/agentic" ]; then
  find "$MUNUNU_REPO/examples/agentic" \( -name '*.json' -o -name '*.ctxdsl' \) -type f | while read -r f; do
    cp "$f" "$DEST/adapter_examples/agentic/"
  done
fi

# Copy adapter examples — SystemVerilog
if [ -d "$MUNUNU_REPO/examples/systemverilog" ]; then
  find "$MUNUNU_REPO/examples/systemverilog" -name '*.sv' -type f | while read -r f; do
    cp "$f" "$DEST/adapter_examples/systemverilog/"
  done
fi

# Generate index.json manifest
echo "Generating index.json..."
entries=()

# CTXDSL categories
for category_dir in examples property_examples tutorial; do
  if [ ! -d "$DEST/$category_dir" ]; then continue; fi
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    name="$(basename "$f" .ctxdsl)"
    pretty="$(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"$category_dir\", \"path\": \"$rel\"}")
  done < <(find "$DEST/$category_dir" -name '*.ctxdsl' -type f | sort)
done

# Adapter examples — XState
if [ -d "$DEST/adapter_examples/xstate" ]; then
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    # Strip .xstate.json or .json suffix for display name
    basename_f="$(basename "$f")"
    name="${basename_f%.xstate.json}"
    name="${name%.json}"
    pretty="XState: $(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"adapter_examples\", \"path\": \"$rel\", \"format\": \"xstate\"}")
  done < <(find "$DEST/adapter_examples/xstate" -name '*.json' -type f | sort)
fi

# Adapter examples — Agentic
if [ -d "$DEST/adapter_examples/agentic" ]; then
  # XState JSON agentic examples
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    basename_f="$(basename "$f")"
    name="${basename_f%.xstate.json}"
    name="${name%.json}"
    pretty="Agentic: $(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"adapter_examples\", \"path\": \"$rel\", \"format\": \"agentic\"}")
  done < <(find "$DEST/adapter_examples/agentic" -name '*.json' -type f | sort)
  # CTXDSL agentic examples
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    name="$(basename "$f" .ctxdsl)"
    pretty="Agentic: $(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"adapter_examples\", \"path\": \"$rel\", \"format\": \"agentic\"}")
  done < <(find "$DEST/adapter_examples/agentic" -name '*.ctxdsl' -type f | sort)
fi

# Adapter examples — SystemVerilog
if [ -d "$DEST/adapter_examples/systemverilog" ]; then
  while IFS= read -r f; do
    rel="${f#$DEST/}"
    name="$(basename "$f" .sv)"
    pretty="SV: $(echo "$name" | tr '_' ' ')"
    entries+=("  {\"name\": \"$pretty\", \"category\": \"adapter_examples\", \"path\": \"$rel\", \"format\": \"systemverilog\"}")
  done < <(find "$DEST/adapter_examples/systemverilog" -name '*.sv' -type f | sort)
fi

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

ctxdsl_count=$(find "$DEST" -name '*.ctxdsl' | wc -l | tr -d ' ')
adapter_count=$(find "$DEST/adapter_examples" -type f 2>/dev/null | wc -l | tr -d ' ')
echo "Done: $ctxdsl_count CTXDSL files + $adapter_count adapter format files synced."
