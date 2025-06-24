#!/bin/bash

# no-wing MVP Demo - Local Version (No GitHub Integration)
# Shows Q's capabilities without requiring GitHub setup

set -e

echo "🛫 no-wing MVP Local Demo"
echo "========================="
echo ""
echo "This demo shows Q's progression through capability levels:"
echo "• Observer Level: Read and analyze"
echo "• Assistant Level: Update and modify" 
echo "• Partner Level: Create and design"
echo ""
echo "Note: This version skips GitHub integration and focuses on Q's core capabilities."
echo ""
echo "Press Enter to start the demo..."
read

echo "📦 Building no-wing..."
npm run build
echo ""

# Step 1: Check Q's current status
echo "📊 Step 1: Check Q's Current Status"
echo "===================================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""
echo "✅ Q is ready and operational!"
echo ""
echo "Press Enter to continue..."
read

# Step 2: Q Observer Level Task
echo "🔍 Step 2: Q Observer Level - Analysis Task"
echo "============================================"
echo ""
echo "$ no-wing q-task \"analyze the current system performance\""
echo ""
npm run dev -- q-task "analyze the current system performance"
echo ""
echo "✅ Q successfully analyzed the system as an Observer!"
echo ""
echo "Press Enter to continue..."
read

# Step 3: Q Assistant Level Task
echo "🔧 Step 3: Q Assistant Level - Modification Task"
echo "================================================="
echo ""
echo "$ no-wing q-task \"optimize the Lambda function configuration\""
echo ""
npm run dev -- q-task "optimize the Lambda function configuration"
echo ""
echo "✅ Q successfully modified configurations as an Assistant!"
echo ""
echo "Press Enter to continue..."
read

# Step 4: Q Partner Level Task
echo "🏗️ Step 4: Q Partner Level - Creation Task"
echo "==========================================="
echo ""
echo "$ no-wing q-task \"create a new microservice for user management\""
echo ""
npm run dev -- q-task "create a new microservice for user management"
echo ""
echo "✅ Q successfully created new resources as a Partner!"
echo ""
echo "Press Enter to continue..."
read

# Step 5: Check Q's Git History
echo "📝 Step 5: Q's Git Commit History"
echo "=================================="
echo ""
echo "$ no-wing q-history --limit 5"
echo ""
npm run dev -- q-history --limit 5
echo ""
echo "✅ Q's commits are properly attributed and tracked!"
echo ""
echo "Press Enter to continue..."
read

# Step 6: Final Status Check
echo "🎯 Step 6: Final Q Status Check"
echo "==============================="
echo ""
echo "$ no-wing q-status"
echo ""
npm run dev -- q-status
echo ""

echo ""
echo "🎉 MVP Demo Complete!"
echo "===================="
echo ""
echo "✅ What we demonstrated:"
echo "   • Q has its own identity and progressive capabilities"
echo "   • Q can perform tasks at Observer, Assistant, and Partner levels"
echo "   • Q makes Git commits with proper attribution"
echo "   • Q's performance is tracked and improves over time"
echo ""
echo "🚀 Next Steps:"
echo "   • Deploy to real AWS infrastructure: ./deploy-minimal.sh dev your-email"
echo "   • Add GitHub integration for full automation"
echo "   • Onboard real development teams"
echo ""
echo "🛫 no-wing MVP is ready for production!"
