#!/bin/bash
# No-wing Installation Script

set -e

echo "🚀 Installing No-wing CLI..."

# Check if Deno is installed
DENO_PATH=""
if command -v deno &> /dev/null; then
    DENO_PATH=$(command -v deno)
elif [ -n "$SUDO_USER" ] && [ -f "/home/$SUDO_USER/.deno/bin/deno" ]; then
    # Check user's Deno installation when running with sudo
    DENO_PATH="/home/$SUDO_USER/.deno/bin/deno"
elif [ -f "$HOME/.deno/bin/deno" ]; then
    # Check current user's Deno installation
    DENO_PATH="$HOME/.deno/bin/deno"
fi

if [ -z "$DENO_PATH" ]; then
    echo "❌ Deno is required but not installed."
    echo "Please install Deno first: https://deno.land/manual/getting_started/installation"
    exit 1
fi

echo "✅ Found Deno at: $DENO_PATH"

# Determine installation method and source directory
INSTALL_METHOD="user"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "$1" = "--system" ]; then
    INSTALL_METHOD="system"
    echo "📦 Installing system-wide (requires sudo)"
    BIN_DIR="/usr/local/bin"
elif [ "$1" = "--user" ]; then
    INSTALL_METHOD="user"
    echo "📦 Installing for current user"
    BIN_DIR="$HOME/.local/bin"
    mkdir -p "$BIN_DIR"
else
    echo "📦 Installing for current user (use --system for system-wide)"
    BIN_DIR="$HOME/.local/bin"
    mkdir -p "$BIN_DIR"
fi

echo "📁 Source directory: $SOURCE_DIR"
echo "📁 Binary directory: $BIN_DIR"

# Create wrapper script that runs from source
echo "🔗 Creating system command..."
WRAPPER_CONTENT="#!/bin/bash
# No-wing System Wrapper
cd \"$SOURCE_DIR\" && \"$DENO_PATH\" run --allow-all main.ts \"\$@\""

if [ "$INSTALL_METHOD" = "system" ]; then
    echo "$WRAPPER_CONTENT" | sudo tee "$BIN_DIR/no-wing" > /dev/null
    sudo chmod +x "$BIN_DIR/no-wing"
else
    echo "$WRAPPER_CONTENT" > "$BIN_DIR/no-wing"
    chmod +x "$BIN_DIR/no-wing"
fi

# Test installation
echo "🧪 Testing installation..."
if "$BIN_DIR/no-wing" help > /dev/null 2>&1; then
    echo "✅ Installation successful!"
    echo ""
    echo "🎉 No-wing is now installed and ready to use!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: no-wing setup --profile your-aws-profile"
    echo "  2. Test: no-wing status"
    echo "  3. Help: no-wing help"
    echo ""
    if [ "$INSTALL_METHOD" = "user" ]; then
        echo "Note: Make sure $BIN_DIR is in your PATH"
        if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
            echo "Add this to your ~/.bashrc or ~/.zshrc:"
            echo "  export PATH=\"\$PATH:$BIN_DIR\""
        fi
    fi
else
    echo "❌ Installation test failed"
    exit 1
fi
