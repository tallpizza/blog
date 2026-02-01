'use client';

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isProcessing?: boolean;
}

export function UndoRedoButtons({ canUndo, canRedo, onUndo, onRedo, isProcessing }: Props) {
  return (
    <div className="flex gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo || isProcessing}
        className="p-2 bg-card hover:bg-accent disabled:bg-muted disabled:text-muted-foreground text-foreground rounded transition-colors"
        title="Undo (Ctrl+Z)"
        data-testid="undo-btn"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo || isProcessing}
        className="p-2 bg-card hover:bg-accent disabled:bg-muted disabled:text-muted-foreground text-foreground rounded transition-colors"
        title="Redo (Ctrl+Shift+Z)"
        data-testid="redo-btn"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>
  );
}
