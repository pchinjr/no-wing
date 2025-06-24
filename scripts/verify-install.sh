#!/bin/bash

# no-wing Installation Verification Script

echo "🛫 no-wing Installation Verification"
echo "===================================="
echo ""

# Check Node.js version
echo "📋 Checking Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
    
    # Check if version is 18+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo "⚠️  Warning: Node.js 18+ recommended (current: $NODE_VERSION)"
    fi
else
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check npm
echo ""
echo "📋 Checking npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: v$NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

# Check no-wing installation
echo ""
echo "📋 Checking no-wing..."
if command -v no-wing >/dev/null 2>&1; then
    NOWNG_VERSION=$(no-wing --version 2>/dev/null || echo "unknown")
    echo "✅ no-wing: $NOWNG_VERSION"
else
    echo "❌ no-wing not found. Install with: npm install -g no-wing"
    exit 1
fi

# Check AWS CLI
echo ""
echo "📋 Checking AWS CLI..."
if command -v aws >/dev/null 2>&1; then
    AWS_VERSION=$(aws --version 2>&1 | cut -d' ' -f1)
    echo "✅ AWS CLI: $AWS_VERSION"
    
    # Check AWS credentials
    if aws sts get-caller-identity >/dev/null 2>&1; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
        echo "✅ AWS credentials configured (Account: $ACCOUNT_ID)"
    else
        echo "⚠️  AWS credentials not configured. Run: aws configure"
    fi
else
    echo "⚠️  AWS CLI not found. Install from: https://aws.amazon.com/cli/"
fi

# Check Git
echo ""
echo "📋 Checking Git..."
if command -v git >/dev/null 2>&1; then
    GIT_VERSION=$(git --version)
    echo "✅ Git: $GIT_VERSION"
    
    # Check Git configuration
    GIT_NAME=$(git config --global user.name 2>/dev/null || echo "")
    GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
    
    if [ -n "$GIT_NAME" ] && [ -n "$GIT_EMAIL" ]; then
        echo "✅ Git configured: $GIT_NAME <$GIT_EMAIL>"
    else
        echo "⚠️  Git not configured. Run:"
        echo "   git config --global user.name 'Your Name'"
        echo "   git config --global user.email 'your.email@example.com'"
    fi
else
    echo "⚠️  Git not found. Install from: https://git-scm.com/"
fi

# Check SAM CLI (optional)
echo ""
echo "📋 Checking SAM CLI (optional)..."
if command -v sam >/dev/null 2>&1; then
    SAM_VERSION=$(sam --version)
    echo "✅ SAM CLI: $SAM_VERSION"
else
    echo "ℹ️  SAM CLI not found (optional). Install from: https://aws.amazon.com/serverless/sam/"
fi

# Test no-wing functionality
echo ""
echo "📋 Testing no-wing functionality..."
if no-wing --help >/dev/null 2>&1; then
    echo "✅ no-wing CLI working"
else
    echo "❌ no-wing CLI not working"
    exit 1
fi

# Summary
echo ""
echo "📊 Installation Summary"
echo "======================"

REQUIRED_OK=true

# Required components
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js (required)"
else
    echo "❌ Node.js (required)"
    REQUIRED_OK=false
fi

if command -v npm >/dev/null 2>&1; then
    echo "✅ npm (required)"
else
    echo "❌ npm (required)"
    REQUIRED_OK=false
fi

if command -v no-wing >/dev/null 2>&1; then
    echo "✅ no-wing (required)"
else
    echo "❌ no-wing (required)"
    REQUIRED_OK=false
fi

# Optional but recommended
if command -v aws >/dev/null 2>&1; then
    echo "✅ AWS CLI (recommended)"
else
    echo "⚠️  AWS CLI (recommended)"
fi

if command -v git >/dev/null 2>&1; then
    echo "✅ Git (recommended)"
else
    echo "⚠️  Git (recommended)"
fi

if command -v sam >/dev/null 2>&1; then
    echo "✅ SAM CLI (optional)"
else
    echo "ℹ️  SAM CLI (optional)"
fi

echo ""
if [ "$REQUIRED_OK" = true ]; then
    echo "🎉 Installation verification successful!"
    echo ""
    echo "🚀 Ready to use no-wing! Try:"
    echo "   no-wing q-status"
    echo "   no-wing init --name='Your Name'"
    echo ""
    echo "🛫 Happy flying with no-wing!"
else
    echo "❌ Installation verification failed"
    echo "Please install missing required components and try again"
    exit 1
fi
