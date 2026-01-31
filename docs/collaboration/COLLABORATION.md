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

## 🚀 PROJECT DEVELOPMENT WORKFLOW - START TO FINISH

This section covers exactly how to build the dashboard systematically from Day 1, avoiding conflicts and building efficiently.

### Phase 0: Project Kickoff (Day 0)

**BEFORE anyone writes code, both cofounders must:**

#### 1. Review the Plan Together (30 minutes)
- [ ] Both read `plan.md` completely
- [ ] Discuss timeline: Weeks 1-8
- [ ] Agree on priorities
- [ ] Identify which phases to tackle first

#### 2. Break Down Phases into Tasks (1 hour)
Based on `plan.md`, create GitHub Issues for all major features:

**Phase 1 Tasks (Weeks 1-3): Foundation**
- [ ] Database schema design
- [ ] Authentication system
- [ ] Factory management (CRUD)
- [ ] Order management (CRUD)
- [ ] Basic dashboard layout

**Phase 2 Tasks (Weeks 4-5): Visualization**
- [ ] Progress tracking UI
- [ ] Charts and graphs
- [ ] Alert system
- [ ] Dashboard widgets

**Phase 3 Tasks (Weeks 6-8): Integration**
- [ ] API connection framework
- [ ] SAP/Oracle connectors
- [ ] File sharing system
- [ ] Webhook support

Create these as GitHub Issues: https://github.com/filipkov04/sourcing-dashboard/issues

#### 3. Decide on Shared Foundation (CRITICAL - 30 minutes)

**Some files MUST be created first and agreed upon by both:**

```
Foundation Files (Create Together in ONE session):
├── Database Schema (Prisma/schema)
├── TypeScript Types (lib/types.ts)
├── API Response Formats (lib/api-types.ts)
├── Authentication Setup
└── Basic Layout/Theme
```

**How to do this:**
- Schedule a 2-hour pairing session
- One person shares screen
- Build foundation together
- Both review and agree
- Merge to main

**Why this matters:** If you have different database schemas or types, you'll have constant conflicts. Build the foundation TOGETHER first.

#### 4. Initial Work Division Strategy

**Week 1-2 Division Example:**

**Person A (Filip):**
- Set up database schema (together first)
- Build Factory Management UI
- Factory CRUD API endpoints
- Factory detail pages

**Person B (Cofounder):**
- Set up authentication (together first)
- Build Order Management UI
- Order CRUD API endpoints
- Order detail pages

**Key Rule:** Each person owns complete vertical slices (UI + API + logic) to avoid conflicts.

---

### Phase 1: Starting Development (Week 1)

#### Monday Morning: Foundation Setup (TOGETHER)

**Session 1: Database Schema (1 hour - PAIR PROGRAM)**

1. **Person A shares screen, Person B guides**

```bash
# Person A does the typing, Person B reviews
cd sourcing-dashboard
git checkout main
git pull origin main
git checkout -b feature/database-schema
```

2. **Design schema together:**

```prisma
// prisma/schema.prisma
model Factory {
  id          String   @id @default(cuid())
  name        String
  location    String
  contactEmail String
  orders      Order[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique
  productName     String
  quantity        Int
  progress        Int      @default(0) // 0-100
  status          String   // "pending", "in_progress", "completed"
  factoryId       String
  factory         Factory  @relation(fields: [factoryId], references: [id])
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Add more models as needed
```

3. **Both agree on the schema**
4. **Test it:**

```bash
npx prisma generate
npx prisma db push
```

5. **Commit and merge IMMEDIATELY:**

```bash
git add prisma/schema.prisma
git commit -m "Add initial database schema for factories and orders"
git push origin feature/database-schema
```

6. **Create PR, both approve, merge to main**

7. **Both pull the changes:**

```bash
git checkout main
git pull origin main
```

**Session 2: TypeScript Types (30 minutes - PAIR PROGRAM)**

1. **Create shared types together:**

```typescript
// lib/types.ts
export interface Factory {
  id: string;
  name: string;
  location: string;
  contactEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed';
  factoryId: string;
  factory?: Factory;
  createdAt: Date;
  updatedAt: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

2. **Commit, PR, merge, both pull**

**Now you have a solid foundation. Split up the work.**

---

#### Monday Afternoon - Friday: Parallel Development

**Person A starts Factory features:**

```bash
git checkout main
git pull origin main
git checkout -b feature/factory-management
```

**Person B starts Order features:**

```bash
git checkout main
git pull origin main
git checkout -b feature/order-management
```

**Communication:**
- "I'm working on Factory CRUD today" (Slack/Discord)
- "I'm working on Order CRUD today"

---

### Daily Workflow (Both People Follow This)

#### Every Morning (15 minutes):

```bash
# 1. Check for updates
git checkout main
git pull origin main

