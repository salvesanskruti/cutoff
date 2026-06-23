@echo off
REM MERN Stack Setup Script for Windows
REM Run this to set up the entire project locally

echo.
echo  CutoffAI MERN Setup Script
echo  ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  Node.js not found. Please install from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo  Node.js found: %NODE_VERSION%
echo.

REM Backend Setup
echo  Setting up Backend...
cd backend

if not exist ".env" (
    echo   Creating .env from template...
    copy .env.example .env
    echo   Update backend/.env with your MongoDB URI
)

echo   Installing dependencies...
call npm install

echo.
echo  Backend setup complete!
echo    Next: cd backend ^&^& npm run dev
echo.

REM Frontend Setup
cd ..\frontend

echo  Setting up Frontend...
echo   Installing dependencies...
call npm install

echo.
echo  Frontend setup complete!
echo    Next: cd frontend ^&^& npm run dev
echo.

cd ..

echo  ================================================
echo  Setup Complete!
echo.
echo  To run the app:
echo.
echo  Terminal 1 - Backend:
echo    cd backend
echo    npm run seed    :: (first time only)
echo    npm run dev
echo.
echo  Terminal 2 - Frontend:
echo    cd frontend
echo    npm run dev
echo.
echo  Terminal 3 - Python ML (optional):
echo    uvicorn api.main:app --reload --port 8000
echo.
echo  Then open: http://localhost:3000
echo.
echo  For more info, see MERN_CONVERSION_GUIDE.md
echo  ================================================
echo.
pause
