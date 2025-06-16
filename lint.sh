#!/bin/bash
# Simple linting script for ABO Converter project

echo "🔍 Running Ruff linter..."
echo "========================="

# Run Ruff check
echo "📋 Checking code style and potential issues..."
ruff check --output-format=concise

echo ""
echo "🔧 Auto-fixing issues where possible..."
ruff check --fix --unsafe-fixes

echo ""
echo "📊 Final summary..."
REMAINING=$(ruff check --output-format=concise | wc -l)
echo "Remaining issues: $REMAINING"

if [ "$REMAINING" -eq 0 ]; then
    echo "✅ All linting issues resolved!"
    exit 0
else
    echo "⚠️  Some issues remain and need manual attention."
    echo ""
    echo "Most common remaining issues you may see:"
    echo "- PLR0912: Too many branches (consider refactoring complex functions)"
    echo "- PLR2004: Magic values (replace with named constants)"
    echo "- T201: print statements (consider using logging instead)"
    echo "- N801: Class naming conventions (use CapWords)"
    echo ""
    echo "To see detailed issues:"
    echo "  ruff check"
    echo ""
    echo "To auto-fix safe issues:"
    echo "  ruff check --fix"
    exit 1
fi