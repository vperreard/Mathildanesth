# Drag-and-Drop Migration Guide

## From @dnd-kit to @hello-pangea/dnd

### Basic Setup Changes:

```tsx
// Before (@dnd-kit)
import { DndContext, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';

// After (@hello-pangea/dnd)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
```

### Component Structure:

```tsx
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
```

## From react-dnd to @hello-pangea/dnd

### Basic Setup Changes:

```tsx
// Before (react-dnd)
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useDrag, useDrop } from 'react-dnd';

// After (@hello-pangea/dnd)
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
```

### Event Handling:

```tsx
// Before (react-dnd)
const handleDrop = (item, monitor) => {
  const delta = monitor.getDifferenceFromInitialOffset();
  // handle drop
};

// After (@hello-pangea/dnd)
const onDragEnd = result => {
  const { destination, source, draggableId } = result;
  if (!destination) return;
  // handle drop
};
```

## Common Patterns

### List Reordering:

```tsx
const onDragEnd = result => {
  if (!result.destination) return;

  const items = Array.from(this.state.items);
  const [reorderedItem] = items.splice(result.source.index, 1);
  items.splice(result.destination.index, 0, reorderedItem);

  this.setState({ items });
};
```

### Multiple Lists:

```tsx
<DragDropContext onDragEnd={onDragEnd}>
  {lists.map(list => (
    <Droppable key={list.id} droppableId={list.id}>
      {provided => (
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
```
