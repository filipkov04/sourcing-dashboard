#!/usr/bin/env node

/**
 * Notion Task Sync Script
 * Syncs TASK_LIST.md to a Notion database
 *
 * Usage:
 *   node scripts/sync-to-notion.js
 *
 * Prerequisites:
 *   1. Create a Notion integration at https://www.notion.so/profile/integrations
 *   2. Share a Notion page with your integration
 *   3. Set NOTION_API_KEY and NOTION_PAGE_ID in .env file
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Configuration
const TASK_LIST_PATH = path.join(__dirname, '../docs/tasks/TASK_LIST.md');
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID;

/**
 * Parse TASK_LIST.md and extract tasks
 */
function parseTaskList() {
  const content = fs.readFileSync(TASK_LIST_PATH, 'utf-8');
  const tasks = [];

  // Regular expression to match task rows in the markdown tables
  // Format: | Task # | Task Name | Developer | What You're Doing | What Gets Created | Time | Status |
  const taskRegex = /\|\s*(\d+\.\d+[a-z]?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|✅⏳🔄]+)/gi;

  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const [, taskId, taskName, developer, description, output, time, status] = match;

    // Determine status
    let statusValue = 'Not Started';
    if (status.includes('✅') || status.trim() === '✅') {
      statusValue = 'Done';
    } else if (status.includes('🔄')) {
      statusValue = 'In Progress';
    } else if (status.includes('⏳')) {
      statusValue = 'Not Started';
    }

    // Extract week number from task ID
    const week = parseInt(taskId.split('.')[0]);

    tasks.push({
      taskId: taskId.trim(),
      taskName: taskName.trim(),
      developer: developer.trim(),
      description: description.trim(),
      output: output.trim(),
      timeEstimate: time.trim(),
      status: statusValue,
      week: week
    });
  }

  console.log(`📝 Parsed ${tasks.length} tasks from TASK_LIST.md`);
  return tasks;
}

/**
 * Create a Notion database
 */
async function createNotionDatabase() {
  try {
    console.log('🔨 Creating Notion database...');

    const response = await notion.databases.create({
      parent: {
        type: 'page_id',
        page_id: NOTION_PAGE_ID,
      },
      title: [
        {
          type: 'text',
          text: {
            content: 'SourceTrack - Task List',
          },
        },
      ],
      properties: {
        'Task ID': {
          title: {},
        },
        'Task Name': {
          rich_text: {},
        },
        'Developer': {
          select: {
            options: [
              { name: 'Filip', color: 'blue' },
              { name: 'Marco', color: 'green' },
              { name: 'Filip & Marco', color: 'purple' },
            ],
          },
        },
        'Week': {
          number: {},
        },
        'Status': {
          select: {
            options: [
              { name: 'Not Started', color: 'gray' },
              { name: 'In Progress', color: 'yellow' },
              { name: 'Done', color: 'green' },
            ],
          },
        },
        'Time Estimate': {
          rich_text: {},
        },
        'Description': {
          rich_text: {},
        },
        'Output': {
          rich_text: {},
        },
      },
    });

    console.log(`✅ Database created: ${response.url}`);
    return response.id;
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  }
}

/**
 * Add tasks to Notion database
 */
async function addTasksToDatabase(databaseId, tasks) {
  console.log(`📤 Adding ${tasks.length} tasks to Notion...`);

  let successCount = 0;
  let errorCount = 0;

  for (const task of tasks) {
    try {
      await notion.pages.create({
        parent: {
          database_id: databaseId,
        },
        properties: {
          'Task ID': {
            title: [
              {
                text: {
                  content: task.taskId,
                },
              },
            ],
          },
          'Task Name': {
            rich_text: [
              {
                text: {
                  content: task.taskName.substring(0, 2000), // Notion limit
                },
              },
            ],
          },
          'Developer': {
            select: {
              name: task.developer,
            },
          },
          'Week': {
            number: task.week,
          },
          'Status': {
            select: {
              name: task.status,
            },
          },
          'Time Estimate': {
            rich_text: [
              {
                text: {
                  content: task.timeEstimate,
                },
              },
            ],
          },
          'Description': {
            rich_text: [
              {
                text: {
                  content: task.description.substring(0, 2000), // Notion limit
                },
              },
            ],
          },
          'Output': {
            rich_text: [
              {
                text: {
                  content: task.output.substring(0, 2000), // Notion limit
                },
              },
            ],
          },
        },
      });

      successCount++;
      process.stdout.write(`\r✅ Added ${successCount}/${tasks.length} tasks`);
    } catch (error) {
      errorCount++;
      console.error(`\n❌ Error adding task ${task.taskId}:`, error.message);
    }

    // Rate limiting: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Successfully added: ${successCount} tasks`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount} tasks`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Notion sync...\n');

  // Validate environment variables
  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Error: NOTION_API_KEY not found in .env file');
    console.error('   Please add your Notion API key to .env');
    process.exit(1);
  }

  if (!process.env.NOTION_PAGE_ID) {
    console.error('❌ Error: NOTION_PAGE_ID not found in .env file');
    console.error('   Please add your Notion page ID to .env');
    process.exit(1);
  }

  try {
    // Step 1: Parse task list
    const tasks = parseTaskList();

    // Step 2: Create Notion database
    const databaseId = await createNotionDatabase();

    // Step 3: Add tasks to database
    await addTasksToDatabase(databaseId, tasks);

    console.log('\n✨ Sync complete!');
    console.log(`   Visit your Notion page to see the tasks`);
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