# 2. Go back to your feature branch
git checkout feature/your-feature

# 3. Merge latest main into your branch
git merge main

# 4. Fix any conflicts (rare at this stage)

# 5. Push to keep backup
git push origin feature/your-feature
```

#### During the Day:

**Work in small chunks, commit often:**

```bash
# Example: Building factory list page

# Step 1: Create the page
# ... write code ...
git add app/factories/page.tsx
git commit -m "Add factory list page layout"
git push origin feature/factory-management

# Step 2: Add API route
# ... write code ...
git add app/api/factories/route.ts
git commit -m "Add GET endpoint for factories"
git push origin feature/factory-management

# Step 3: Connect UI to API
# ... write code ...
git add app/factories/page.tsx
git commit -m "Connect factory list to API"
git push origin feature/factory-management
```

**Push at least 2-3 times per day** - keeps your work backed up.

#### End of Day (10 minutes):

```bash
# Commit any work in progress
git add .
git commit -m "WIP: Add factory edit form (not finished)"
git push origin feature/factory-management

# Update cofounder
# Message: "Pushed factory list and API, still working on edit form tomorrow"
```

---

### Weekly Sync Meeting (Every Monday - 1 hour)

#### Agenda:

1. **Review last week (15 min):**
   - What got merged?
   - What's blocked?
   - Any issues?

2. **Plan this week (30 min):**
   - What will Person A work on?
   - What will Person B work on?
   - Any dependencies?
   - Any shared files needed?

3. **Quick demo (15 min):**
   - Show each other what you built
   - Feedback and suggestions

**Example Plan:**

```markdown
## Week 2 Plan (Feb 5-9)

### Person A (Filip):
- [ ] Complete factory edit/delete
- [ ] Add factory detail page
- [ ] Add factory search/filter
- Target: Merge by Wednesday

### Person B (Cofounder):
- [ ] Complete order edit/delete
- [ ] Add order detail page
- [ ] Add order status updates
- Target: Merge by Thursday

### Shared Work (Friday):
- [ ] Connect orders to factories (pair program)
- [ ] Test full workflow together
```

---

### How to Handle Dependencies

**Problem:** Person B needs Person A's factory API to finish orders page.

**Solution:**

#### Option 1: Build in Order (Recommended)
- Person A finishes and merges factory API first
- Person B waits OR works on other parts
- Once merged, Person B pulls and continues

```bash
# Person B waits for Person A's merge
git checkout main
git pull origin main  # Gets Person A's factory API
git checkout feature/order-management
git merge main        # Now has factory API available
# Continue building orders page
```

#### Option 2: Create Mock/Stub
- Person A creates a simple version first
- Merges it quickly (even if incomplete)
- Person B can start using it
- Person A continues improving in new branch

#### Option 3: Coordinate Timing
- **Monday:** Person A builds factory API
- **Tuesday:** Person A merges, Person B pulls and starts orders
- **Wednesday-Friday:** Both work independently

---

### Code Review Process (Critical for Quality)

#### When Your Feature Is Ready:

**Step 1: Self-Review (10 minutes)**

```bash
# Check your changes
git diff main

# Test locally
npm run dev
# Manually test all your changes

# Check for console errors
# Check for any TODO comments you left

# Clean up any debug code
```

**Step 2: Create Pull Request**

```bash
git push origin feature/factory-management
```

Go to GitHub, create PR with this template:

```markdown
## What does this PR do?
Adds factory management system with list, create, edit, and delete.

## Files Changed
- `app/factories/page.tsx` - Factory list UI
- `app/factories/[id]/page.tsx` - Factory detail page
- `app/api/factories/route.ts` - Factory CRUD API
- `lib/actions/factories.ts` - Server actions

## How to Test
1. Go to http://localhost:3000/factories
2. Click "Add Factory"
3. Fill in form and submit
4. Verify factory appears in list
5. Click on factory to view details
6. Edit and verify changes save
7. Delete and verify it's removed

