#!/bin/bash

# no-wing Quick Demo - Non-interactive
# Shows Q's capabilities without requiring user input

set -e

echo "🛫 no-wing Quick Demo"
echo "====================="
echo ""

# Build
echo "📦 Building..."
npm run build >/dev/null 2>&1
echo "✅ Build complete"
echo ""

# Q Status
echo "📊 Q Status:"
npm run start -- q-status
echo ""

# Q Task
echo "🤖 Q Task Example:"
echo "$ no-wing q-task \"analyze Lambda functions\""
npm run start -- q-task "analyze Lambda functions"
echo ""

# Q Status After
echo "📈 Q Status After Task:"
npm run start -- q-status
echo ""

# Git Check
echo "📝 Recent Commits:"
git log --oneline -3 || echo "No recent commits"
echo ""

echo "🎉 Quick demo complete!"
echo "Try: no-wing chat (for interactive mode)"
