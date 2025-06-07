#!/bin/bash

# Setup script for task-master-ai MCP integration

echo "🚀 Setting up task-master-ai for mathildanesth project..."

# Create necessary directories
mkdir -p .task-master/tasks
mkdir -p .task-master/logs

# Create initial configuration
cat > .task-master/config.json << EOF
{
  "project": {
    "name": "mathildanesth",
    "description": "Medical planning application for anesthesia teams",
    "type": "nextjs",
    "language": "typescript",
    "framework": "Next.js 14"
  },
  "tasks": {
    "storage": "local",
    "path": ".task-master/tasks",
    "categories": [
      "bug-fix",
      "feature",
      "refactor",
      "test",
      "documentation",
      "performance",
      "security"
    ]
  },
  "priorities": {
    "levels": ["critical", "high", "medium", "low"],
    "default": "medium"
  },
  "workflow": {
    "states": ["todo", "in-progress", "review", "testing", "done", "blocked"],
    "default": "todo"
  }
}
EOF

# Create example task
cat > .task-master/tasks/example-task.json << EOF
{
  "id": "task-001",
  "title": "Example Task - Planning Module Optimization",
  "description": "Optimize the weekly planning view performance",
  "category": "performance",
  "priority": "medium",
  "status": "todo",
  "created": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "updated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "file": "src/app/planning/hebdomadaire/page.tsx",
  "tags": ["planning", "performance", "ui"]
}
EOF

# Add to gitignore
if ! grep -q ".task-master/logs" .gitignore 2>/dev/null; then
  echo -e "\n# Task Master\n.task-master/logs/\n.task-master/tasks/*.tmp" >> .gitignore
fi

# Create task-master command wrapper
cat > scripts/tm << 'EOF'
#!/bin/bash
# Task Master wrapper script
npx -y task-master-ai "$@"
EOF

chmod +x scripts/tm

echo "✅ Task-master setup complete!"
echo ""
echo "📋 Usage examples:"
echo "  ./scripts/tm list           # List all tasks"
echo "  ./scripts/tm add            # Add a new task"
echo "  ./scripts/tm update <id>    # Update task status"
echo "  ./scripts/tm show <id>      # Show task details"
echo ""
echo "📁 Configuration: .task-master/config.json"
echo "📝 Tasks stored in: .task-master/tasks/"