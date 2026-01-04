#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 vX.Y.Z"
  exit 1
fi

TAG="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY="$ROOT/deploy/index.html"

if [ ! -f "$DEPLOY" ]; then
  echo "deploy/index.html not found in repo"
  exit 1
fi

# Replace any @v... occurrences for this repo in deploy/index.html with the provided tag
# This replaces patterns like @v1.0.3 or @v1.0.10 etc.
perl -0777 -pe "s#(cdn.jsdelivr.net/gh/amperedigital/getampere)@v[0-9]+(?:\.[0-9]+)*#\1@${TAG}#g" -i "$DEPLOY"

# Commit and tag
cd "$ROOT"

# Add deploy and assets directories to ensure all new files are included
git add deploy/ assets/
git commit -m "chore(release): pin deploy scripts to ${TAG}"

git tag "$TAG"
git push origin HEAD:master

git push origin "$TAG"

echo "Published ${TAG} and updated deploy/index.html"
