import type { ForceGraphNode } from '../types';

type NodeWithPinning = Pick<ForceGraphNode, 'id' | 'x' | 'y'> & {
  fx?: number;
  fy?: number;
  z?: number;
  fz?: number;
};

export function pinNodesInPlace(nodes: NodeWithPinning[]) {
  for (const n of nodes) {
    if (typeof n.x === 'number' && typeof n.y === 'number') {
      n.fx = n.x;
      n.fy = n.y;
    }
    if (typeof n.z === 'number') {
      n.fz = n.z;
    }
  }
}

export function unpinNodes(nodes: NodeWithPinning[], exceptNodeId?: string) {
  for (const n of nodes) {
    if (exceptNodeId && n.id === exceptNodeId) continue;
    n.fx = undefined;
    n.fy = undefined;
    n.fz = undefined;
  }
}

export function repinNode(nodes: NodeWithPinning[], nodeId: string) {
  const n = nodes.find((x) => x.id === nodeId);
  if (!n) return;
  if (typeof n.x !== 'number' || typeof n.y !== 'number') return;
  n.fx = n.x;
  n.fy = n.y;
  if (typeof n.z === 'number') {
    n.fz = n.z;
  }
}
