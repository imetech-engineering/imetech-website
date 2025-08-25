# 🚀 Push IMeTech Website to GitHub

This guide will help you push your improved website to the existing GitHub repository at [https://github.com/imetech-engineering/imetech-website](https://github.com/imetech-engineering/imetech-website).

## 📋 Prerequisites

1. **Git Installation**: You need Git installed on your computer
2. **GitHub Account**: Access to the imetech-engineering organization
3. **Authentication**: GitHub credentials or personal access token

## 🛠️ Step-by-Step Instructions

### Option 1: Use the Automated Scripts (Recommended)

I've created two scripts for you:

1. **`push-to-github.ps1`** - PowerShell script (Windows)
2. **`push-to-github.bat`** - Batch file (Windows)

#### To use the scripts:

1. **Right-click** on either script file
2. **Select "Run as administrator"** or just double-click
3. **Follow the prompts** - the script will guide you through everything
4. **Type "yes"** when asked to confirm the force push

### Option 2: Manual Git Commands

If you prefer to run commands manually:

```bash
# 1. Initialize Git repository (if not already done)
git init

# 2. Add your GitHub repository as remote
git remote add origin https://github.com/imetech-engineering/imetech-website.git

# 3. Add all files
git add .

# 4. Commit changes
git commit -m "Update website with improved blog styling and modern design"

# 5. Force push to replace existing content
git push -f origin main
```

## ⚠️ Important Notes

- **Force Push**: This will completely replace the existing repository content
- **Backup**: The existing content will be overwritten
- **Authentication**: You may need to enter your GitHub credentials
- **Branch**: We're pushing to the `main` branch

## 🔐 GitHub Authentication

If you're asked for credentials:

1. **Username**: Your GitHub username
2. **Password**: Use a **Personal Access Token** (not your GitHub password)
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Generate a new token with `repo` permissions
   - Use this token as your password

## 🌐 After Successful Push

Your website will be available at:
- **Repository**: https://github.com/imetech-engineering/imetech-website
- **GitHub Pages**: https://imetech-engineering.github.io/imetech-website/ (if enabled)

## 🆘 Troubleshooting

### Git not found
- Install Git from: https://git-scm.com/download/win
- Restart your terminal after installation

### Authentication failed
- Check your GitHub credentials
- Use a Personal Access Token instead of password
- Ensure you have access to the imetech-engineering organization

### Push failed
- Check your internet connection
- Verify the repository URL is correct
- Ensure you have write permissions to the repository

## 📞 Need Help?

If you encounter any issues:
1. Check the error messages in the terminal
2. Verify your GitHub permissions
3. Make sure you're in the correct directory (imetech-website folder)

---

**Good luck! 🎉** Your improved website will look great on GitHub!
