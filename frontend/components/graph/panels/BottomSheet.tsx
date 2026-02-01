'use client';

import { ReactNode } from 'react';
import { Drawer } from 'vaul';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  'data-testid'?: string;
}

export function BottomSheet({ title, onClose, children, 'data-testid': testId }: Props) {
  return (
    <Drawer.Root open onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Drawer.Content
          data-testid={testId}
          className="fixed bottom-0 left-0 right-0 bg-panel rounded-t-2xl z-50 flex flex-col max-h-[90vh] outline-none"
        >
          <div className="flex flex-col items-center pt-3 pb-2">
            <Drawer.Handle className="w-12 h-1.5 bg-muted-foreground rounded-full" />
          </div>

          <div className="px-4 pb-3 flex justify-between items-center border-b border-border">
            <Drawer.Title className="text-lg font-bold text-foreground">
              {title}
            </Drawer.Title>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-xl p-1 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="px-4 py-4 overflow-y-auto flex-1">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
