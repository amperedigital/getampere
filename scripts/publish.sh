#!/usr/bin/env bash#!/usr/bin/env bash



















































































echo "✅ Release $NEW_TAG complete!"npx wrangler deployecho "☁️  Deploying to Cloudflare Workers..."# 6. Deploygit push origin "$NEW_TAG"git push origin masterecho "⬆️  Pushing to origin..."# 5. Pushgit tag "$NEW_TAG"fi  exit 1  echo "   Error: Tag already exists. Please use a new version number."  # But for a helper script, failing is safer.  # We don't auto-delete tags to be safe, just fail or warn.  echo "   ⚠️  Tag $NEW_TAG already exists."if git rev-parse "$NEW_TAG" >/dev/null 2>&1; thenecho "🏷️  Creating tag $NEW_TAG..."# 4. Taggit commit -m "chore(release): $NEW_TAG" || echo "   (Nothing to commit, proceeding...)"git add deploy/echo "📦 Committing changes..."# 3. Commit changesdone  fi    fi      echo "   ℹ️  $REL_PATH changed but not found with version tag in index.html (skipping CDN update)"    else      sed -i "s/getampere@v[0-9.]*\/$ESCAPED_PATH/getampere@$NEW_TAG\/$ESCAPED_PATH/g" "$INDEX_HTML"      # Replaces with: getampere@<new-tag>/<path-to-file>      # Matches: getampere@v<any-version>/<path-to-file>      # Perform replacement            ESCAPED_PATH=$(echo "$REL_PATH" | sed 's/\//\\\//g')      # Escape slashes for sed            echo "   ↻ Updating version for $REL_PATH to $NEW_TAG"    if grep -q "getampere@v[0-9.]*/$REL_PATH" "$INDEX_HTML"; then    # We look for the pattern: getampere@v.../assets/.../filename    # Check if this file is referenced in index.html with a version tag        REL_PATH="${FILE#deploy/}"    # Get relative path from deploy/ (e.g., assets/js/tab-flipper.js)  if [[ "$FILE" == deploy/assets/* ]]; then  # Check if file is inside deploy/assets/for FILE in $CHANGED_FILES; do# We iterate through changed files to see if any match assets referenced in HTMLecho "🔍 Checking for changed assets to update in index.html..."# 2. Update CDN links in index.html for CHANGED ASSETS onlyfi  # If no changes, we might just be re-deploying or tagging a state, but warn the user.  echo "⚠️  No changes detected in deploy/ folder."if [ -z "$CHANGED_FILES" ]; thenCHANGED_FILES=$(git status --porcelain deploy/ | awk '{print $2}')# Get list of changed files in deploy/ (staged, unstaged, untracked)# 1. Check for uncommitted changes in deploy/echo "🚀 Starting release process for $NEW_TAG..."cd "$ROOT_DIR"# Ensure we are in the rootINDEX_HTML="$ROOT_DIR/deploy/index.html"ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"NEW_TAG="$1"fi  exit 1  echo "Example: $0 v1.0.206"  echo "Usage: $0 <version-tag>"if [ "$#" -ne 1 ]; then# Usage: ./scripts/publish.sh v1.0.206set -euo pipefailset -euo pipefail

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

# Deploy to Cloudflare Workers
npx wrangler deploy