## Screenshots
[Attach screenshots of the UI]

## Checklist
- [x] Code works locally
- [x] No console errors
- [x] Tested all CRUD operations
- [x] Follows project structure
- [x] TypeScript types are correct
- [ ] Cofounder approved

Closes #5
```

**Step 3: Request Review**
- Assign cofounder as reviewer
- Message: "PR ready for review: Factory Management"

#### When Reviewing Cofounder's PR:

**What to Check:**

1. **Pull their branch locally:**

```bash
git fetch origin
git checkout feature/order-management
npm run dev
```

2. **Test it yourself:**
   - Follow their testing instructions
   - Try to break it (edge cases)
   - Check for errors

3. **Review the code on GitHub:**
   - Does it follow our patterns?
   - Any obvious bugs?
   - Is it readable?
   - Are TypeScript types used correctly?

4. **Leave feedback:**

**Good feedback:**
- "Great work! Consider adding error handling on line 45 for when the API fails"
- "Should we add loading state while fetching factories?"
- "Minor: variable name could be more descriptive on line 23"

**Bad feedback:**
- "This is wrong"
- "I would do it differently"

5. **Approve or Request Changes:**
   - If minor issues: Approve and let them fix later
   - If major issues: Request changes before merge

6. **After approval, author merges the PR**

---

### Merging and Continuing (Every 2-3 Days)

#### After PR is Merged:

**Author:**
```bash
# Switch to main and clean up
git checkout main
git pull origin main
git branch -d feature/factory-management

# Start next feature
git checkout -b feature/factory-search
```

**Reviewer:**
```bash
# Get the new changes
git checkout main
git pull origin main

# Merge into your current work
git checkout feature/order-management
git merge main

# Fix conflicts if any (usually none)
git push origin feature/order-management
```

---

### Real Example: Building Factory Management (Week 1)

#### Person A: Complete Workflow

**Monday 9 AM:**
```bash
# Start the week
git checkout main
git pull origin main
git checkout -b feature/factory-management

# Message cofounder: "Starting factory management today"
```

**Monday 9:30 AM - 12 PM:**
```typescript
// Create app/factories/page.tsx
// Build basic list UI
```

```bash
git add app/factories/page.tsx
git commit -m "Add factory list page UI"
git push origin feature/factory-management
```

**Monday 1 PM - 3 PM:**
```typescript
// Create app/api/factories/route.ts
// Build GET and POST endpoints
```

```bash
git add app/api/factories/route.ts
git commit -m "Add factory API endpoints (GET, POST)"
git push origin feature/factory-management
```

**Monday 3 PM - 5 PM:**
```typescript
// Connect UI to API
// Add loading states
// Test create flow
```

```bash
git add app/factories/page.tsx
git commit -m "Connect factory list to API with loading states"
git push origin feature/factory-management

# Message cofounder: "Factory list and create working, pushed changes"
```

**Tuesday 9 AM:**
```bash
# Sync with main (get cofounder's changes if any)
git checkout main
git pull origin main
git checkout feature/factory-management
git merge main
git push
```

**Tuesday 9:30 AM - 12 PM:**
```typescript
// Build edit functionality
// Add app/factories/[id]/edit/page.tsx
```

```bash
git add app/factories/[id]/edit/page.tsx
git add app/api/factories/[id]/route.ts
git commit -m "Add factory edit functionality"
git push origin feature/factory-management
```

**Tuesday 1 PM - 3 PM:**
```typescript
// Add delete functionality
// Add confirmation dialog
```

```bash
git add app/factories/page.tsx
git add app/api/factories/[id]/route.ts
git commit -m "Add factory delete with confirmation"
git push origin feature/factory-management
```

**Tuesday 3 PM - 4 PM:**
```bash
# Self-test everything
npm run dev
# Test create, edit, delete
# Check for errors

# Everything works!
```

**Tuesday 4 PM:**
```bash
# Create PR on GitHub
# Write detailed description
# Add screenshots
# Request cofounder review

# Message: "Factory management PR ready for review"
```

**Wednesday 10 AM:**
```
# Cofounder reviews
# Leaves comment: "Add error handling for duplicate factory names"
```

**Wednesday 11 AM:**
```typescript
// Address feedback
// Add duplicate name check
```

```bash
git add app/api/factories/route.ts
git commit -m "Add validation for duplicate factory names"
git push origin feature/factory-management

