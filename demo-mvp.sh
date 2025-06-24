#!/bin/bash

# no-wing MVP Demo - Clean and Working
# Demonstrates Q's core capabilities and interactive chat

set -e

echo "🛫 no-wing MVP Demo"
echo "==================="
echo ""
echo "This demo shows Q's core capabilities:"
echo "• Interactive AI chat for development"
echo "• Q creates real AWS infrastructure with SAM"
echo "• Q commits to Git as proper AI developer"
echo "• Progressive permissions and security"
echo ""
echo "Press Enter to start the demo..."
read

# Build the project first
echo "📦 Building no-wing..."
npm run build
echo ""

# Step 1: Check Q Status
echo "🚀 Step 1: Check Q's Current Status"
echo "===================================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run start -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 2: Interactive Chat Demo
echo "💬 Step 2: Interactive Q Chat Demo"
echo "==================================="
echo ""
echo "Let's start an interactive chat with Q..."
echo "We'll ask Q to create a Lambda function."
echo ""
echo "Commands you can try in the chat:"
echo "• create a Lambda function for user authentication"
echo "• status"
echo "• help"
echo "• exit"
echo ""
echo "Press Enter to start chat..."
read

echo "$ no-wing chat"
echo ""
echo "Starting interactive chat with Q..."
echo "(Type 'exit' to end the chat session)"
echo ""

# Start interactive chat
npm run start -- chat

echo ""
echo "Chat session ended."
echo ""
echo "Press Enter to continue..."
read

# Step 3: One-shot Task Demo
echo "🤖 Step 3: One-shot Task Demo"
echo "=============================="
echo ""
echo "$ no-wing q-task \"analyze current AWS Lambda functions\""
echo ""
npm run start -- q-task "analyze current AWS Lambda functions"
echo ""
echo "Press Enter to continue..."
read

# Step 4: Check Q's Updated Status
echo "📊 Step 4: Q's Updated Status"
echo "=============================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run start -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 5: Check Git History
echo "📝 Step 5: Check Q's Git Commits"
echo "================================="
echo ""
echo "$ git log --oneline -5 --grep=\"Q\""
echo ""
git log --oneline -5 --grep="Q" || echo "ℹ️  No Q commits found yet"
echo ""
echo "Press Enter to continue..."
read

# Step 6: Verify AWS Resources (if available)
echo "☁️ Step 6: Check AWS Resources"
echo "==============================="
echo ""
echo "$ aws lambda list-functions --query 'Functions[?starts_with(FunctionName, \`q-\`)]' --output table"
echo ""
if command -v aws >/dev/null 2>&1; then
    aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `q-`)]' --output table 2>/dev/null || echo "ℹ️  No Q-created functions found or AWS CLI not configured"
else
    echo "ℹ️  AWS CLI not available - skipping resource check"
fi
echo ""

# Demo Complete
echo "🎉 Demo Complete!"
echo "================="
echo ""
echo "✅ What we demonstrated:"
echo "   • Interactive chat with Q AI teammate"
echo "   • Q can analyze and create AWS infrastructure"
echo "   • Q commits work to Git with proper attribution"
echo "   • Q operates within security boundaries"
echo "   • SAM-based Infrastructure as Code approach"
echo ""
echo "🛫 Key Features Shown:"
echo "   • Natural language interaction with AI"
echo "   • Real AWS resource creation (when configured)"
echo "   • Git integration with AI agent commits"
echo "   • Progressive capability system"
echo "   • Professional development workflow"
echo ""
echo "🚀 Next Steps:"
echo "   • Configure AWS CLI for real resource creation"
echo "   • Try: no-wing init --name='Your Name'"
echo "   • Start chatting: no-wing chat"
echo ""
echo "🛫 Ready to fly with your AI development teammate!"
