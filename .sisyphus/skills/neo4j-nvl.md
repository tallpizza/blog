# Neo4j NVL (Visualization Library) Skill

NVL is a TypeScript collection of libraries for building custom graph visualizations.

## Installation

```bash
npm install @neo4j-nvl/base @neo4j-nvl/react @neo4j-nvl/interaction-handlers
```

## Packages

| Package | Description |
|---------|-------------|
| `@neo4j-nvl/base` | Core library with NVL class |
| `@neo4j-nvl/react` | React wrappers (BasicNvlWrapper, InteractiveNvlWrapper) |
| `@neo4j-nvl/interaction-handlers` | Interaction handlers for click, drag, draw, hover |

## Basic Setup with React

```tsx
import { InteractiveNvlWrapper } from '@neo4j-nvl/react';
import type { Node as NvlNode, Relationship as NvlRelationship } from '@neo4j-nvl/base';

const nodes: NvlNode[] = [
  { id: '1', caption: 'Node 1', color: '#3B82F6', size: 34 },
  { id: '2', caption: 'Node 2', color: '#10B981', size: 34 },
];

const relationships: NvlRelationship[] = [
  { id: 'rel-1', from: '1', to: '2', caption: 'CONNECTS' },
];

<InteractiveNvlWrapper
  nodes={nodes}
  rels={relationships}
  layout="forceDirected"
  nvlOptions={{
    allowDynamicMinZoom: true,
    initialZoom: 1,
    minZoom: 0.2,
    maxZoom: 3,
  }}
/>
```

## Node Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | **Required.** Unique identifier |
| `caption` | `string` | Text displayed inside node |
| `color` | `string` | Node background color |
| `size` | `number` | Node diameter in pixels |
| `activated` | `boolean` | Highlights the node (subtle effect) |
| `selected` | `boolean` | Shows selection border (more visible) |
| `hovered` | `boolean` | Shows hover state |
| `disabled` | `boolean` | Dims the node |
| `pinned` | `boolean` | Prevents physics movement |
| `x`, `y` | `number` | Manual positioning (with 'free' layout) |
| `icon` | `string` | URL to icon displayed inside node |

## Relationship Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | **Required.** Unique identifier |
| `from` | `string` | **Required.** Source node id |
| `to` | `string` | **Required.** Target node id |
| `caption` | `string` | Text on relationship line |
| `color` | `string` | Line color |
| `width` | `number` | Line thickness |
| `type` | `string` | Relationship type label |
| `selected` | `boolean` | Shows selection state |
| `hovered` | `boolean` | Shows hover state |

## Layout Types

| Layout | Description |
|--------|-------------|
| `"forceDirected"` | Physics-based simulation (nodes repel, edges attract) |
| `"hierarchical"` | Dagre algorithm for tree structures |
| `"free"` | Manual positioning using x, y coordinates |
| `"grid"` | Basic grid layout |
| `"d3Force"` | D3-force layout |

## Layout Options

### ForceDirectedOptions

```typescript
interface ForceDirectedOptions {
  enableCytoscape?: boolean;  // Auto-switch to CoseBilkent for small graphs (REMOVES physics!)
  enableVerlet?: boolean;     // Use new physics engine (default: true)
  intelWorkaround?: boolean;  // Fix for Intel GPU issues
}
```

**Important:** `enableCytoscape: true` switches to CoseBilkent for small graphs which does NOT have continuous physics simulation. Nodes will be positioned once and stay static.

### HierarchicalOptions

```typescript
interface HierarchicalOptions {
  direction?: 'up' | 'down' | 'left' | 'right';
  packing?: 'bin' | 'stack';
}
```

## InteractiveNvlWrapper Props

