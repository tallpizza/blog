import { forceCollide, forceX, forceY } from 'd3-force';

import type { GraphSettings } from '@/lib/api-client';

interface ForceCharge {
  strength: (value: number) => void;
}

interface ForceLink {
  distance: (value: number) => ForceLink;
  strength: (value: number) => void;
}

export interface ForceGraphLike {
  d3Force: (name: string, force?: unknown) => unknown;
  d3ReheatSimulation?: () => void;
}

type SimNode = {
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
};

function createGravityForce(strength: number) {
  let nodes: SimNode[] = [];

  const force = (alpha: number) => {
    const k = strength * alpha;
    for (const n of nodes) {
      if (typeof n.fx === 'number' && typeof n.fy === 'number') continue;
      if (typeof n.x === 'number') n.vx = (n.vx ?? 0) + (-n.x) * k;
      if (typeof n.y === 'number') n.vy = (n.vy ?? 0) + (-n.y) * k;
      if (typeof n.z === 'number') n.vz = (n.vz ?? 0) + (-n.z) * k;
    }
  };

  (force as { initialize?: (ns: SimNode[]) => void }).initialize = (ns: SimNode[]) => {
    nodes = ns;
  };

  return force;
}

interface ApplyGraphForcesArgs {
  fg: ForceGraphLike;
  settings: GraphSettings;
  is3D: boolean;
}

export function applyGraphForces({ fg, settings, is3D }: ApplyGraphForcesArgs) {
  const charge = fg.d3Force('charge') as ForceCharge | undefined;
  charge?.strength(settings.chargeStrength);

  const link = fg.d3Force('link') as ForceLink | undefined;
  link?.distance(settings.linkDistance).strength(settings.linkStrength);

  fg.d3Force('gravity', createGravityForce(settings.centerStrength));

  if (!is3D) {
    fg.d3Force('x', forceX(0).strength(settings.centerStrength));
    fg.d3Force('y', forceY(0).strength(settings.centerStrength));
    fg.d3Force('collide', forceCollide(settings.nodeRadius * 1.2).strength(0.7));
  }

  fg.d3ReheatSimulation?.();
}
