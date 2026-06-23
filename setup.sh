#!/bin/bash
# MERN Stack Setup Script
# Run this to set up the entire project locally

echo "🚀 CutoffAI MERN Setup Script"
echo "════════════════════════════════════════"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
cd backend || exit 1

if [ ! -f ".env" ]; then
    echo "  Creating .env from template..."
    cp .env.example .env
    echo "  ⚠️  Please update backend/.env with your MongoDB URI"
fi

echo "  Installing dependencies..."
npm install

echo ""
echo "✅ Backend setup complete!"
echo "   Next: cd backend && npm run dev"
echo ""

# Frontend Setup
cd ../frontend || exit 1

echo "📦 Setting up Frontend..."

echo "  Installing dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo "   Next: cd frontend && npm run dev"
echo ""

cd ..

echo "════════════════════════════════════════"
echo "🎉 Setup Complete!"
echo ""
echo "📋 To run the app:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend"
echo "  npm run seed    # (first time only, requires MongoDB running)"
echo "  npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Terminal 3 - Python ML (optional):"
echo "  uvicorn api.main:app --reload --port 8000"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📚 For more info, see MERN_CONVERSION_GUIDE.md"
echo "════════════════════════════════════════"
