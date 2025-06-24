#!/bin/bash

# no-wing MVP Happy Path Demo
# Demonstrates Q's progressive capabilities from Observer → Assistant → Partner

set -e

echo "🛫 no-wing MVP Happy Path Demo"
echo "========================================"
echo ""
echo "This demo shows Q's core capabilities:"
echo "• Q creates real AWS Lambda functions"
echo "• Q commits to Git as proper AI developer"
echo "• Q has progressive permissions and security"
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
npm run dev -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 2: Q Analysis Task (Observer Level)
echo "🔍 Step 2: Q Analysis Task (Observer Level)"
echo "============================================"
echo ""
echo "$ no-wing q-task \"analyze current Lambda functions\""
echo ""
npm run dev -- q-task "analyze current Lambda functions"
echo ""
echo "Press Enter to continue..."
read

# Step 3: Q Creation Task (Partner Level)
echo "🏗️ Step 3: Q Creation Task (Partner Level)"
echo "==========================================="
echo ""
echo "$ no-wing q-task \"create a Lambda function for user authentication\""
echo ""
npm run dev -- q-task "create a Lambda function for user authentication"
echo ""
echo "Press Enter to continue..."
read

# Step 4: Verify Q's Work in AWS
echo "✅ Step 4: Verify Q's Work in AWS"
echo "=================================="
echo ""
echo "$ aws lambda list-functions --query 'Functions[?starts_with(FunctionName, \`q-\`)]'"
echo ""
aws lambda list-functions --query 'Functions[?starts_with(FunctionName, `q-`)]' || echo "⚠️  AWS CLI not configured or no Q functions found"
echo ""
echo "Press Enter to continue..."
read

# Step 5: Check Q's Git Commits
echo "📝 Step 5: Check Q's Git Commits"
echo "================================="
echo ""
echo "$ git log --oneline -5 --author=\"Q (AI Agent\""
echo ""
git log --oneline -5 --author="Q (AI Agent" || echo "ℹ️  No Q commits found yet"
echo ""
echo "Press Enter to continue..."
read

# Step 6: Q Status After Tasks
echo "📊 Step 6: Q's Updated Status"
echo "=============================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""

echo "🎉 Demo Complete!"
echo "================="
echo ""
echo "✅ What we demonstrated:"
echo "   • Q analyzed existing AWS infrastructure"
echo "   • Q created a real Lambda function with IAM role"
echo "   • Q committed work to Git as proper AI developer"
echo "   • Q operates within security boundaries"
echo ""
echo "🛫 Q is ready to be your autonomous AWS development teammate!"
echo ""
echo "✅ Q has been created with Observer level capabilities!"
echo ""
echo "Press Enter to continue..."
read

# Step 2: Check Q's initial status
echo "📊 Step 2: Check Q's Initial Status"
echo "===================================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 3: Observer Level Tasks
echo "🔍 Step 3: Observer Level Tasks"
echo "==============================="
echo ""
echo "Q starts as an Observer and can read/analyze information."
echo ""

echo "Task 1: Analyze Lambda function logs"
echo "$ no-wing q-task \"analyze the Lambda function logs\""
echo ""
npm run dev -- q-task "analyze the Lambda function logs"
echo ""
echo "Press Enter for next task..."
read

echo "Task 2: Read function configuration"
echo "$ no-wing q-task \"read function configuration info\""
echo ""
npm run dev -- q-task "read function configuration info"
echo ""
echo "Press Enter for next task..."
read

echo "Task 3: Check performance metrics (this should advance Q to Assistant)"
echo "$ no-wing q-task \"check function performance metrics\""
echo ""
npm run dev -- q-task "check function performance metrics"
echo ""
echo "🎉 Q should now be an Assistant! Let's check..."
echo ""
echo "Press Enter to continue..."
read

# Step 4: Check Q's advancement
echo "📈 Step 4: Q's Advancement to Assistant Level"
echo "=============================================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 5: Assistant Level Tasks
echo "🔧 Step 5: Assistant Level Tasks"
echo "================================"
echo ""
echo "Q can now modify configurations and deploy changes."
echo ""

echo "Task 1: Update Lambda function timeout"
echo "$ no-wing q-task \"update the Lambda function timeout\""
echo ""
npm run dev -- q-task "update the Lambda function timeout"
echo ""
echo "Press Enter for next task..."
read

echo "Task 2: Modify memory allocation"
echo "$ no-wing q-task \"modify the function memory allocation\""
echo ""
npm run dev -- q-task "modify the function memory allocation"
echo ""
echo "Press Enter for next task..."
read

echo "Task 3: Configure environment variables"
echo "$ no-wing q-task \"configure environment variables\""
echo ""
npm run dev -- q-task "configure environment variables"
echo ""
echo "Press Enter for next task..."
read

echo "Task 4: Deploy configuration changes"
echo "$ no-wing q-task \"deploy configuration changes\""
echo ""
npm run dev -- q-task "deploy configuration changes"
echo ""
echo "Press Enter for next task..."
read

echo "Task 5: Update function metadata (this should advance Q to Partner)"
echo "$ no-wing q-task \"update function metadata\""
echo ""
npm run dev -- q-task "update function metadata"
echo ""
echo "🎉 Q should now be a Partner! Let's check..."
echo ""
echo "Press Enter to continue..."
read

# Step 6: Check Q's final advancement
echo "🚀 Step 6: Q's Advancement to Partner Level"
echo "==========================================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""
echo "Press Enter to continue..."
read

# Step 7: Partner Level Tasks
echo "🏗️ Step 7: Partner Level Tasks"
echo "==============================="
echo ""
echo "Q can now create new resources and design architectures."
echo ""

echo "Task 1: Create a new authentication function"
echo "$ no-wing q-task \"create a new user authentication function\""
echo ""
npm run dev -- q-task "create a new user authentication function"
echo ""
echo "Press Enter for next task..."
read

echo "Task 2: Build a data processing pipeline"
echo "$ no-wing q-task \"build a data processing pipeline\""
echo ""
npm run dev -- q-task "build a data processing pipeline"
echo ""
echo "Press Enter for next task..."
read

echo "Task 3: Design a microservice architecture"
echo "$ no-wing q-task \"design a microservice architecture\""
echo ""
npm run dev -- q-task "design a microservice architecture"
echo ""
echo "Press Enter to continue..."
read

# Step 8: Final Status
echo "🎯 Step 8: Final Q Status"
echo "========================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""

# Demo Complete
echo "🎉 MVP Demo Complete!"
echo "===================="
echo ""
echo "✅ Q successfully progressed through all capability levels:"
echo "   Observer (3 tasks) → Assistant (5 tasks) → Partner (8+ tasks)"
echo ""
echo "🤖 Q says: \"I'm now a full development partner! I can:"
echo "   • Analyze and provide insights (Observer)"
echo "   • Update and deploy changes (Assistant)" 
echo "   • Create new resources and features (Partner)\""
echo ""
echo "🚀 This demonstrates the core value proposition:"
echo "   • Autonomous onboarding for both human and AI"
echo "   • Progressive trust and capability advancement"
echo "   • Verifiable AI teammate progression"
echo "   • Security-first approach with scoped permissions"
echo ""
echo "🛫 Ready to fly with no wings needed!"
echo ""
echo "Next steps for production:"
echo "• Real AWS integration with actual Lambda functions"
echo "• GitHub Actions integration for CI/CD"
echo "• Multi-environment support (dev/staging/prod)"
echo "• Team collaboration features"
echo ""
