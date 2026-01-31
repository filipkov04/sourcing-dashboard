#!/usr/bin/env tsx

/**
 * Automatic Task Status Tracker
 *
 * This script analyzes the codebase to detect completed tasks
 * and automatically updates the TASK_LIST.md file.
 */

import fs from 'fs';
import path from 'path';

interface TaskRule {
  taskNumber: string;
  taskName: string;
  checks: (() => boolean)[];
  description: string;
}

// Helper functions to check if tasks are completed
const fileExists = (filePath: string): boolean => {
  return fs.existsSync(path.join(process.cwd(), filePath));
};

const directoryExists = (dirPath: string): boolean => {
  return fs.existsSync(path.join(process.cwd(), dirPath)) &&
         fs.statSync(path.join(process.cwd(), dirPath)).isDirectory();
};

const fileContains = (filePath: string, searchString: string): boolean => {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
    return content.includes(searchString);
  } catch {
    return false;
  }
};

const hasTableInSchema = (tableName: string): boolean => {
  return fileContains('prisma/schema.prisma', `model ${tableName}`);
};

const hasApiRoute = (routePath: string): boolean => {
  return fileExists(`app/api/${routePath}/route.ts`) ||
         fileExists(`app/api/${routePath}/route.tsx`);
};

const hasPage = (pagePath: string): boolean => {
  return fileExists(`app/${pagePath}/page.tsx`) ||
         fileExists(`app/${pagePath}/page.ts`);
};

// Task detection rules
const taskRules: TaskRule[] = [
  // Week 1 - Foundation
  {
    taskNumber: '1.1',
    taskName: 'Project Setup',
    description: 'Check for Next.js setup and dependencies',
    checks: [
      () => fileExists('package.json'),
      () => fileContains('package.json', 'next'),
      () => directoryExists('node_modules'),
    ],
  },
  {
    taskNumber: '1.2',
    taskName: 'Database Design',
    description: 'Check for Prisma schema with core models',
    checks: [
      () => fileExists('prisma/schema.prisma'),
      () => hasTableInSchema('Organization'),
      () => hasTableInSchema('User'),
      () => hasTableInSchema('Factory'),
      () => hasTableInSchema('Order'),
    ],
  },
  {
    taskNumber: '1.3',
    taskName: 'Shared Types',
    description: 'Check for TypeScript types file',
    checks: [
      () => fileExists('lib/types.ts'),
      () => fileContains('lib/types.ts', 'export'),
    ],
  },
  {
    taskNumber: '1.4',
    taskName: 'Authentication',
    description: 'Check for auth implementation',
    checks: [
      () => hasApiRoute('auth/[...nextauth]') ||
            hasApiRoute('auth/login') ||
            fileContains('package.json', 'next-auth'),
    ],
  },
  {
    taskNumber: '1.5',
    taskName: 'Layout & Navigation',
    description: 'Check for layout and navigation components',
    checks: [
      () => fileExists('app/layout.tsx'),
      () => fileContains('app/layout.tsx', 'children'),
    ],
  },
  {
    taskNumber: '1.6',
    taskName: 'API Helpers',
    description: 'Check for API helper functions',
    checks: [
      () => fileExists('lib/api-helpers.ts') ||
            fileExists('lib/utils.ts') && fileContains('lib/utils.ts', 'response'),
    ],
  },

  // Filip's Tasks - Factory Management
  {
    taskNumber: '1.7',
    taskName: 'Factory List Page',
    description: 'Check for factories list page',
    checks: [
      () => hasPage('factories'),
      () => fileContains('app/factories/page.tsx', 'search') ||
            fileContains('app/factories/page.tsx', 'Search'),
    ],
  },
  {
    taskNumber: '1.8',
    taskName: 'Factory API',
    description: 'Check for factory API endpoints',
    checks: [
      () => hasApiRoute('factories'),
    ],
  },
  {
    taskNumber: '1.9',
    taskName: 'Factory Create Form',
    description: 'Check for factory create page',
    checks: [
      () => hasPage('factories/new'),
    ],
  },

  // Marco's Tasks - Order Management
  {
    taskNumber: '1.11',
    taskName: 'Order List Page',
    description: 'Check for orders list page',
    checks: [
      () => hasPage('orders'),
    ],
  },
  {
    taskNumber: '1.12',
    taskName: 'Order API',
    description: 'Check for order API endpoints',
    checks: [
      () => hasApiRoute('orders'),
    ],
  },
  {
    taskNumber: '1.13',
    taskName: 'Order Create Form',
    description: 'Check for order create page',
    checks: [
      () => hasPage('orders/new'),
    ],
  },

  // Week 2 - Filip's Tasks
  {
    taskNumber: '2.1',
    taskName: 'Factory Detail Page',
    description: 'Check for factory detail page with dynamic routing',
    checks: [
      () => fileExists('app/factories/[id]/page.tsx'),
    ],
  },
  {
    taskNumber: '2.2',
    taskName: 'Factory Edit Form',
    description: 'Check for factory edit page',
    checks: [
      () => fileExists('app/factories/[id]/edit/page.tsx'),
    ],
  },

  // Week 2 - Marco's Tasks
  {
    taskNumber: '2.6',
    taskName: 'Order Detail Page',
    description: 'Check for order detail page',
    checks: [
      () => fileExists('app/orders/[id]/page.tsx'),
    ],
  },
  {
    taskNumber: '2.7',
    taskName: 'Order Edit Form',
    description: 'Check for order edit page',
    checks: [
      () => fileExists('app/orders/[id]/edit/page.tsx'),
    ],
  },

  // Week 3 - Filip's Tasks
  {
    taskNumber: '3.1',
    taskName: 'Dashboard Homepage',
    description: 'Check for dashboard page',
    checks: [
      () => hasPage('dashboard') || fileExists('app/page.tsx'),
      () => fileContains('app/dashboard/page.tsx', 'stats') ||
            fileContains('app/page.tsx', 'dashboard'),
    ],
  },
  {
    taskNumber: '3.4',
    taskName: 'Team Members Page',
    description: 'Check for team management page',
    checks: [
      () => hasPage('team'),
    ],
  },

  // Week 3 - Marco's Tasks
  {
    taskNumber: '3.7',
    taskName: 'File Attachments',
    description: 'Check for file upload functionality',
    checks: [
      () => hasApiRoute('upload') ||
            fileContains('package.json', 'uploadthing') ||
            fileContains('package.json', '@vercel/blob'),
    ],
  },

  // Week 4 - Filip's Tasks
  {
    taskNumber: '4.1',
    taskName: 'Chart Library Setup',
    description: 'Check for chart library installation',
    checks: [
      () => fileContains('package.json', 'recharts') ||
            fileContains('package.json', 'chart.js') ||
            fileContains('package.json', 'victory'),
    ],
  },

  // Week 6 - Marco's Tasks
  {
    taskNumber: '6.8',
    taskName: 'Redis Setup',
    description: 'Check for Redis configuration',
    checks: [
      () => fileContains('package.json', 'redis') ||
            fileContains('package.json', 'ioredis'),
    ],
  },
  {
    taskNumber: '6.9',
    taskName: 'Job Queue Setup',
    description: 'Check for job queue library',
    checks: [
      () => fileContains('package.json', 'bullmq') ||
            fileContains('package.json', 'bull'),
    ],
  },
];

