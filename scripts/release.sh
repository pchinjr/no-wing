#!/bin/bash

# no-wing Release Script
set -e

echo "🛫 no-wing Release Process"
echo "=========================="

# Check if we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
    echo "❌ Must be on main branch to release. Currently on: $BRANCH"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory must be clean to release"
    git status --short
    exit 1
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: $CURRENT_VERSION"

# Ask for new version
echo ""
echo "Select release type:"
echo "1) Patch (bug fixes)"
echo "2) Minor (new features)"
echo "3) Major (breaking changes)"
echo "4) Custom version"
read -p "Choice (1-4): " CHOICE

case $CHOICE in
    1)
        NEW_VERSION=$(npm version patch --no-git-tag-version)
        ;;
    2)
        NEW_VERSION=$(npm version minor --no-git-tag-version)
        ;;
    3)
        NEW_VERSION=$(npm version major --no-git-tag-version)
        ;;
    4)
        read -p "Enter version (e.g., 1.2.3): " CUSTOM_VERSION
        npm version $CUSTOM_VERSION --no-git-tag-version
        NEW_VERSION="v$CUSTOM_VERSION"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "📦 New version: $NEW_VERSION"

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

# Build project
echo ""
echo "🔨 Building project..."
npm run build

# Update documentation
echo ""
echo "📝 Updating documentation..."
# Update version in README if needed
sed -i.bak "s/version-[0-9]\+\.[0-9]\+\.[0-9]\+/version-${NEW_VERSION#v}/g" README.md && rm README.md.bak || true

# Commit version bump
echo ""
echo "📝 Committing version bump..."
git add package.json package-lock.json README.md
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
echo ""
echo "🏷️  Creating git tag..."
git tag -a "$NEW_VERSION" -m "Release $NEW_VERSION"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main
git push origin "$NEW_VERSION"

# Publish to npm
echo ""
read -p "📦 Publish to npm? (y/N): " PUBLISH
if [ "$PUBLISH" = "y" ] || [ "$PUBLISH" = "Y" ]; then
    echo "📦 Publishing to npm..."
    npm publish
    echo "✅ Published to npm successfully!"
else
    echo "⏭️  Skipping npm publish"
fi

# Build and push Docker image
echo ""
read -p "🐳 Build and push Docker image? (y/N): " DOCKER
if [ "$DOCKER" = "y" ] || [ "$DOCKER" = "Y" ]; then
    echo "🐳 Building Docker image..."
    docker build -t pchinjr/no-wing:latest .
    docker build -t pchinjr/no-wing:${NEW_VERSION#v} .
    
    echo "🐳 Pushing Docker image..."
    docker push pchinjr/no-wing:latest
    docker push pchinjr/no-wing:${NEW_VERSION#v}
    echo "✅ Docker image pushed successfully!"
else
    echo "⏭️  Skipping Docker build"
fi

echo ""
echo "🎉 Release $NEW_VERSION completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   • Update GitHub release notes"
echo "   • Announce on social media"
echo "   • Update documentation site"
echo "   • Notify community"
echo ""
echo "🛫 no-wing $NEW_VERSION is ready to fly!"
