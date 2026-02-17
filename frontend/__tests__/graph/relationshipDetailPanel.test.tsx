import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

import { RelationshipDetailPanel } from '@/components/graph/panels/RelationshipDetailPanel';

vi.mock('@/components/graph/panels/BottomSheet', () => ({
  BottomSheet: ({ children, onClose }: { children: ReactNode; onClose: () => void }) => (
    <div>
      <button onClick={onClose}>close-sheet</button>
      {children}
    </div>
  ),
}));

vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockObsidianEditor({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) {
      return (
        <textarea
          aria-label="obsidian-editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    };
  },
}));

const updateRelationshipMock = vi.fn();

vi.mock('@/lib/api-client', () => ({
  api: {
    updateRelationship: (...args: unknown[]) => updateRelationshipMock(...args),
  },
}));

describe('RelationshipDetailPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateRelationshipMock.mockResolvedValue({});
  });

  it('saves pending changes when closing panel', async () => {
    const onClose = vi.fn();

    render(
      <RelationshipDetailPanel
        relationship={{
          id: 'rel-1',
          type: 'RELATES_TO',
          startNode: 'a',
          endNode: 'b',
          properties: { text: 'before' },
        }}
        onClose={onClose}
        onDelete={vi.fn()}
        deleting={false}
        isMobile
      />
    );

    fireEvent.change(screen.getByLabelText('obsidian-editor'), {
      target: { value: 'after' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'close-sheet' }));

    await waitFor(
      () => {
        expect(updateRelationshipMock).toHaveBeenCalledWith('rel-1', { text: 'after' });
      },
      { timeout: 400 }
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
