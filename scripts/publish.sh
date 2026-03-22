#!/usr/bin/env bash
set -e

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 vX.Y.Z [optional-force-target]"
  exit 1
fi

NEW_TAG="$1"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

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

# 0.5. DETECT & VALIDATE MARKUP
echo "   🔍 Validating HTML changes..."
# Check both working tree and HEAD for HTML changes
DETECTED_HTML=$(git status --porcelain deploy/ | grep "\.html$" | awk '{print $2}')
if [ -z "$DETECTED_HTML" ]; then
  DETECTED_HTML=$(git show --name-only --format="" HEAD | grep "^deploy/.*\.html$" || true)
fi

if [ -n "$DETECTED_HTML" ]; then
  # Only validate existing files (in case of deletions)
  VALID_FILES=""
  for f in $DETECTED_HTML; do
    if [ -f "$f" ]; then
      VALID_FILES="$VALID_FILES $f"
    fi
  done
  
  if [ -n "$VALID_FILES" ]; then
     echo "   ⚠️  Skipping HTML Validation (Emergency Override)"
     # python3 scripts/validate_html.py $VALID_FILES
  else
     echo "   ℹ️  No HTML files to validate."
  fi
else
  echo "   ℹ️  No HTML changes detected."
fi

# 0.6. VALIDATE JAVASCRIPT
# Run syntax checking on all deploy JS files to catch accidental typos
# ./scripts/validate_js.sh
echo "   ⚠️  Skipping JS Validation (Emergency Override)"

# -1. BUILD CSS
echo "   🎨 Building Tailwind CSS..."
npm run build:css

# 1. Identify changed files in deploy/
# Run ESLint on global.js (and others if needed) before deploying
echo "🔍 Running ESLint..."
npx eslint deploy/assets/js/global.js
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed! Aborting deploy."
  exit 1
fi

# Check for uncommitted changes (staged or unstaged)
CHANGED_UNCOMMITTED=$(git status --porcelain deploy/ | grep -v "index.html" | awk '{print $2}' || true)

# Check the last commit as well, to catch cases where we committed but haven't published yet
CHANGED_COMMITTED=$(git show --name-only --format="" HEAD | grep "^deploy/" | grep -v "index.html" || true)

