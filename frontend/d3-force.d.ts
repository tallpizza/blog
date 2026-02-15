declare module 'd3-force' {
  export interface SimulationNodeDatum {
    index?: number;
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
  }

  export interface Force<NodeDatum extends SimulationNodeDatum> {
    (alpha: number): void;
    initialize?: (nodes: NodeDatum[]) => void;
  }

  export interface ForceCollide<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    radius: (radius: number | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number)) => this;
    strength: (strength: number) => this;
    iterations: (iterations: number) => this;
  }

  export function forceCollide<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(
    radius?: number
  ): ForceCollide<NodeDatum>;

  export interface ForceX<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    x: (x: number | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number)) => this;
    strength: (strength: number) => this;
  }

  export function forceX<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(x?: number): ForceX<NodeDatum>;

  export interface ForceY<NodeDatum extends SimulationNodeDatum> extends Force<NodeDatum> {
    y: (y: number | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number)) => this;
    strength: (strength: number) => this;
  }

  export function forceY<NodeDatum extends SimulationNodeDatum = SimulationNodeDatum>(y?: number): ForceY<NodeDatum>;
}
