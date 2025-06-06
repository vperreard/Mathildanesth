#!/usr/bin/env node

/**
 * Migration script for consolidating drag-and-drop libraries
 * Target: Standardize on @hello-pangea/dnd
 * Date: January 6, 2025
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that need migration based on analysis
const migrationTargets = {
  '@dnd-kit': [
    'src/components/DraggableCalendar.tsx',
    'src/app/bloc-operatoire/components/DraggableSlot.tsx',
    'src/app/bloc-operatoire/trames/components/TrameEditor.tsx',
    'src/app/planning/components/PlanningCalendar.tsx',
  ],
  'react-dnd': [
    'src/app/admin/trames/components/AssignmentDragDrop.tsx',
    'src/app/admin/trames/components/RoleDragDrop.tsx',
    'src/app/bloc-operatoire/salles/components/SallesAdmin.tsx',
    'src/app/bloc-operatoire/planning/page.tsx',
    'src/app/drag-and-drop-demo.tsx',
    'src/modules/planning/components/DragAndDropPlanning.tsx',
    'src/modules/planning/components/WeeklyPlanning.tsx',
    'src/modules/templates/components/TemplateEditor.tsx',
    'src/modules/templates/components/templates-drag-and-drop.tsx',
    'src/app/bloc-operatoire/trames/page.tsx',
    'src/app/admin/trames/components/TrameBuilder.tsx',
    'src/app/bloc-operatoire/drag-and-drop/page.tsx',
  ],
  'react-beautiful-dnd': [
    'src/app/bloc-operatoire/templates/page.tsx',
    'src/app/bloc-operatoire/salles/components/OperatingRoomsList.tsx',
  ],
};

console.log('🔄 Starting drag-and-drop library migration...\n');

// Step 1: Create backup branch
console.log('📋 Creating backup branch...');
try {
  execSync('git checkout -b backup/pre-dnd-migration', { stdio: 'inherit' });
  execSync('git checkout -', { stdio: 'inherit' });
} catch (e) {
  console.log('⚠️  Backup branch already exists or failed to create');
}

// Step 2: Log migration plan
console.log('\n📊 Migration Plan:');
console.log('================');
Object.entries(migrationTargets).forEach(([lib, files]) => {
  console.log(`\n${lib}: ${files.length} files`);
  files.forEach(file => console.log(`  - ${file}`));
});

// Step 3: Create migration guide
const migrationGuide = `# Drag-and-Drop Migration Guide

## From @dnd-kit to @hello-pangea/dnd

### Basic Setup Changes:
\`\`\`tsx
// Before (@dnd-kit)
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

// After (@hello-pangea/dnd)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
\`\`\`

### Component Structure:
\`\`\`tsx
// Before (@dnd-kit)
<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  <SortableContext items={items}>
    {items.map(item => <SortableItem key={item.id} id={item.id} />)}
  </SortableContext>
</DndContext>

// After (@hello-pangea/dnd)
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="list">
    {(provided) => (
      <div ref={provided.innerRef} {...provided.droppableProps}>
        {items.map((item, index) => (
          <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
              >
                {item.content}
              </div>
            )}
          </Draggable>
        ))}
        {provided.placeholder}
      </div>
    )}
  </Droppable>
</DragDropContext>
\`\`\`

## From react-dnd to @hello-pangea/dnd

### Basic Setup Changes:
\`\`\`tsx
// Before (react-dnd)
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

// After (@hello-pangea/dnd)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
\`\`\`

### Event Handling:
\`\`\`tsx
// Before (react-dnd)
const handleDrop = (item, monitor) => {
  const delta = monitor.getDifferenceFromInitialOffset();
  // handle drop
};

// After (@hello-pangea/dnd)
const onDragEnd = (result) => {
  const { destination, source, draggableId } = result;
  if (!destination) return;
  // handle drop
};
\`\`\`

## Common Patterns

### List Reordering:
\`\`\`tsx
const onDragEnd = (result) => {
  if (!result.destination) return;
  
  const items = Array.from(this.state.items);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);
  
  this.setState({ items });
};
\`\`\`

### Multiple Lists:
\`\`\`tsx
<DragDropContext onDragEnd={onDragEnd}>
  {lists.map(list => (
    <Droppable key={list.id} droppableId={list.id}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {list.items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index}>
              {/* Draggable content */}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  ))}
</DragDropContext>
\`\`\`
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'docs', '05_reports', 'dnd-migration-guide.md'),
  migrationGuide
);

console.log('\n✅ Migration guide created at: docs/05_reports/dnd-migration-guide.md');

// Step 4: List files for manual review
console.log('\n📝 Next Steps:');
console.log('1. Review the migration guide');
console.log('2. Update each file listed above');
console.log('3. Test drag-and-drop functionality');
console.log('4. Remove old dependencies:');
console.log(
  '   npm uninstall @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-dnd react-dnd-html5-backend'
);

console.log(
  '\n⚠️  Note: react-beautiful-dnd imports should be changed to @hello-pangea/dnd (drop-in replacement)'
);
