@echo off
echo 🚀 IMeTech Website - GitHub Push Script
echo =========================================
echo.

REM Check if Git is installed
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    echo After installation, restart and run this script again.
    pause
    exit /b 1
)

echo ✅ Git found
echo.

REM Check if we're in the right directory
if not exist "index.html" (
    echo ❌ Please run this script from the imetech-website folder!
    pause
    exit /b 1
)

echo 📁 Current directory: %CD%
echo.

REM Initialize git repository (if not already done)
if not exist ".git" (
    echo 🔧 Initializing Git repository...
    git init
    echo ✅ Git repository initialized
) else (
    echo ✅ Git repository already exists
)
echo.

REM Add the remote origin
echo 🔗 Adding GitHub remote...
git remote remove origin 2>nul
git remote add origin https://github.com/imetech-engineering/imetech-website.git
echo ✅ GitHub remote added
echo.

REM Add all files to git
echo 📦 Adding all files to Git...
git add .
echo ✅ All files added
echo.

REM Commit the changes
echo 💾 Committing changes...
set commitMessage=Update website with improved blog styling and modern design - %date% %time%
echo Commit message: %commitMessage%
git commit -m "%commitMessage%"
echo.

REM Force push to replace existing content
echo 🚀 Force pushing to GitHub (this will replace existing content)...
echo ⚠️  WARNING: This will completely replace the existing repository content!
set /p confirm=Are you sure you want to continue? (yes/no): 

if /i "%confirm%"=="yes" (
    echo 🔄 Force pushing to main branch...
    git push -f origin main
    
    if %errorlevel% equ 0 (
        echo ✅ Successfully pushed to GitHub!
        echo 🌐 Your website is now live at: https://imetech-engineering.github.io/imetech-website/
    ) else (
        echo ❌ Failed to push to GitHub. Please check your credentials.
        echo 💡 You may need to authenticate with GitHub first.
    )
) else (
    echo ❌ Push cancelled by user
)

echo.
echo 🎉 Script completed!
pause
