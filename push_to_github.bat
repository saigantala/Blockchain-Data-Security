@echo off
echo Initializing Git Repository...

:: Try to add common Git paths
set PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files (x86)\Git\cmd;%LOCALAPPDATA%\Programs\Git\cmd

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in your PATH.
    echo Please install Git from https://git-scm.com/downloads
    pause
    exit /b
)

echo Git found! Proceeding...

if not exist .git (
    git init
)

git add .
git commit -m "Complete Blockchain Security DApp with Command Center UI"
git branch -M main

echo.
echo Setting Remote Origin...
:: Remove old origin if it exists to avoid errors
git remote remove origin 2>nul
git remote add origin https://github.com/saigantala/Blockchain-Data-Security.git

echo.
echo Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Push failed. Please check your internet connection or if the repo exists.
) else (
    echo.
    echo SUCCESS: Code pushed to GitHub!
)

echo.
pause