# Comment on PR: "Added duplicate name validation"
```

**Wednesday 2 PM:**
```
# Cofounder approves PR
```

**Wednesday 2:05 PM:**
```bash
# Merge PR on GitHub

# Clean up locally
git checkout main
git pull origin main
git branch -d feature/factory-management

# Start next feature
git checkout -b feature/factory-search

# Message: "Factory management merged! Starting search feature"
```

---

### Handling Shared Files (Advanced)

**Problem:** Both need to edit `app/layout.tsx` (navigation menu).

**Solution 1: Coordinate Timing**
- Person A adds factory link Monday
- Merges it
- Person B adds order link Tuesday
- Merges it

**Solution 2: Pair Program**
- 15-minute call
- One person shares screen
- Add both links together
- Immediate merge

**Solution 3: One Person Owns Layout**
- Person A "owns" layout/navigation
- Person B requests changes
- Person A makes the update

---

### Testing Before Merging (Required Checklist)

Before creating PR, verify:

#### Functionality:
- [ ] Feature works as expected
- [ ] All buttons/links work
- [ ] Forms validate correctly
- [ ] Data saves to database
- [ ] Data displays correctly

#### Code Quality:
- [ ] No console errors
- [ ] No TypeScript errors (`npm run build`)
- [ ] No unused imports
- [ ] No commented-out code
- [ ] No TODO comments (or create issues for them)

#### User Experience:
- [ ] Loading states shown
- [ ] Error messages clear
- [ ] Success feedback shown
- [ ] Responsive on mobile
- [ ] Works in different browsers

#### Integration:
- [ ] Doesn't break existing features
- [ ] Follows project patterns
- [ ] Uses shared types correctly
- [ ] API endpoints follow conventions

---

### Progress Tracking

#### Create STATUS.md (Update Every Monday)

```markdown
# Project Status - Week 2

## Completed ✅
- Week 1:
  - [x] Database schema
  - [x] Factory CRUD (Person A)
  - [x] Order CRUD (Person B)
  - [x] Basic authentication

## In Progress 🔨
- Person A: Factory search and filtering (feature/factory-search)
- Person B: Order status tracking (feature/order-status)

## Up Next 📋
- Factory-order relationship
- Dashboard homepage
- Progress charts

## Blocked 🚫
- None

## Notes
- Factory management merged Wednesday
- Order management merged Thursday
- Both features tested and working
- Ready to start dashboard views next week
```

---

### Red Flags to Avoid

#### 🚩 Branch Living Too Long
- **Problem:** Working on same branch for 2+ weeks
- **Fix:** Break into smaller features, merge more often
- **Example:** Instead of "feature/factory-everything", do:
  - "feature/factory-list" (merge Monday)
  - "feature/factory-create" (merge Wednesday)
  - "feature/factory-edit" (merge Friday)

#### 🚩 Not Syncing with Main
- **Problem:** Haven't pulled main in 3 days
- **Result:** Huge conflicts when you finally merge
- **Fix:** Pull main every morning

#### 🚩 Working on Same Files
- **Problem:** Both editing `layout.tsx` at same time
- **Result:** Constant conflicts
- **Fix:** Coordinate who edits shared files when

#### 🚩 No Code Review
- **Problem:** Merging without cofounder review
- **Result:** Bugs get into main, code quality drops
- **Fix:** Every PR needs approval before merge

#### 🚩 Unclear What You're Working On
- **Problem:** Cofounder doesn't know your status
- **Result:** Duplicate work or blocked progress
- **Fix:** Daily status updates (5-second message)

---

### Summary: The Perfect Week

#### Monday:
- 9 AM: Sync meeting (plan the week)
- 9:30 AM: Pull main, create feature branch
- 10 AM - 5 PM: Build feature, commit often, push 2-3 times
- 5 PM: Push work-in-progress, update cofounder

#### Tuesday-Thursday:
- 9 AM: Pull main, merge into feature branch
- 9:30 AM - 5 PM: Continue feature, commit often
- 5 PM: Push progress, update cofounder

#### Friday:
- 9 AM: Finish feature
- 10 AM: Self-review, test thoroughly
- 11 AM: Create PR with detailed description
- 12 PM: Review cofounder's PR
- 2 PM: Address feedback on your PR
- 3 PM: Merge PRs
- 4 PM: Clean up branches, plan next week

**Result:** 2-3 features merged per week, zero conflicts, high quality code.

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
