import { Node } from './types';
import { LABEL_COLORS } from './constants';

export function getNodeCaption(node: Node): string {
  const props = node.properties;
  return (
    (props.name as string) ||
    (props.title as string) ||
    (props.email as string) ||
    `${node.labels[0]} ${props.id || node.id}`
  );
}

export function getNodeLabel(nodes: Node[], nodeId: string): string {
  const node = nodes.find(n => String(n.id) === nodeId);
  return node ? `${node.labels[0]} (${getNodeCaption(node)})` : nodeId;
}

export function getNodeColor(label: string): string {
  return LABEL_COLORS[label] || '#6B7280';
}
