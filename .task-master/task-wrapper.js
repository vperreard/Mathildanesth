#!/usr/bin/env node
// Task wrapper for mathildanesth project
// This provides task-master-like functionality without MCP dependency

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_DIR = path.join(__dirname, 'tasks');
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Ensure directories exist
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

// Commands
const commands = {
  list: () => {
    const tasks = loadTasks();
    if (tasks.length === 0) {
      console.log('📋 No tasks found');
      return;
    }
    console.log('📋 Current tasks:');
    tasks.forEach((task, index) => {
      const status = task.completed ? '✅' : '⏳';
      console.log(`${status} ${index + 1}. [${task.priority}] ${task.title}`);
      if (task.description) {
        console.log(`   ${task.description}`);
      }
    });
  },

  add: (args) => {
    const title = args.join(' ');
    if (!title) {
      console.error('❌ Task title required');
      process.exit(1);
    }
    
    const tasks = loadTasks();
    const newTask = {
      id: Date.now().toString(),
      title,
      priority: 'medium',
      completed: false,
      created: new Date().toISOString()
    };
    
    tasks.push(newTask);
    saveTasks(tasks);
    console.log(`✅ Task added: ${title}`);
  },

  complete: (args) => {
    const index = parseInt(args[0]) - 1;
    const tasks = loadTasks();
    
    if (isNaN(index) || index < 0 || index >= tasks.length) {
      console.error('❌ Invalid task number');
      process.exit(1);
    }
    
    tasks[index].completed = true;
    tasks[index].completedAt = new Date().toISOString();
    saveTasks(tasks);
    console.log(`✅ Task completed: ${tasks[index].title}`);
  },

  status: () => {
    const tasks = loadTasks();
    const completed = tasks.filter(t => t.completed).length;
    const pending = tasks.length - completed;
    
    console.log('📊 Project Status:');
    console.log(`   Total tasks: ${tasks.length}`);
    console.log(`   ✅ Completed: ${completed}`);
    console.log(`   ⏳ Pending: ${pending}`);
    
    // Run project checks
    console.log('\n🔍 Running project checks...');
    try {
      execSync('npm run verify:quick', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Project checks failed');
    }
  },

  run: (args) => {
    const projectTasks = loadProjectTasks();
    const [category, command] = args;
    
    if (!category) {
      console.log('📚 Available categories:');
      Object.entries(projectTasks.categories).forEach(([key, cat]) => {
        console.log(`  ${key}: ${cat.name}`);
      });
      return;
    }
    
    if (!command) {
      const cat = projectTasks.categories[category];
      if (!cat) {
        console.error(`❌ Unknown category: ${category}`);
        return;
      }
      console.log(`📋 Commands in ${cat.name}:`);
      Object.entries(cat.commands).forEach(([key, cmd]) => {
        console.log(`  ${key}: ${cmd}`);
      });
      return;
    }
    
    const cmd = projectTasks.categories[category]?.commands[command];
    if (!cmd) {
      console.error(`❌ Unknown command: ${category} ${command}`);
      return;
    }
    
    console.log(`🚀 Running: ${cmd}`);
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Command failed');
      process.exit(1);
    }
  },

  workflow: (args) => {
    const projectTasks = loadProjectTasks();
    const workflow = args[0];
    
    if (!workflow) {
      console.log('🔄 Available workflows:');
      Object.entries(projectTasks.workflows).forEach(([key, cmds]) => {
        console.log(`  ${key}: ${cmds.join(' → ')}`);
      });
      return;
    }
    
    const commands = projectTasks.workflows[workflow];
    if (!commands) {
      console.error(`❌ Unknown workflow: ${workflow}`);
      return;
    }
    
    console.log(`🔄 Running workflow: ${workflow}`);
    for (const cmd of commands) {
      console.log(`\n▶️  Executing: npm run ${cmd}`);
      try {
        execSync(`npm run ${cmd}`, { stdio: 'inherit' });
      } catch (error) {
        console.error(`❌ Workflow failed at: ${cmd}`);
        process.exit(1);
      }
    }
    console.log(`\n✅ Workflow ${workflow} completed successfully!`);
  }
};

// Helper functions
function loadTasks() {
  const tasksFile = path.join(TASKS_DIR, 'tasks.json');
  if (!fs.existsSync(tasksFile)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
}

function saveTasks(tasks) {
  const tasksFile = path.join(TASKS_DIR, 'tasks.json');
  fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
}

function loadProjectTasks() {
  const projectFile = path.join(__dirname, 'project-tasks.json');
  if (!fs.existsSync(projectFile)) {
    return { categories: {}, workflows: {} };
  }
  return JSON.parse(fs.readFileSync(projectFile, 'utf8'));
}

// Main
const [,, command, ...args] = process.argv;

if (!command || !commands[command]) {
  console.log('📦 Task Master for mathildanesth');
  console.log('\nUsage: tm <command> [args]');
  console.log('\n📋 Task Commands:');
  console.log('  list         - List all tasks');
  console.log('  add <task>   - Add a new task');
  console.log('  complete <#> - Mark task as complete');
  console.log('  status       - Show project status');
  console.log('\n🚀 Project Commands:');
  console.log('  run <cat> <cmd> - Run project command');
  console.log('  workflow <name> - Run workflow sequence');
  console.log('\nExamples:');
  console.log('  tm add "Fix auth module tests"');
  console.log('  tm run tests verify:quick');
  console.log('  tm workflow pre-commit');
  process.exit(1);
}

commands[command](args);