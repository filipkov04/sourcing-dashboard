# Sourcing Dashboard - Collaboration Workflow

## Overview
This document outlines how we work together on the sourcing-dashboard project to avoid conflicts and maintain clean code.

---

## Our Working Style

**Division of Work:** Each person works on separate features independently
- Filip works on Feature A
- Cofounder works on Feature B
- We sometimes overlap in work hours

**Goal:** Keep changes isolated until ready to merge, minimize conflicts, and maintain code quality.

---

## Git Workflow: Feature Branches

### The Basic Flow

```
main branch (production-ready code)
    ↓
feature/your-feature-name (your work)
    ↓
Pull Request → Review → Merge back to main
```

### Step-by-Step Process

#### 1. Starting New Work

Before starting a new feature, always sync with the latest code:

```bash
# Make sure you're on main
git checkout main

# Get the latest changes from GitHub
git pull origin main

# Create a new branch for your feature
git checkout -b feature/your-feature-name
```

**Branch Naming Convention:**
- `feature/factory-connection` - for new features
- `fix/login-bug` - for bug fixes
- `docs/api-documentation` - for documentation
- `refactor/auth-system` - for refactoring

#### 2. Working on Your Feature

As you work, commit your changes regularly:

```bash
# See what files changed
git status

# Add specific files (preferred over git add .)
git add app/components/FactoryList.tsx
git add app/api/factories/route.ts

# Commit with a clear message
git commit -m "Add factory list component with filtering"

# Push your branch to GitHub
git push origin feature/your-feature-name
```

**Commit Message Guidelines:**
- Use present tense: "Add feature" not "Added feature"
- Be specific: "Add login validation" not "Update auth"
- Keep it short (under 50 characters for the title)

#### 3. Staying Synced

If you're working on a feature for multiple days, sync with main regularly to avoid big conflicts:

```bash
# While on your feature branch
git checkout feature/your-feature-name

# Get latest main branch changes
git fetch origin main

# Merge main into your feature branch
git merge origin/main

# If there are conflicts, fix them and commit
git add .
git commit -m "Merge main into feature/your-feature-name"

# Push updated branch
git push origin feature/your-feature-name
```

**When to sync:** Daily if your cofounder merged changes to main.

#### 4. Creating a Pull Request

When your feature is ready:

1. **Push your final changes:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Go to GitHub:** https://github.com/filipkov04/sourcing-dashboard/pulls

3. **Click "New Pull Request"**

4. **Select:**
   - Base: `main`
   - Compare: `feature/your-feature-name`

5. **Write a good description:**
   ```
   ## What does this PR do?
   Adds factory connection interface with API integration

   ## What to test?
   - Go to /factories page
   - Click "Connect Factory"
   - Enter connection details
   - Verify connection tests successfully

   ## Screenshots (if applicable)
   [Add screenshots of UI changes]
   ```

6. **Request review from your cofounder**

#### 5. Reviewing Each Other's Code

When your cofounder creates a PR:

1. **Go to the PR on GitHub**
2. **Review the code:**
   - Does it follow our coding style?
   - Are there any bugs?
   - Is it well-tested?
   - Does it match the requirements?

3. **Leave comments:**
   - Ask questions if something is unclear
   - Suggest improvements
   - Approve if everything looks good

4. **Cofounder addresses feedback** (if any)

5. **Merge the PR** once approved

#### 6. After Merge: Clean Up

```bash
# Switch back to main
git checkout main

# Pull the merged changes
git pull origin main

# Delete your local feature branch (no longer needed)
git branch -d feature/your-feature-name

# Delete remote branch (optional, keeps repo clean)
git push origin --delete feature/your-feature-name
```

---

## Quick Reference Commands

### Starting Work
```bash
git checkout main
git pull origin main
git checkout -b feature/my-feature
```

### During Work
```bash
git status
git add <file>
git commit -m "Clear message"
git push origin feature/my-feature
```

### Staying Synced
```bash
git fetch origin main
git merge origin/main
```

### Finishing Work
```bash
# Push final changes
git push origin feature/my-feature
# Then create PR on GitHub
```

---

## Handling Conflicts

Conflicts happen when both people edit the same file. Here's how to resolve them:

### When You See a Conflict

```bash
# Git will tell you which files have conflicts
git status

# Open the conflicted file, you'll see:
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name

# Edit the file to keep the correct code
# Remove the <<<, ===, >>> markers
# Save the file

# Mark as resolved
git add <file>
git commit -m "Resolve merge conflict in <file>"
git push
```

### How to Avoid Conflicts