```typescript
interface InteractiveReactWrapperProps {
  nodes: Node[];
  rels: Relationship[];
  layout?: Layout;
  layoutOptions?: LayoutOptions;
  nvlOptions?: NvlOptions;
  nvlCallbacks?: ExternalCallbacks;
  interactionOptions?: {
    ghostGraphStyling?: {
      node: { color: string; size: number };
      relationship: { color: string; width: number };
    };
  };
  mouseEventCallbacks?: MouseEventCallbacks;
}
```

## Mouse Event Callbacks

```typescript
interface MouseEventCallbacks {
  onNodeClick?: (node: NvlNode, hitTargets: HitTargets, event: MouseEvent) => void;
  onRelationshipClick?: (rel: NvlRelationship) => void;
  onHoverNodeMargin?: (node: NvlNode | null) => void;  // Edge of node (for drag-to-link)
  onDrawStarted?: (rel: NvlRelationship | null) => void;
  onDrawEnded?: (rel: NvlRelationship | null) => void;
  onDrag?: boolean;
  onZoom?: boolean;
  onPan?: boolean;
}
```

## Drag-to-Link (DrawInteraction)

Create relationships by dragging from one node edge to another:

```tsx
<InteractiveNvlWrapper
  interactionOptions={{
    ghostGraphStyling: {
      node: { color: '#3B82F6', size: 25 },
      relationship: { color: '#3B82F6', width: 2 },
    },
  }}
  mouseEventCallbacks={{
    onHoverNodeMargin: (node) => {
      // Fires when hovering over node's edge (narrow detection zone)
      setHoverEdgeNodeId(node ? node.id : null);
    },
    onDrawEnded: (newRel) => {
      // Fires when drag completes
      if (newRel) {
        console.log(`Link from ${newRel.from} to ${newRel.to}`);
      }
    },
  }}
/>
```

**Gotcha:** `onHoverNodeMargin` only fires when hovering over the narrow edge zone of a node, not the entire node area.

## NVL Options

```typescript
interface NvlOptions {
  instanceId?: string;
  initialZoom?: number;
  minZoom?: number;           // default: 0.075
  maxZoom?: number;           // default: 10
  allowDynamicMinZoom?: boolean;  // default: true
  renderer?: 'webgl' | 'canvas';  // default: 'webgl'
  disableTelemetry?: boolean;
  styling?: {
    defaultNodeColor?: string;
    defaultRelationshipColor?: string;
    selectedBorderColor?: string;
    dropShadowColor?: string;
  };
}
```

## Renderers

| Renderer | Performance | Features |
|----------|-------------|----------|
| `'webgl'` | Better (GPU) | No captions, no arrowheads |
| `'canvas'` | Lower | Supports captions and arrowheads |

## External Callbacks

```typescript
interface ExternalCallbacks {
  onLayoutDone?: () => void;  // Layout calculation complete
}
```

## Common Gotchas

1. **Static nodes with small graphs:** If `enableCytoscape: true`, small graphs use CoseBilkent which is NOT physics-based.

2. **Edge detection precision:** `onHoverNodeMargin` has a very narrow detection zone. Users might not find it intuitive.

3. **WebGL vs Canvas:** Captions only show with canvas renderer. Switch if you need text on nodes/relationships.

4. **Activated vs Selected:** `activated` has subtle visual effect. Use `selected` for more visible highlighting.

5. **Pinned nodes:** Use `pinned: true` to prevent a node from moving with physics.

## Example: Highlight Node on Edge Hover

```tsx
const nvlNodes = graphData.nodes.map((node) => {
  const isEdgeHovered = hoverEdgeNodeId === node.id;
  return {
    id: node.id,
    caption: node.name,
    size: isEdgeHovered ? 50 : 34,  // Size increase
    color: '#3B82F6',
    activated: isEdgeHovered,       // Subtle highlight
    selected: isEdgeHovered,        // Visible border
  };
});
```

## Resources

- [NVL Documentation](https://neo4j.com/docs/nvl/current/)
- [API Reference](https://neo4j.com/docs/api/nvl/current/)
- [Examples](https://neo4j.com/docs/api/nvl/current/examples.html)
