#!/bin/bash
# Setup script for Fazdad development environment

echo "🚀 Setting up Fazdad development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ -f .env ]; then
    echo "✅ .env file already exists"
else
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your backend URL"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Update .env with your backend API URL"
echo "2. Run 'npm start' to start development server"
echo "3. Read ARCHITECTURE.md for project structure"
echo ""
echo "🔗 Available commands:"
echo "  npm start    - Start development server"
echo "  npm run dev  - Watch mode with rebuild"
echo "  npm run build - Build for production"