1. **Work on different files** when possible
2. **Communicate** if you need to edit the same file
3. **Sync regularly** with main (daily)
4. **Keep features small** (merge often, don't let branches live too long)

---

## Communication Guidelines

### Before Starting Work
- **Announce what you're working on** (Slack, Discord, etc.)
  - "I'm working on the factory connection UI today"
- **Check if anyone else is working on related files**

### During Work
- **Push your branch regularly** so your cofounder can see progress
- **Update if plans change**
  - "Actually working on the API instead of UI"

### When Blocked
- **Ask for help** if stuck for more than 30 minutes
- **Commit what you have** and explain the issue in the commit message

### Code Reviews
- **Be respectful** - "Consider adding error handling here" not "This is wrong"
- **Explain why** - "Let's use const instead of let because the value doesn't change"
- **Respond quickly** - Try to review PRs within 24 hours

---

## File Organization

To minimize conflicts, we organize our work:

### Directory Structure
```
sourcing-dashboard/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── dashboard/       # Main dashboard
│   ├── factories/       # Factory management
│   ├── orders/          # Order tracking
│   └── api/             # API routes
├── components/          # Reusable components
├── lib/                 # Utilities and helpers
└── public/              # Static assets
```

### Ownership Convention
- If you're working on a feature, you "own" those files until merged
- If your cofounder needs to edit your files, coordinate first
- Shared files (layout, config) require extra communication

---

## Project Status Tracking

### Using GitHub Issues (Recommended)

1. **Create issues for features/bugs:**
   - Go to https://github.com/filipkov04/sourcing-dashboard/issues
   - Click "New Issue"
   - Describe what needs to be done

2. **Assign issues:**
   - Assign yourself when you start work
   - This signals to your cofounder you're working on it

3. **Link PRs to issues:**
   - In PR description, write "Closes #5" (where 5 is the issue number)
   - PR will auto-close the issue when merged

### Simple Status Updates

Create a `STATUS.md` file or use GitHub Projects to track:
- What's in progress
- What's blocked
- What's next

Example:
```markdown
## In Progress
- Filip: Factory connection UI (feature/factory-ui)
- Cofounder: Order tracking API (feature/order-api)

## Up Next
- Dashboard analytics view
- Email notifications

## Blocked
- None
```

---

## When Things Go Wrong

### "I Accidentally Committed to Main"
```bash
# Undo the commit but keep changes
git reset HEAD~1

# Create feature branch
git checkout -b feature/my-feature

# Commit properly
git add .
git commit -m "Proper commit message"
git push origin feature/my-feature
```

### "I Need to Delete My Last Commit"
```bash
# If NOT pushed yet
git reset HEAD~1

# If already pushed (dangerous, avoid if possible)
# Create a new commit that undoes it instead
git revert HEAD
git push
```

### "My Branch Is Way Behind Main"
```bash
git checkout feature/my-branch
git fetch origin main
git merge origin/main
# Fix conflicts if any
git push origin feature/my-branch
```

### "I Made Changes to Wrong Branch"
```bash
# Stash your changes
git stash

# Switch to correct branch
git checkout correct-branch

# Apply changes
git stash pop
```

---

## Best Practices Summary

✅ **DO:**
- Create a new branch for each feature
- Commit often with clear messages
- Push your branch daily
- Sync with main regularly
- Review each other's code
- Communicate what you're working on
- Ask questions when unclear

❌ **DON'T:**
- Commit directly to main (except for tiny fixes)
- Use `git add .` blindly (check what you're adding)
- Let branches live for weeks without merging
- Force push (`git push -f`) unless absolutely necessary
- Work on same files without coordinating
- Merge your own PRs without review

---

## Tools That Can Help

### VS Code Extensions
- **GitLens** - See who changed what and when
- **Git Graph** - Visualize branches
- **GitHub Pull Requests** - Review PRs in VS Code

### GitHub Features
- **Issues** - Track todos
- **Projects** - Kanban board for tasks
- **Pull Requests** - Code review
- **Actions** - Automated testing (future)

---

## Quick Start Checklist

Starting a new feature? Follow this checklist:

- [ ] Pull latest main: `git checkout main && git pull origin main`
- [ ] Create feature branch: `git checkout -b feature/name`
- [ ] Announce what you're working on
- [ ] Make changes and commit regularly
- [ ] Push branch: `git push origin feature/name`
- [ ] Create Pull Request when ready
- [ ] Request review from cofounder
- [ ] Address feedback
- [ ] Merge PR
- [ ] Clean up branch locally

---

## Questions?

If something in this workflow doesn't work for you, let's discuss and update this document. This is meant to help us work efficiently, not slow us down.

**Last Updated:** 2026-01-29
