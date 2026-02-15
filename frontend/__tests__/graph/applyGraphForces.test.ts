import { describe, it, expect, vi } from 'vitest';

import { applyGraphForces } from '@/components/graph/physics/applyGraphForces';

type ForceCharge = { strength: (value: number) => void };
type ForceLink = { distance: (value: number) => ForceLink; strength: (value: number) => void };

interface ForceGraphLike {
  d3Force: (name: string, force?: unknown) => unknown;
  d3ReheatSimulation?: () => void;
}

describe('applyGraphForces', () => {
  it('applies Obsidian-like forces in 2D mode', () => {
    const chargeForce: ForceCharge = { strength: vi.fn() };
    const linkForce: ForceLink = {
      distance: vi.fn(() => linkForce),
      strength: vi.fn(),
    };

    const fg: ForceGraphLike = {
      d3Force: vi.fn((name: string) => {
        if (name === 'charge') return chargeForce;
        if (name === 'link') return linkForce;
        return undefined;
      }),
      d3ReheatSimulation: vi.fn(),
    };

    applyGraphForces({
      fg,
      is3D: false,
      settings: {
        nodeRadius: 20,
        chargeStrength: -3500,
        linkDistance: 200,
        linkStrength: 0.3,
        velocityDecay: 0.85,
        centerStrength: 0.05,
      },
    });

    expect(chargeForce.strength).toHaveBeenCalledWith(-3500);
    expect(linkForce.distance).toHaveBeenCalledWith(200);
    expect(linkForce.strength).toHaveBeenCalledWith(0.3);

    expect((fg.d3Force as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('x', expect.anything());
    expect((fg.d3Force as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('y', expect.anything());
    expect((fg.d3Force as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('gravity', expect.anything());
    expect((fg.d3Force as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('collide', expect.anything());

    expect(fg.d3ReheatSimulation).toHaveBeenCalled();
  });

  it('does not install 2D-only forces in 3D mode', () => {
    const chargeForce: ForceCharge = { strength: vi.fn() };
    const linkForce: ForceLink = {
      distance: vi.fn(() => linkForce),
      strength: vi.fn(),
    };

    const fg: ForceGraphLike = {
      d3Force: vi.fn((name: string) => {
        if (name === 'charge') return chargeForce;
        if (name === 'link') return linkForce;
        return undefined;
      }),
      d3ReheatSimulation: vi.fn(),
    };

    applyGraphForces({
      fg,
      is3D: true,
      settings: {
        nodeRadius: 20,
        chargeStrength: -3500,
        linkDistance: 200,
        linkStrength: 0.3,
        velocityDecay: 0.85,
        centerStrength: 0.05,
      },
    });

    expect(chargeForce.strength).toHaveBeenCalledWith(-3500);
    expect(linkForce.distance).toHaveBeenCalledWith(200);
    expect(linkForce.strength).toHaveBeenCalledWith(0.3);

    const calls = (fg.d3Force as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0]);
    expect(calls).toContain('gravity');
    expect(calls).not.toContain('x');
    expect(calls).not.toContain('y');
    expect(calls).not.toContain('collide');
  });
});
