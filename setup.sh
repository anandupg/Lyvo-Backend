#!/bin/bash

echo "🚀 Lyvo Setup Script"
echo "===================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm is installed"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd user-service
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file for backend..."
    cp env.example .env
    echo "✅ Backend .env file created. Please update it with your configuration."
else
    echo "✅ Backend .env file already exists."
fi

cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd "../Lyvo frontend"
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file for frontend..."
    cp env.example .env
    echo "✅ Frontend .env file created. Please update it with your configuration."
else
    echo "✅ Frontend .env file already exists."
fi

cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up MongoDB Atlas (see MONGODB_ATLAS_SETUP.md)"
echo "2. Set up Google OAuth (see GOOGLE_OAUTH_SETUP.md)"
echo "3. Update your .env files with the correct values"
echo "4. Start the backend: cd user-service && npm run dev"
echo "5. Start the frontend: cd 'Lyvo frontend' && npm run dev"
echo ""
echo "📚 Documentation:"
echo "- MongoDB Atlas Setup: MONGODB_ATLAS_SETUP.md"
echo "- Google OAuth Setup: GOOGLE_OAUTH_SETUP.md"
echo "" 