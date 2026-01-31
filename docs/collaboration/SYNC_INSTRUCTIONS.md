# How to Sync Your Local Project with GitHub

## The Problem
You can see files on GitHub but they're not showing up in your local project folder.

## The Solution
You need to **pull** (download) the latest changes from GitHub.

---

## Step-by-Step Instructions

### 1. Open Terminal/Command Line

**Mac/Linux:**
- Open Terminal application

**Windows:**
- Open Git Bash or Command Prompt

### 2. Navigate to Your Project

```bash
cd path/to/sourcing-dashboard
```

Replace `path/to/sourcing-dashboard` with wherever you have the project on your computer.

**Example:**
```bash
cd ~/Desktop/sourcing-dashboard
# or
cd /Users/yourname/projects/sourcing-dashboard
```

### 3. Pull the Latest Changes

```bash
git pull origin main
```

This command downloads all new files and changes from GitHub.

### 4. Verify the Files Are There

```bash
ls -la
```

You should now see:
- `plan.md`
- `COLLABORATION.md`
- `SYNC_INSTRUCTIONS.md` (this file)
- All other project files

---

## What Just Happened?

- **GitHub (cloud)** has the latest files
- **Your local computer** had an old version
- **`git pull`** synced your local copy with GitHub

---

## Do This Every Time Before Starting Work

**IMPORTANT:** Always pull before starting new work to get your cofounder's latest changes:

```bash
# Before starting work each day
git checkout main
git pull origin main

# Then create your feature branch
git checkout -b feature/your-new-feature
```

This prevents conflicts and ensures you're working with the latest code.

---

## Still Having Issues?

### "I don't have git installed"

**Mac:**
```bash
git --version
```
If not installed, download from: https://git-scm.com/

**Windows:**
Download Git for Windows: https://gitforwindows.org/

### "I don't have the project at all"

Clone it from GitHub:
```bash
cd ~/Desktop  # or wherever you want the project
git clone git@github.com:filipkov04/sourcing-dashboard.git
cd sourcing-dashboard
```

### "It says I have local changes"

```bash
# Save your changes first
git stash

# Pull the latest
git pull origin main

# Restore your changes
git stash pop
```

---

## Quick Reference

```bash
# See if you have the latest version
git status

# Download latest changes
git pull origin main

# See what files exist
ls -la

# Check current location
pwd
```

---

**Questions?** Ask your cofounder or check COLLABORATION.md for the full workflow.
