import { describe, it, expect } from 'vitest';

import { pinNodesInPlace, repinNode, unpinNodes } from '@/components/graph/physics/dragPinning';

describe('dragPinning', () => {
  it('pins nodes with known positions in place', () => {
    const nodes = [
      { id: 'a', x: 1, y: 2 },
      { id: 'b', x: 3, y: 4, z: 5 },
      { id: 'c', x: undefined, y: 6 },
    ];

    pinNodesInPlace(nodes);

    expect(nodes[0].fx).toBe(1);
    expect(nodes[0].fy).toBe(2);
    expect(nodes[1].fx).toBe(3);
    expect(nodes[1].fy).toBe(4);
    expect(nodes[1].fz).toBe(5);
    expect(nodes[2].fx).toBeUndefined();
    expect(nodes[2].fy).toBeUndefined();
  });

  it('unpins all nodes except a provided id', () => {
    const nodes = [
      { id: 'a', x: 1, y: 2, fx: 1, fy: 2 },
      { id: 'b', x: 3, y: 4, fx: 3, fy: 4 },
    ];

    unpinNodes(nodes, 'a');

    expect(nodes[0].fx).toBe(1);
    expect(nodes[0].fy).toBe(2);
    expect(nodes[1].fx).toBeUndefined();
    expect(nodes[1].fy).toBeUndefined();
  });

  it('repins a single node by id when it has positions', () => {
    const nodes = [
      { id: 'a', x: 10, y: 20 },
      { id: 'b', x: undefined, y: 2 },
    ];

    repinNode(nodes, 'a');
    repinNode(nodes, 'b');

    expect(nodes[0].fx).toBe(10);
    expect(nodes[0].fy).toBe(20);
    expect(nodes[1].fx).toBeUndefined();
    expect(nodes[1].fy).toBeUndefined();
  });
});
