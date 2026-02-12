echo "🔍 Running JavaScript Validation (ESLint + Syntax)..."

# ESLint parses files, so it catches syntax errors too!
# Use npx with quotes to ensure glob is passed to eslint (verified working)
if ! npx eslint "deploy/**/*.js"; then
    echo "❌ JavaScript Validation Failed (Lint/Syntax Errors Found)."
    exit 1
else
    echo "✅ JavaScript Validation Passed."
fi
