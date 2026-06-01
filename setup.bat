#!/bin/bash
# Windows setup script for Fazdad development environment

@echo off
echo.
echo 🚀 Setting up Fazdad development environment...
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

if exist .env (
    echo ✅ .env file already exists
) else (
    echo 📝 Creating .env file from .env.example...
    copy .env.example .env
    echo ⚠️  Please update .env with your backend URL
)

echo.
echo ✅ Setup complete!
echo.
echo 📖 Next steps:
echo 1. Update .env with your backend API URL
echo 2. Run 'npm start' to start development server
echo 3. Read ARCHITECTURE.md for project structure
echo.
echo 🔗 Available commands:
echo   npm start    - Start development server
echo   npm run dev  - Watch mode with rebuild
echo   npm run build - Build for production
echo.
pause
