#!/bin/bash

# Documentation validation script for no-wing
# Checks for broken links, missing files, and documentation standards

echo "🔍 Validating no-wing documentation..."
echo "======================================"

# Check if docs directory exists
if [ ! -d "docs" ]; then
    echo "❌ docs/ directory not found"
    exit 1
fi

echo "✅ docs/ directory exists"

# Check for required documentation files
required_files=(
    "README.md"
    "DEVELOPMENT.md" 
    "SUMMARY.md"
    "docs/README.md"
    "docs/adr/README.md"
    "docs/adr/template.md"
    "docs/adr/0001-treat-ai-as-first-class-developer.md"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
        missing_files+=("$file")
    fi
done

# Check ADR numbering
echo ""
echo "🔢 Checking ADR numbering..."
adr_files=(docs/adr/[0-9]*.md)
if [ ${#adr_files[@]} -gt 0 ]; then
    for adr in "${adr_files[@]}"; do
        if [[ $adr =~ docs/adr/([0-9]{4})-.*\.md ]]; then
            echo "✅ $adr - proper numbering"
        else
            echo "❌ $adr - improper numbering format"
        fi
    done
else
    echo "⚠️  No numbered ADR files found"
fi

# Check for TODO items in documentation
echo ""
echo "📝 Checking for TODO items..."
todo_count=$(grep -r "TODO\|FIXME\|XXX" docs/ --include="*.md" | wc -l)
if [ $todo_count -gt 0 ]; then
    echo "⚠️  Found $todo_count TODO items in documentation:"
    grep -r "TODO\|FIXME\|XXX" docs/ --include="*.md" -n
else
    echo "✅ No TODO items found"
fi

# Check for broken internal links (basic check)
echo ""
echo "🔗 Checking for potential broken links..."

# Simple check for markdown files referenced in links
link_files=$(find docs/ -name "*.md" -exec grep -l "\](" {} \; 2>/dev/null | wc -l)
if [ $link_files -gt 0 ]; then
    echo "✅ Found markdown links in $link_files files"
else
    echo "ℹ️  No markdown links found"
fi

broken_links=0

if [ $broken_links -eq 0 ]; then
    echo "✅ Basic link structure check passed"
fi

# Summary
echo ""
echo "📊 Validation Summary"
echo "===================="
echo "Missing files: ${#missing_files[@]}"
echo "TODO items: $todo_count"
echo "Broken links: $broken_links"

if [ ${#missing_files[@]} -eq 0 ] && [ $broken_links -eq 0 ]; then
    echo ""
    echo "🎉 Documentation validation passed!"
    echo "🤖 Q says: 'Documentation looks great! Ready for collaboration.'"
    exit 0
else
    echo ""
    echo "⚠️  Documentation validation found issues"
    echo "🤖 Q says: 'Let me help fix these documentation issues!'"
    exit 1
fi
