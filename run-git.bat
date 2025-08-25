@echo off
echo 🚀 Pushing IMeTech Website to GitHub...
echo.

REM Set Git path
set "GIT_PATH=C:\Program Files\Git\bin\git.exe"

REM Check if Git exists
if not exist "%GIT_PATH%" (
    echo ❌ Git not found at %GIT_PATH%
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git found at %GIT_PATH%
echo.

REM Initialize git repository
echo 🔧 Initializing Git repository...
"%GIT_PATH%" init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize Git repository
    pause
    exit /b 1
)
echo ✅ Git repository initialized
echo.

REM Add remote origin
echo 🔗 Adding GitHub remote...
"%GIT_PATH%" remote remove origin 2>nul
"%GIT_PATH%" remote add origin https://github.com/imetech-engineering/imetech-website.git
if %errorlevel% neq 0 (
    echo ❌ Failed to add remote origin
    pause
    exit /b 1
)
echo ✅ GitHub remote added
echo.

REM Add all files
echo 📦 Adding all files to Git...
"%GIT_PATH%" add .
if %errorlevel% neq 0 (
    echo ❌ Failed to add files
    pause
    exit /b 1
)
echo ✅ All files added
echo.

REM Commit changes
echo 💾 Committing changes...
"%GIT_PATH%" commit -m "Update website with improved blog styling and modern design"
if %errorlevel% neq 0 (
    echo ❌ Failed to commit changes
    pause
    exit /b 1
)
echo ✅ Changes committed
echo.

REM Force push
echo 🚀 Force pushing to GitHub (this will replace existing content)...
echo ⚠️  WARNING: This will completely replace the existing repository content!
set /p confirm=Are you sure you want to continue? (yes/no): 

if /i "%confirm%"=="yes" (
    echo 🔄 Force pushing to main branch...
    "%GIT_PATH%" push -f origin main
    
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
