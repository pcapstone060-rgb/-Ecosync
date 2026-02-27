@echo off
echo ========================================
echo   Starting Ecosync Project Locally
echo ========================================
echo.

REM Check if backend virtual environment exists
if not exist "backend\venv\Scripts\activate.bat" (
    echo [ERROR] Backend virtual environment not found!
    echo Please run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend dependencies not installed!
    echo Please run: cd frontend ^&^& npm install
    pause
    exit /b 1
)

echo [1/3] Configuring backend for local SQLite database...
cd backend

REM Create a local .env file for development
(
echo DATABASE_URL=sqlite:///./iot_system.db
echo SECRET_KEY=local-dev-secret-key-change-in-production
echo ALGORITHM=HS256
echo ACCESS_TOKEN_EXPIRE_MINUTES=30
echo EMAIL_USER=sreekar092004@gmail.com
echo EMAIL_PASS=orzh vstq rnsp gpwi
echo GEMINI_API_KEY=AIzaSyDcpyUQnn24R_jxjRveR0Mpvl8eofaK1iM
) > .env

echo [2/3] Starting Backend Server on port 8000 (SQLite Mode)...
start "Ecosync Backend" cmd /k "venv\Scripts\activate && set PYTHONIOENCODING=utf-8 && set DATABASE_URL=sqlite:///./iot_system.db && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak > nul

cd ..\frontend

echo [3/3] Starting Frontend Server...
start "Ecosync Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to open browser...
pause > nul

start http://localhost:5173

echo.
echo To stop servers, close the terminal windows.
echo.
