#!/bin/bash
# No-wing Installation Script

set -e

echo "🚀 Installing No-wing CLI..."

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is required but not installed."
    echo "Please install Deno first: https://deno.land/manual/getting_started/installation"
    exit 1
fi

# Determine installation method
INSTALL_METHOD="user"
if [ "$1" = "--system" ]; then
    INSTALL_METHOD="system"
    echo "📦 Installing system-wide (requires sudo)"
elif [ "$1" = "--user" ]; then
    INSTALL_METHOD="user"
    echo "📦 Installing for current user"
else
    echo "📦 Installing for current user (use --system for system-wide)"
fi

# Create installation directory
if [ "$INSTALL_METHOD" = "system" ]; then
    INSTALL_DIR="/opt/no-wing"
    BIN_DIR="/usr/local/bin"
    sudo mkdir -p "$INSTALL_DIR"
else
    INSTALL_DIR="$HOME/.local/share/no-wing"
    BIN_DIR="$HOME/.local/bin"
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
fi

echo "📁 Installation directory: $INSTALL_DIR"

# Copy source files
echo "📋 Copying source files..."
if [ "$INSTALL_METHOD" = "system" ]; then
    sudo cp -r src/ "$INSTALL_DIR/"
    sudo cp no-wing "$INSTALL_DIR/"
    sudo cp main.ts "$INSTALL_DIR/"
    sudo chmod +x "$INSTALL_DIR/no-wing"
else
    cp -r src/ "$INSTALL_DIR/"
    cp no-wing "$INSTALL_DIR/"
    cp main.ts "$INSTALL_DIR/"
    chmod +x "$INSTALL_DIR/no-wing"
fi

# Create wrapper script
echo "🔗 Creating system command..."
WRAPPER_CONTENT="#!/bin/bash
# No-wing System Wrapper
cd \"$INSTALL_DIR\" && ./no-wing \"\$@\""

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
