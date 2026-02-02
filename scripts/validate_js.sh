#!/usr/bin/env bash
set -e

echo "🔍 Running JavaScript Syntax Validation..."

# Find all JS files in deploy/
# Use -print0 to handle filenames with spaces if any, though unlikely in this repo
JS_FILES=$(find deploy/ -name "*.js")

ERRORS=0

for file in $JS_FILES; do
    # Visual progress
    printf "   Checking %s... " "$(basename "$file")"

    # Check explicitly as ES Module (enforces strict mode & assumes valid ESM)
    # This catches errors that standard 'node --check' misses in .js files (e.g. invalid private fields in classes)
    if ! OUTPUT=$(cat "$file" | node --check --input-type=module 2>&1); then
        echo "❌ FAILED"
        echo "$OUTPUT"
        ERRORS=1
    else
        echo "✅ OK"
    fi
done

if [ $ERRORS -eq 1 ]; then
    echo "❌ JavaScript Validation Failed."
    exit 1
else
    echo "✅ JavaScript Validation Passed."
fi

if [ $ERRORS -eq 0 ]; then
    echo "✅ All JavaScript files are syntactically correct."
else
    echo "❌ JavaScript Validation Failed."
    exit 1
fi