// Read and update the TASK_LIST.md file
function updateTaskList() {
  const taskListPath = path.join(process.cwd(), 'docs/tasks/TASK_LIST.md');

  if (!fs.existsSync(taskListPath)) {
    console.error('❌ TASK_LIST.md not found at:', taskListPath);
    process.exit(1);
  }

  let content = fs.readFileSync(taskListPath, 'utf-8');
  let updatedCount = 0;
  let alreadyCompleteCount = 0;

  console.log('\n🔍 Analyzing codebase for completed tasks...\n');

  taskRules.forEach(rule => {
    const allChecksPassed = rule.checks.every(check => check());

    if (allChecksPassed) {
      // Find the task line in the markdown
      const taskPattern = new RegExp(
        `(\\| ${rule.taskNumber} \\|[^|]+\\|[^|]+\\|[^|]+\\|[^|]+\\|[^|]+\\| )(⏳|🔄)( \\|)`,
        'g'
      );

      const match = content.match(taskPattern);

      if (match) {
        // Update status from ⏳ or 🔄 to ✅
        content = content.replace(taskPattern, `$1✅$3`);
        updatedCount++;
        console.log(`✅ Task ${rule.taskNumber} marked as complete: ${rule.taskName}`);
        console.log(`   └─ ${rule.description}`);
      } else {
        // Check if already marked as complete
        const alreadyCompletePattern = new RegExp(
          `\\| ${rule.taskNumber} \\|[^|]+\\|[^|]+\\|[^|]+\\|[^|]+\\|[^|]+\\| ✅ \\|`
        );
        if (content.match(alreadyCompletePattern)) {
          alreadyCompleteCount++;
        }
      }
    }
  });

  // Write updated content back to file
  fs.writeFileSync(taskListPath, content, 'utf-8');

  console.log('\n📊 Summary:');
  console.log(`   • Tasks updated: ${updatedCount}`);
  console.log(`   • Already complete: ${alreadyCompleteCount}`);
  console.log(`   • Total tracked: ${taskRules.length}`);
  console.log('\n✨ Task list updated successfully!\n');

  if (updatedCount > 0) {
    console.log('💡 Remember to commit the changes to TASK_LIST.md\n');
  }
}

// Run the update
updateTaskList();
