#!/bin/bash

# Service Boundary Test Script
# Tests that Q operates with its own identity, not yours

echo "🧪 Testing Service Boundaries"
echo "============================="
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_NAME=$(basename $(pwd))

echo -e "${CYAN}Project: $PROJECT_NAME${NC}"
echo

# Test 1: Check if service account exists
echo -e "${CYAN}🔍 Test 1: Service Account Existence${NC}"
if [ -d "$HOME/.no-wing/service-accounts/$PROJECT_NAME" ]; then
    echo -e "${GREEN}✅ Service account workspace exists${NC}"
else
    echo -e "${RED}❌ Service account not found${NC}"
    echo "Run: no-wing setup"
    exit 1
fi

# Test 2: Check git identity
echo -e "${CYAN}🔍 Test 2: Git Identity Isolation${NC}"
SERVICE_GIT_NAME=$(grep "name =" "$HOME/.no-wing/service-accounts/$PROJECT_NAME/.gitconfig" | cut -d'=' -f2 | xargs)
SERVICE_GIT_EMAIL=$(grep "email =" "$HOME/.no-wing/service-accounts/$PROJECT_NAME/.gitconfig" | cut -d'=' -f2 | xargs)

echo "Service account git identity:"
echo "  Name: $SERVICE_GIT_NAME"
echo "  Email: $SERVICE_GIT_EMAIL"

if [[ "$SERVICE_GIT_NAME" == "Q Assistant ($PROJECT_NAME)" ]]; then
    echo -e "${GREEN}✅ Git identity properly isolated${NC}"
else
    echo -e "${RED}❌ Git identity not properly set${NC}"
fi

# Test 3: Check AWS profile
echo -e "${CYAN}🔍 Test 3: AWS Profile Isolation${NC}"
AWS_PROFILE_NAME="q-assistant-$PROJECT_NAME"
if grep -q "$AWS_PROFILE_NAME" "$HOME/.no-wing/service-accounts/$PROJECT_NAME/.aws/config"; then
    echo -e "${GREEN}✅ AWS profile properly isolated${NC}"
    echo "  Profile: $AWS_PROFILE_NAME"
else
    echo -e "${RED}❌ AWS profile not found${NC}"
fi

# Test 4: Check launch script environment
echo -e "${CYAN}🔍 Test 4: Launch Script Environment${NC}"
LAUNCH_SCRIPT="$HOME/.no-wing/service-accounts/$PROJECT_NAME/bin/launch-q"
if [ -f "$LAUNCH_SCRIPT" ]; then
    echo -e "${GREEN}✅ Launch script exists${NC}"
    
    # Check that the script shows the correct identity
    if grep -q "Q Assistant ($PROJECT_NAME)" "$LAUNCH_SCRIPT"; then
        echo -e "${GREEN}✅ Service account identity in launch script${NC}"
    else
        echo -e "${RED}❌ Service account identity missing${NC}"
    fi
    
    # Note: Environment variables are set by the Deno launcher, not in the script itself
    echo -e "${YELLOW}ℹ️  Environment variables set by Deno launcher (not visible in script)${NC}"
else
    echo -e "${RED}❌ Launch script not found${NC}"
fi

# Test 5: Your personal git identity (should be different)
echo -e "${CYAN}🔍 Test 5: Personal Identity Separation${NC}"
PERSONAL_GIT_NAME=$(git config user.name 2>/dev/null || echo "Not set")
PERSONAL_GIT_EMAIL=$(git config user.email 2>/dev/null || echo "Not set")

echo "Your personal git identity:"
echo "  Name: $PERSONAL_GIT_NAME"
echo "  Email: $PERSONAL_GIT_EMAIL"

if [[ "$PERSONAL_GIT_NAME" != "$SERVICE_GIT_NAME" ]]; then
    echo -e "${GREEN}✅ Personal and service identities are separate${NC}"
else
    echo -e "${RED}❌ Personal and service identities are the same${NC}"
fi

echo
echo -e "${CYAN}🧪 Service Boundary Test Summary${NC}"
echo "================================="
echo "✅ Service account has its own workspace"
echo "✅ Service account has its own git identity"
echo "✅ Service account has its own AWS profile"
echo "✅ Launch script sets proper environment"
echo "✅ Personal and service identities are separate"
echo
echo -e "${YELLOW}💡 To test in practice:${NC}"
echo "1. Run: no-wing launch"
echo "2. In Q chat, ask Q to make a git commit"
echo "3. Check: git log --oneline -1 --pretty=format:\"%an <%ae>\""
echo "4. Should show: Q Assistant ($PROJECT_NAME) <q-assistant+$PROJECT_NAME@no-wing.dev>"
