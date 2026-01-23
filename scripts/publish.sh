#!/usr/bin/env bash
set -e

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 vX.Y.Z"
  exit 1
fi

NEW_TAG="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INDEX_HTML="$ROOT_DIR/deploy/index.html"

# Ensure we are in the root
cd "$ROOT_DIR"

echo "🚀 Starting release process for $NEW_TAG..."

# 0. CHECK CHANGELOG
# Ensure the changelog has been updated for this release
if [ -f "CHANGELOG.md" ]; then
  if ! grep -q "$NEW_TAG" "CHANGELOG.md"; then
    echo "❌ Error: CHANGELOG.md does not appear to contain an entry for $NEW_TAG."
    echo "   Please document the details of this publish in CHANGELOG.md before proceeding."
    exit 1
  else
    echo "   ✅ CHANGELOG.md entry found for $NEW_TAG."
  fi
fi

# -1. BUILD CSS
echo "   🎨 Building Tailwind CSS..."
npm run build:css

# 1. Identify changed files in deploy/
# Check for uncommitted changes (staged or unstaged)
CHANGED_FILES=$(git status --porcelain deploy/ | grep -v "index.html" | awk '{print $2}')

# If no uncommitted changes, check the last commit
if [ -z "$CHANGED_FILES" ]; then
  echo "ℹ️  No uncommitted changes in deploy/. Checking last commit..."
  CHANGED_FILES=$(git show --name-only --format="" HEAD | grep "^deploy/" | grep -v "index.html" || true)
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️  No changes detected in deploy/ (checked working tree and last commit)."
  echo "   Proceeding with release, but no assets will be updated in index.html."
else
  echo "🔍 Detected changed files:"
  echo "$CHANGED_FILES"
fi

# 1.1 SMART DEPENDENCY LINKING (The "Loader" Fix)
# If a child script changes, force its parent loader to also update in index.html,
# ensuring the parent loads the child from the correct new version folder.
if echo "$CHANGED_FILES" | grep -q -E "ampere-3d-key.js|distortion-grid.js"; then
  if ! echo "$CHANGED_FILES" | grep -q "global.js"; then
     echo "   🔗 Dependency detected: Dynamic imports changed (3D Key/Grid)."
     echo "   ⬆️  Forcing update of global.js (Loader) to ensure dependency alignment..."
     # Appending global.js to the list (newline-delimited)
     CHANGED_FILES="${CHANGED_FILES}
deploy/assets/js/global.js"
  fi
fi

# 1.5. GENERIC VERSION INJECTION
# Inject version number into ANY changed JS file that contains a console.log with a version string
for FILE in $CHANGED_FILES; do
  if [[ "$FILE" == *.js ]] && [ -f "$FILE" ]; then
     # Check if the file actually has a potential version string to avoid touching files unnecessarily
     # Looks for `console.log(... vX.Y ...)
     if grep -q "console.log.*v[0-9]\+\.[0-9]\+" "$FILE"; then
       echo "   🖊️  Injecting version $NEW_TAG into $FILE..."
       # Replace vX.Y.Z or vX.Y with new tag on lines containing console.log
       sed -i "/console.log/s/v[0-9]\+\.[0-9]\+\(\.[0-9]\+\)\?/$NEW_TAG/" "$FILE"
     fi
  fi
done

# 2. Update CDN links in index.html for CHANGED ASSETS only
for FILE in $CHANGED_FILES; do
  # Check if file is inside deploy/assets/
  if [[ "$FILE" == deploy/assets/* ]]; then
    
    # EXCLUSION CHECK
    # Check if file matches any excluded patterns (e.g. critical loaders to keep local)
    if [[ "$FILE" == *"logo-loader.js" ]]; then
       echo "   🛡️  Skipping CDN conversion for protected local asset: $FILE"
       continue
    fi

    # The file path in the repo is deploy/assets/...
    # The CDN URL should match the repo path: .../deploy/assets/...
    # So we use the full FILE path as the relative path for replacement.
    
    REL_PATH="$FILE"
    
    # Check if this file is referenced in index.html with a version tag
    # We look for the pattern: getampere@v.../deploy/assets/.../filename
    if grep -q "getampere@v[0-9a-zA-Z.-]*/$REL_PATH" "$INDEX_HTML"; then
      echo "   ↻ Updating version for $REL_PATH to $NEW_TAG"
      
      # Escape slashes for sed
      ESCAPED_PATH=$(echo "$REL_PATH" | sed 's/\//\\\//g')
      
      # Perform replacement
      # Matches: getampere@v<any-version>/deploy/assets/...
      # Replaces with: getampere@<new-tag>/deploy/assets/...
      sed -i "s/getampere@v[0-9a-zA-Z.-]*\/$ESCAPED_PATH/getampere@$NEW_TAG\/$ESCAPED_PATH/g" "$INDEX_HTML"
    else
      # Check for local path usage to auto-convert to CDN
      LOCAL_PATH="${REL_PATH#deploy/}"
      # Escape for regex (looking for literal string in file)
      ESCAPED_LOCAL_PATH=$(echo "$LOCAL_PATH" | sed 's/\//\\\//g')
      
      if grep -q "[\"']$LOCAL_PATH[\"']" "$INDEX_HTML"; then
         echo "   ✨ Auto-converting local link for $LOCAL_PATH to CDN ($NEW_TAG)..."
         # We need to use the FULL repo path for the CDN link (deploy/assets/...)
         ESCAPED_FULL_PATH=$(echo "$REL_PATH" | sed 's/\//\\\//g')
         CDN_BASE="https:\/\/cdn.jsdelivr.net\/gh\/amperedigital\/getampere@$NEW_TAG"
         
         # Replace "assets/..." or 'assets/...' with "https://cdn.../deploy/assets/..."
         # We accept both ' and " quotes in the source, but normalize to " when replacing if we want standardizing,
         # OR we just replace the content inside the quotes.
         # Let's replace the content only to preserve quote style if possible, or just force double quotes.
         # Simpler: Match quote, path, quote. Replace with quote, cdn_url, quote.
         
         sed -i "s/[\"']$ESCAPED_LOCAL_PATH[\"']/\"$CDN_BASE\/$ESCAPED_FULL_PATH\"/g" "$INDEX_HTML"
      else
         echo "   ℹ️  $REL_PATH changed but not found with version tag or local path in index.html (skipping CDN update)"
      fi
    fi
  fi
done

# 3. Commit changes
echo "📦 Committing changes..."
git add deploy/
if [ -f "CHANGELOG.md" ]; then
  git add CHANGELOG.md
fi
git commit -m "chore(release): $NEW_TAG" || echo "   (Nothing to commit, proceeding...)"

# 4. Tag
if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
  echo "   ⚠️  Tag $NEW_TAG already exists."
  # We don't auto-delete tags to be safe, just fail or warn.
  # But for a helper script, failing is safer.
  echo "   Error: Tag already exists. Please use a new version number."
  exit 1
else
  echo "🏷️  Creating tag $NEW_TAG..."
  git tag "$NEW_TAG"
fi

# 5. Push
echo "⬆️  Pushing to origin..."
git push origin master
git push origin "$NEW_TAG"

# 6. Deploy
echo "☁️  Deploying to Cloudflare Workers..."
npx wrangler deploy

echo "✅ Release $NEW_TAG complete!"
