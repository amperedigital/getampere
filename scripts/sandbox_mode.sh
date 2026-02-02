#!/usr/bin/env bash

# SCRIPTS/SANDBOX_MODE.SH
# Use this script in your "Anti-Gravity" Sandbox to switch from CDN -> Local links.
# This ensures you are testing your LOCAL changes, not the old public production code.

echo "🧪 Switching 'deploy/tech-demo.html' and 'deploy/index.html' to SANDBOX MODE (Local Relative Links)..."

TARGETS="deploy/tech-demo.html deploy/index.html deploy/3d_key_demo.html"

for TARGET in $TARGETS; do
    if [ -f "$TARGET" ]; then
        echo "   Processing $TARGET..."
        
        # Pattern: https://cdn.jsdelivr.net/gh/amperedigital/getampere@v2.815-fix-auth-race/deploy/assets/css/styles.css
        # Replacement: ./assets/css/styles.css
        
        # We use a timestamp query param (?t=...) to ensure cache busting on every deploy in sandbox mode
        TIMESTAMP=$(date +%s)
        
        # 1. Replace Stylesheets
        sed -i -E "s|https://cdn.jsdelivr.net/gh/amperedigital/getampere@[a-zA-Z0-9._-]+/deploy/(assets/css/[a-zA-Z0-9._-]+.css)|\./\1?t=$TIMESTAMP|g" "$TARGET"
        
        # 2. Replace Scripts
        sed -i -E "s|https://cdn.jsdelivr.net/gh/amperedigital/getampere@[a-zA-Z0-9._-]+/deploy/(assets/js/[a-zA-Z0-9._-]+.js)|\./\1?t=$TIMESTAMP|g" "$TARGET"
        
        # 3. Replace Modules (if any specific ones)
        # (covered by generic script rule above)

        echo "   ✅ Converted to Local + Timestamp: ?t=$TIMESTAMP"
    else
        echo "   ⚠️ File not found: $TARGET"
    fi
done

echo "🎉 Sandbox Mode Active. Run 'npx wrangler deploy' to publish changes."
