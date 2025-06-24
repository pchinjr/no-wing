#!/bin/bash

# no-wing Conversation Demo - Shows Q's improved chat capabilities

set -e

echo "🛫 no-wing Conversation Demo"
echo "============================"
echo ""
echo "This demo shows Q's natural conversation abilities:"
echo "• Friendly greetings and responses"
echo "• Smart message classification"
echo "• Helpful examples and suggestions"
echo "• Professional AI teammate interaction"
echo ""
echo "Press Enter to start the conversation demo..."
read

# Build first
echo "📦 Building no-wing..."
npm run build >/dev/null 2>&1
echo "✅ Build complete"
echo ""

echo "💬 Starting conversation with Q..."
echo "=================================="
echo ""

# Simulate a natural conversation
echo "🧑 User: hello"
echo -e "hello\n" | timeout 10s npm run start -- chat | grep -A 10 "🤖 Q:" | head -10
echo ""

echo "🧑 User: what can you do"
echo -e "what can you do\n" | timeout 10s npm run start -- chat | grep -A 15 "🤖 Q:" | head -15
echo ""

echo "🧑 User: how are you"
echo -e "how are you\n" | timeout 10s npm run start -- chat | grep -A 10 "🤖 Q:" | head -10
echo ""

echo "🧑 User: can you help me"
echo -e "can you help me\n" | timeout 10s npm run start -- chat | grep -A 15 "🤖 Q:" | head -15
echo ""

echo "🧑 User: thanks"
echo -e "thanks\n" | timeout 10s npm run start -- chat | grep -A 5 "🤖 Q:" | head -5
echo ""

echo "🎉 Conversation Demo Complete!"
echo "=============================="
echo ""
echo "✅ Key Features Demonstrated:"
echo "   • Natural conversation flow"
echo "   • Context-aware responses"
echo "   • Helpful examples and suggestions"
echo "   • Professional AI teammate personality"
echo "   • Smart classification of message types"
echo ""
echo "🛫 Q is ready to be your conversational development partner!"
