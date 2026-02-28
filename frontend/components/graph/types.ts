export interface Node {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface Relationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: Node[];
  relationships: Relationship[];
}

export interface PendingLink {
  fromNodeId: string;
  toNodeId: string;
}

export interface DragLink {
  sourceNode: ForceGraphNode;
  mouseX: number;
  mouseY: number;
}

export interface ForceGraphNode {
  id: string;
  label: string;
  labels: string[];
  color: string;
  originalNode: Node;
  x?: number;
  y?: number;
}

export interface ForceGraphLink {
  id: string;
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  type: string;
  originalRel: Relationship;
}

export interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}
