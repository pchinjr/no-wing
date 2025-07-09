#!/bin/bash

# Manual test script for no-wing
# This tests the core functionality manually

set -e

echo "🧪 Manual Testing Script for no-wing"
echo "===================================="
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_test() {
    echo -e "${CYAN}🔍 Test: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

# Test 1: Help command
print_test "Help command"
if deno run --allow-all deno/no-wing.ts --help > /dev/null 2>&1; then
    print_pass "Help command works"
else
    print_fail "Help command failed"
    exit 1
fi

# Test 2: Version command
print_test "Version command"
if deno run --allow-all deno/no-wing.ts --version > /dev/null 2>&1; then
    print_pass "Version command works"
else
    print_fail "Version command failed"
    exit 1
fi

# Test 3: Status command (should show not found)
print_test "Status command (before setup)"
cd /tmp && mkdir -p no-wing-manual-test && cd no-wing-manual-test
if deno run --allow-all /home/pchinjr/Code/no-wing/deno/no-wing.ts status | grep -q "Service account not found"; then
    print_pass "Status correctly shows not found"
else
    print_fail "Status command failed"
    exit 1
fi

# Test 4: Setup command
print_test "Setup command"
if deno run --allow-all /home/pchinjr/Code/no-wing/deno/no-wing.ts setup --force > /dev/null 2>&1; then
    print_pass "Setup command works"
else
    print_fail "Setup command failed"
    exit 1
fi

# Test 5: Status command (should show ready)
print_test "Status command (after setup)"
if deno run --allow-all /home/pchinjr/Code/no-wing/deno/no-wing.ts status | grep -q "Service account is ready"; then
    print_pass "Status correctly shows ready"
else
    print_fail "Status command failed after setup"
    exit 1
fi

# Test 6: Workspace verification
print_test "Workspace creation"
if [ -d "$HOME/.no-wing/service-accounts/no-wing-manual-test" ]; then
    print_pass "Workspace directory created"
else
    print_fail "Workspace directory not found"
    exit 1
fi

# Test 7: Git config verification
print_test "Git configuration"
if [ -f "$HOME/.no-wing/service-accounts/no-wing-manual-test/.gitconfig" ]; then
    print_pass "Git config file created"
else
    print_fail "Git config file not found"
    exit 1
fi

# Test 8: AWS config verification
print_test "AWS configuration"
if [ -f "$HOME/.no-wing/service-accounts/no-wing-manual-test/.aws/config" ]; then
    print_pass "AWS config file created"
else
    print_fail "AWS config file not found"
    exit 1
fi

# Test 9: Launch script verification
print_test "Launch script"
if [ -f "$HOME/.no-wing/service-accounts/no-wing-manual-test/bin/launch-q" ]; then
    print_pass "Launch script created"
else
    print_fail "Launch script not found"
    exit 1
fi

# Test 10: Cleanup command
print_test "Cleanup command"
if deno run --allow-all /home/pchinjr/Code/no-wing/deno/no-wing.ts cleanup --force > /dev/null 2>&1; then
    print_pass "Cleanup command works"
else
    print_fail "Cleanup command failed"
    exit 1
fi

# Test 11: Workspace cleanup verification
print_test "Workspace cleanup"
if [ ! -d "$HOME/.no-wing/service-accounts/no-wing-manual-test" ]; then
    print_pass "Workspace directory removed"
else
    print_fail "Workspace directory still exists"
    exit 1
fi

# Cleanup test directory
cd /tmp && rm -rf no-wing-manual-test

echo
echo -e "${GREEN}🎉 All manual tests passed!${NC}"
echo -e "${CYAN}✨ no-wing is working correctly${NC}"
