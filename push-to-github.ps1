# IMeTech Website - Push to GitHub Script
# This script will push your improved website to the existing GitHub repository

Write-Host "🚀 IMeTech Website - GitHub Push Script" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if Git is installed
try {
    $gitVersion = git --version
    Write-Host "✅ Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "index.html")) {
    Write-Host "❌ Please run this script from the imetech-website folder!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📁 Current directory: $(Get-Location)" -ForegroundColor Cyan

# Initialize git repository (if not already done)
if (-not (Test-Path ".git")) {
    Write-Host "🔧 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Add the remote origin (your GitHub repository)
Write-Host "🔗 Adding GitHub remote..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/imetech-engineering/imetech-website.git
Write-Host "✅ GitHub remote added" -ForegroundColor Green

# Add all files to git
Write-Host "📦 Adding all files to Git..." -ForegroundColor Yellow
git add .
Write-Host "✅ All files added" -ForegroundColor Green

# Check what files are staged
Write-Host "📋 Files to be committed:" -ForegroundColor Cyan
git status --porcelain | ForEach-Object { Write-Host "  $_" -ForegroundColor White }

# Commit the changes
$commitMessage = "Update website with improved blog styling and modern design - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
Write-Host "Commit message: $commitMessage" -ForegroundColor Cyan
git commit -m $commitMessage

# Force push to replace existing content
Write-Host "🚀 Force pushing to GitHub (this will replace existing content)..." -ForegroundColor Yellow
Write-Host "⚠️  WARNING: This will completely replace the existing repository content!" -ForegroundColor Red
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -eq "yes" -or $confirm -eq "y") {
    Write-Host "🔄 Force pushing to main branch..." -ForegroundColor Yellow
    git push -f origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🌐 Your website is now live at: https://imetech-engineering.github.io/imetech-website/" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to push to GitHub. Please check your credentials." -ForegroundColor Red
        Write-Host "💡 You may need to authenticate with GitHub first." -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Push cancelled by user" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Script completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"