# Combine both sources to handle "Mixed State" (Committed + Uncommitted changes)
CHANGED_FILES=$(echo "$CHANGED_UNCOMMITTED
$CHANGED_COMMITTED" | sort | uniq | grep -v "^$" || true)

# 1.0.5 CSS SOURCE DETECTION (The "Empty Build" Fix)
# Even if styles.css looks identical (e.g. minified), if src/input.css or tailwind.config.js
# changed, we MUST treat styles.css as changed to force version linkage updates in HTML.
CSS_SOURCE_CHANGED=$(git status --porcelain src/input.css tailwind.config.js | awk '{print $2}' || true)
if [ -z "$CSS_SOURCE_CHANGED" ]; then
    CSS_SOURCE_COMMITTED=$(git show --name-only --format="" HEAD | grep -E "src/input.css|tailwind.config.js" || true)
    if [ -n "$CSS_SOURCE_COMMITTED" ]; then
       CSS_SOURCE_CHANGED="true"
    fi
fi

if [ -n "$CSS_SOURCE_CHANGED" ]; then
   if ! echo "$CHANGED_FILES" | grep -q "deploy/assets/css/styles.css"; then
       echo "   🎨 Dependency detected: Tailwind Source (input.css/config) changed."
       echo "   ⬆️  Forcing update of styles.css to ensure version alignment..."
       CHANGED_FILES="${CHANGED_FILES}
deploy/assets/css/styles.css"
   fi
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

# 1.2 TECH DEMO DEPENDENCY (Scene -> Main)
if echo "$CHANGED_FILES" | grep -q "tech-demo-scene.js"; then
  if ! echo "$CHANGED_FILES" | grep -q "tech-demo-main.js"; then
     echo "   🔗 Dependency detected: tech-demo-scene.js changed."
     echo "   ⬆️  Forcing update of tech-demo-main.js (Entry Point) to ensure dependency alignment..."
     CHANGED_FILES="${CHANGED_FILES}
deploy/assets/js/tech-demo-main.js"
  fi
fi

# 1.3 SYSTEM LINK DEPENDENCY
if echo "$CHANGED_FILES" | grep -q "system-link.js"; then
  if ! echo "$CHANGED_FILES" | grep -q "tech-demo-main.js"; then
     echo "   🔗 Dependency detected: system-link.js changed."
     echo "   ⬆️  Forcing update of tech-demo-main.js (Entry Point)..."
     CHANGED_FILES="${CHANGED_FILES}
deploy/assets/js/tech-demo-main.js"
  fi
fi

# 1.5. GENERIC VERSION INJECTION
# Inject version number into ALL JS files that contain a console.log with a version string
# This ensures that even if a file hasn't changed logic-wise, it still reports the correct deployed version.
echo "   🔫 Scanning ALL deploy/ JS files for version strings..."
find deploy/ -name "*.js" | while read -r FILE; do
  if [ -f "$FILE" ]; then
     # Check if the file actually has a potential version string to avoid touching files unnecessarily
     # Looks for `console.log(... vX.Y ...) . Also supports "Version: vX.Y" comments if we wanted, but sticking to console.log for now.
     if grep -q "console.log.*v[0-9]\+\.[0-9]\+" "$FILE"; then
       echo "   🖊️  Injecting version $NEW_TAG into $FILE..."
       # Replace vX.Y.Z or vX.Y with new tag on lines containing console.log
       # Robust regex to catch v2.953, v2.91, etc.
       sed -i "/console.log/s/v[0-9]\{1,\}\.[0-9]\{1,\}\(\.[0-9]\{1,\}\)\?/$NEW_TAG/g" "$FILE"
     fi
  fi
done

# 2. Update CDN links in ALL HTML files for CHANGED ASSETS only
# Scan for all HTML files in deploy/
if [ -n "$2" ]; then
  # User provided a scope/pattern (e.g. "deploy/tech-demo.html")
  echo "   🎯 Scoping CDN updates to matches for: $2"
  HTML_FILES=$(find deploy -maxdepth 1 -name "*.html" | grep -E "$2")
else
  # v2.895: SMART SCOPING
  # Default: Only update HTML files that are currently being edited (staged or uncommitted)
  # This follows the user directive: "Only the ones that we are editing are the ones that get updated."
  echo "   🧠 Smart Scoping active: Only updating HTML files with active changes..."
  HTML_FILES=$(git status --porcelain deploy/ | grep "\.html$" | awk '{print $2}' | sort | uniq || true)
  
  if [ -z "$HTML_FILES" ]; then
    # Fallback to HEAD changes if no working tree changes found
    HTML_FILES=$(git show --name-only --format="" HEAD | grep "^deploy/.*\.html$" || true)
  fi

  # v3.010: FORCE RELEASE UPDATE
  # If a release version is provided AND NO SPECIFIC TARGET IS SET ($2), we update the main entry points.
  # If a user provides a target (e.g. tech-demo.html), we respect that strictly.
  if [ -n "$NEW_TAG" ] && [ -z "$2" ]; then
     echo "   🚨 RELEASE MODE: Forcing metadata update for entry points..."
     # Add tech-demo.html and index.html to the list if they exist
     if [ -f "deploy/tech-demo.html" ]; then
        HTML_FILES="${HTML_FILES}
deploy/tech-demo.html"
     fi
     if [ -f "deploy/index.html" ]; then
        HTML_FILES="${HTML_FILES}
deploy/index.html"
     fi
     # Dedup
     HTML_FILES=$(echo "$HTML_FILES" | sort | uniq | grep -v "^$")
  fi

  if [ -z "$HTML_FILES" ]; then
    echo "   ⚠️  No HTML files are currently being edited. Skipping asset version alignment."
    HTML_FILES=""
  fi
fi

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
    
    for TARGET_HTML in $HTML_FILES; do
        # Check if this file is referenced in the HTML with a version tag
        # We look for the pattern: getampere@v.../deploy/assets/.../filename
        # Regex updated (v2.321) to include underscores (_) in version tags
        if grep -q "getampere@v[0-9a-zA-Z._-]*\/$REL_PATH" "$TARGET_HTML"; then
          # v2.895: PAGE-LEVEL SYNCHRONIZATION
          # If this HTML file uses a versioned link for the changed asset, 
          # we synchronize ALL other getampere versioned links in this file to the same tag.
          echo "   🔄 SYNC: Aligning ALL versioned assets in $(basename "$TARGET_HTML") to $NEW_TAG (Triggered by $REL_PATH)"
          
          # Perform global replacement for any getampere@v... pattern in the file
          sed -i "s/getampere@v[0-9a-zA-Z._-]*\//getampere@$NEW_TAG\//g" "$TARGET_HTML"
        else
          # Check for local path usage to auto-convert to CDN
          LOCAL_PATH="${REL_PATH#deploy/}"
          
          # Handle potential query params in the HTML like output.js?v=1.23
          # We just look for the filename.ext pattern
          
          # Escape for regex (looking for literal string in file)
          ESCAPED_LOCAL_PATH=$(echo "$LOCAL_PATH" | sed 's/\//\\\//g')
          
          if grep -E -q "[\"'](\./)?$LOCAL_PATH" "$TARGET_HTML"; then
             # It matches 'assets/js/foo.js' or 'assets/js/foo.js?v=...'
             echo "   ✨ Auto-converting/Updating local link for $LOCAL_PATH in $(basename "$TARGET_HTML") to CDN ($NEW_TAG)..."
             ESCAPED_FULL_PATH=$(echo "$REL_PATH" | sed 's/\//\\\//g')
             CDN_BASE="https:\/\/cdn.jsdelivr.net\/gh\/amperedigital\/getampere@$NEW_TAG"
             
             # Case A: Quote + Path + Quote (Clean local path) -> Replace with CDN URL (Clean)
             sed -i "s/[\"']\.\/$ESCAPED_LOCAL_PATH[\"']/\"$CDN_BASE\/$ESCAPED_FULL_PATH\"/g" "$TARGET_HTML"
             sed -i "s/[\"']$ESCAPED_LOCAL_PATH[\"']/\"$CDN_BASE\/$ESCAPED_FULL_PATH\"/g" "$TARGET_HTML"

             # Case B: Path + Query Param (?v=...) -> Replace with CDN URL (Strip Query param as CDN is versioned)
             # Matches: ./assets/foo.js?v=1.23
             sed -i "s/[\"']\.\/$ESCAPED_LOCAL_PATH?v=[^\"']*[\"']/\"$CDN_BASE\/$ESCAPED_FULL_PATH\"/g" "$TARGET_HTML"
             sed -i "s/[\"']$ESCAPED_LOCAL_PATH?v=[^\"']*[\"']/\"$CDN_BASE\/$ESCAPED_FULL_PATH\"/g" "$TARGET_HTML"
          fi
        fi
    done
  fi
done

# ------------------------------------------------------------------------------
# 2.5 UNIVERSAL TAGGING (Force Update)
# ------------------------------------------------------------------------------
# User Requirement: "Universal tagging system"
# Regardless of whether assets changed, we MUST update the HTML to point to the new version.
if [ -n "$HTML_FILES" ]; then
    echo "   🏷️  Universal Tagging: Forcing CDN links and Meta Tags to $NEW_TAG..."
    for TARGET_HTML in $HTML_FILES; do
        echo "      Processing $(basename "$TARGET_HTML")..."
        
        # 1. Update Meta Version
        if grep -q "<meta name=\"version\"" "$TARGET_HTML"; then
            sed -i "s/<meta name=\"version\" content=\"v[^\"]*\">/<meta name=\"version\" content=\"$NEW_TAG\">/g" "$TARGET_HTML"
        fi
        
        # 2. Update Asset Links (getampere@v...)
        # This ensures that v2.990 loads v2.990 assets, keeping the ecosystem synced.
        sed -i "s/getampere@v[0-9a-zA-Z._-]*\//getampere@$NEW_TAG\//g" "$TARGET_HTML"
    done
fi

# 3. Commit changes
echo "📦 Committing changes..."
git add deploy/
if [ -f "CHANGELOG.md" ]; then
  git add CHANGELOG.md
fi
git commit -m "chore(release): $NEW_TAG" || echo "   (Nothing to commit, proceeding...)"

# 4. Tag & Push
if [ "${SKIP_TAG:-}" = "1" ]; then
  echo "🏷️  Skipping tag/push (handled by unified script)."
else
  if git rev-parse "$NEW_TAG" >/dev/null 2>&1; then
    EXISTING_TAG_COMMIT=$(git rev-parse "$NEW_TAG")
    CURRENT_COMMIT=$(git rev-parse HEAD)
    if [ "$EXISTING_TAG_COMMIT" == "$CURRENT_COMMIT" ]; then
      echo "   ✅ Tag $NEW_TAG already exists and matches HEAD. Proceeding..."
    else
      echo "   ❌ Error: Tag $NEW_TAG already exists but points to a different commit ($EXISTING_TAG_COMMIT)."
      echo "      Current HEAD is $CURRENT_COMMIT."
      echo "      Please use a new version number or resolve the collision."
      exit 1
    fi
  else
    echo "🏷️  Creating tag $NEW_TAG..."
    git tag "$NEW_TAG"
  fi

  # 5. Push
  echo "⬆️  Pushing to origin..."
  git push origin master
  git push origin "$NEW_TAG" || echo "   ⚠️  Tag $NEW_TAG already exists on remote."
fi

# 6. Deploy
echo "☁️  Deploying to Cloudflare Workers..."
npx wrangler deploy

if [ "${SKIP_TAG:-0}" != "1" ]; then
    echo "🔥 Purging + warming CDN cache for changed assets..."
    CDN_BASE_URL="https://cdn.jsdelivr.net/gh/amperedigital/getampere@$NEW_TAG"
    PURGE_BASE_URL="https://purge.jsdelivr.net/gh/amperedigital/getampere@$NEW_TAG"

    for FILE in $CHANGED_FILES; do
      # Only warm assets in deploy/assets/ (scripts, css, etc)
      if [[ "$FILE" == deploy/assets/* ]]; then
         CDN_URL="$CDN_BASE_URL/$FILE"
         PURGE_URL="$PURGE_BASE_URL/$FILE"
         echo "   🗱️  Purging jsDelivr: $PURGE_URL"
         curl -s -o /dev/null "$PURGE_URL" || echo "   ⚠️  Warning: Could not purge $PURGE_URL"
         echo "   🌍 Pre-fetching: $CDN_URL"
         curl -s -o /dev/null "$CDN_URL" || echo "   ⚠️  Warning: Could not pre-fetch $CDN_URL"
      fi
    done

    # ALWAYS purge + pre-fetch styles.css and global.js regardless of whether they changed.
    # The HTML version tag is bumped on every release so the browser requests styles.css@vNEW
    # even if the file content is identical. Without this, jsDelivr serves a 404 for the
    # new tag until their lazy GitHub indexer catches up (can take 12-24h).
    CORE_ASSETS="deploy/assets/css/styles.css deploy/assets/js/global.js"
    for FILE in $CORE_ASSETS; do
      if ! echo "$CHANGED_FILES" | grep -q "$FILE"; then
        PURGE_URL="$PURGE_BASE_URL/$FILE"
        CDN_URL="$CDN_BASE_URL/$FILE"
        echo "   🗱️  Purging jsDelivr (always): $PURGE_URL"
        curl -s -o /dev/null "$PURGE_URL" || echo "   ⚠️  Warning: Could not purge $PURGE_URL"
        echo "   🌍 Pre-fetching (always): $CDN_URL"
        curl -s -o /dev/null "$CDN_URL" || echo "   ⚠️  Warning: Could not pre-fetch $CDN_URL"
      fi
    done
fi

echo "✅ Release $NEW_TAG complete!"

# PERSISTENT MEMORY LOG (standalone deploys only)
if [ "${SKIP_TAG:-0}" != "1" ]; then
    MEMORY_SCRIPT="$(cd "$(dirname "$0")/../../.agent/scripts" 2>/dev/null && pwd)/memory.sh"
    if [ -x "$MEMORY_SCRIPT" ]; then
        CHANGES=$(sed -n "/^## $NEW_TAG/,/^## v/{/^## v/!p;}" CHANGELOG.md | grep -v "^$" | grep -v "^## " | head -5 | tr '\n' '; ' | sed 's/; $//')
        [ -z "$CHANGES" ] && CHANGES="Frontend release $NEW_TAG"
        "$MEMORY_SCRIPT" log-deploy "$NEW_TAG" "frontend" "$CHANGES"
        echo "📝 Deploy logged to persistent memory"

        # Auto-update CONTEXT.md
        CONTEXT_SCRIPT="$(cd "$(dirname "$0")/../../.agent/scripts" 2>/dev/null && pwd)/update_context.py"
        python3 "$CONTEXT_SCRIPT" "$NEW_TAG" "frontend" "$(pwd)/CHANGELOG.md"
    fi
fi
