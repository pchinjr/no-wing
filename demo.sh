#!/bin/bash

# no-wing Demo Script
# This demonstrates the key features of no-wing

echo "🛫 Welcome to no-wing Demo!"
echo "=========================================="
echo ""

echo "1. 🥚 First, let's try the Easter egg:"
echo "$ no-wing nothing"
echo ""
npm run dev -- nothing
echo ""
echo "=========================================="
echo ""

echo "2. 📋 Let's see the available commands:"
echo "$ no-wing --help"
echo ""
npm run dev -- --help
echo ""
echo "=========================================="
echo ""

echo "3. 🔧 Check the init command options:"
echo "$ no-wing init --help"
echo ""
npm run dev -- init --help
echo ""
echo "=========================================="
echo ""

echo "4. 📁 Project structure:"
echo "$ tree -I node_modules"
echo ""
tree -I node_modules || ls -la
echo ""
echo "=========================================="
echo ""

echo "5. 🧪 Run the tests:"
echo "$ npm test"
echo ""
npm test
echo ""
echo "=========================================="
echo ""

echo "🎉 Demo complete!"
echo ""
echo "🤖 Q says: 'This is just the beginning! With no-wing, Paul and I"
echo "   can onboard new developers and AI teammates automatically.'"
echo ""
echo "🚀 Next steps:"
echo "   • Set up AWS credentials and GitHub token"
echo "   • Run: no-wing init --name=YourName --repo=owner/repo"
echo "   • Watch as both you and Q get onboarded together!"
echo ""
echo "Let's fly 🛫 - no wings needed!"
