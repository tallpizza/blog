'use client';

import React, { useCallback, useMemo, useImperativeHandle, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { 
  EditorView, 
  Decoration, 
  DecorationSet, 
  ViewPlugin, 
  ViewUpdate,
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

const markdownHighlighting = HighlightStyle.define([
  { tag: tags.heading1, fontSize: '1.75em', fontWeight: '700', color: '#f9fafb' },
  { tag: tags.heading2, fontSize: '1.5em', fontWeight: '600', color: '#f3f4f6' },
  { tag: tags.heading3, fontSize: '1.25em', fontWeight: '600', color: '#e5e7eb' },
  { tag: tags.heading4, fontSize: '1.1em', fontWeight: '600', color: '#d1d5db' },
  { tag: tags.heading5, fontSize: '1em', fontWeight: '600', color: '#d1d5db' },
  { tag: tags.heading6, fontSize: '0.9em', fontWeight: '600', color: '#9ca3af' },
  { tag: tags.strong, fontWeight: '700', color: '#fbbf24' },
  { tag: tags.emphasis, fontStyle: 'italic', color: '#a78bfa' },
  { tag: tags.strikethrough, textDecoration: 'line-through', color: '#6b7280' },
  { tag: tags.monospace, fontFamily: 'ui-monospace, monospace', backgroundColor: '#374151', borderRadius: '3px' },
  { tag: tags.link, color: '#60a5fa', textDecoration: 'underline' },
  { tag: tags.url, color: '#60a5fa' },
  { tag: tags.quote, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.list, color: '#10b981' },
  { tag: tags.processingInstruction, color: '#6b7280' },
]);

const hiddenMark = Decoration.mark({ class: 'cm-hidden-syntax' });
const heading1Line = Decoration.line({ class: 'cm-heading-line cm-heading-1' });
const heading2Line = Decoration.line({ class: 'cm-heading-line cm-heading-2' });
const heading3Line = Decoration.line({ class: 'cm-heading-line cm-heading-3' });
const heading4Line = Decoration.line({ class: 'cm-heading-line cm-heading-4' });
const heading5Line = Decoration.line({ class: 'cm-heading-line cm-heading-5' });
const heading6Line = Decoration.line({ class: 'cm-heading-line cm-heading-6' });
const quoteLine = Decoration.line({ class: 'cm-quote-line' });

function createObsidianPlugin() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.buildDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = this.buildDecorations(update.view);
        }
      }

      buildDecorations(view: EditorView): DecorationSet {
        const widgets: { from: number; to: number; deco: Decoration }[] = [];
        const lineDecos: { pos: number; deco: Decoration }[] = [];
        const hasFocus = view.hasFocus;
        const cursorLine = hasFocus ? view.state.doc.lineAt(view.state.selection.main.head).number : -1;

        syntaxTree(view.state).iterate({
          enter: (node) => {
            const line = view.state.doc.lineAt(node.from);
            const lineNum = line.number;
            const isCurrentLine = lineNum === cursorLine;
            const nodeType = node.name;

            if (nodeType.startsWith('ATXHeading')) {
              const level = parseInt(nodeType.replace('ATXHeading', '')) || 1;
              const headingDecos = [heading1Line, heading2Line, heading3Line, heading4Line, heading5Line, heading6Line];
              lineDecos.push({ pos: line.from, deco: headingDecos[level - 1] || heading1Line });
            }

            if (nodeType === 'Blockquote') {
              lineDecos.push({ pos: line.from, deco: quoteLine });
            }

            if (!isCurrentLine) {
              if (nodeType === 'HeaderMark') {
                const nextChar = view.state.sliceDoc(node.to, node.to + 1);
                const endPos = nextChar === ' ' ? node.to + 1 : node.to;
                widgets.push({ from: node.from, to: endPos, deco: hiddenMark });
              }

              if (nodeType === 'EmphasisMark') {
                widgets.push({ from: node.from, to: node.to, deco: hiddenMark });
              }

              if (nodeType === 'CodeMark') {
                widgets.push({ from: node.from, to: node.to, deco: hiddenMark });
              }

              if (nodeType === 'StrikethroughMark') {
                widgets.push({ from: node.from, to: node.to, deco: hiddenMark });
              }

              if (nodeType === 'QuoteMark') {
                const nextChar = view.state.sliceDoc(node.to, node.to + 1);
                const endPos = nextChar === ' ' ? node.to + 1 : node.to;
                widgets.push({ from: node.from, to: endPos, deco: hiddenMark });
              }

              if (nodeType === 'ListMark') {
                // Only hide unordered list markers (-, *, +), keep ordered list markers (1., 2., etc.) visible
                const markerText = view.state.sliceDoc(node.from, node.to);
                const isUnorderedMarker = /^[-*+]$/.test(markerText.trim());
                if (isUnorderedMarker) {
                  widgets.push({ from: node.from, to: node.to, deco: hiddenMark });
                }
              }

              if (nodeType === 'LinkMark') {
                widgets.push({ from: node.from, to: node.to, deco: hiddenMark });
              }

              if (nodeType === 'URL') {
                const prevChar = view.state.sliceDoc(node.from - 1, node.from);
                const nextChar = view.state.sliceDoc(node.to, node.to + 1);
                if (prevChar === '(' && nextChar === ')') {
                  widgets.push({ from: node.from - 1, to: node.to + 1, deco: hiddenMark });
                }
              }
            }
          },
        });

        widgets.sort((a, b) => a.from - b.from);
        lineDecos.sort((a, b) => a.pos - b.pos);

        const builder = new RangeSetBuilder<Decoration>();

        const seenLinePos = new Set<number>();
        for (const { pos, deco } of lineDecos) {
          if (!seenLinePos.has(pos)) {
            seenLinePos.add(pos);
            builder.add(pos, pos, deco);
          }
        }

        for (const { from, to, deco } of widgets) {
          builder.add(from, to, deco);
        }

        return builder.finish();
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

const obsidianTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1f2937',
    color: '#e5e7eb',
    fontSize: '15px',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-scroller': {
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    lineHeight: '1.7',
  },
  '.cm-content': {
    padding: '16px',
    caretColor: '#60a5fa',
  },
  '.cm-line': {
    padding: '2px 0',
  },
  '.cm-cursor': {
    borderLeftColor: '#60a5fa',
    borderLeftWidth: '2px',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(96, 165, 250, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(96, 165, 250, 0.3) !important',
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-hidden-syntax': {
    fontSize: '0 !important',
    width: '0 !important',
    display: 'inline-block',
    overflow: 'hidden',
    verticalAlign: 'baseline',
    color: 'transparent',
  },
  '.cm-heading-line': {
    position: 'relative',
  },
  '.cm-heading-1': { fontSize: '1.75em', lineHeight: '1.3' },
  '.cm-heading-2': { fontSize: '1.5em', lineHeight: '1.35' },
  '.cm-heading-3': { fontSize: '1.25em', lineHeight: '1.4' },
  '.cm-heading-4': { fontSize: '1.1em', lineHeight: '1.45' },
  '.cm-heading-5': { fontSize: '1em', lineHeight: '1.5' },
  '.cm-heading-6': { fontSize: '0.9em', lineHeight: '1.5' },
  '.cm-quote-line': {
    borderLeft: '3px solid #4b5563',
    paddingLeft: '12px !important',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  '.cm-gutters': {
    display: 'none',
  },
});

export interface ObsidianEditorRef {
  setValue: (value: string) => void;
}

interface ObsidianEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  minHeight?: string;
  innerRef?: React.RefObject<ObsidianEditorRef | null>;
}

export function ObsidianEditor({ value, onChange, className, minHeight = '200px', innerRef }: ObsidianEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(innerRef, () => ({
    setValue: (newValue: string) => {
      const view = editorRef.current?.view;
      if (view) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: newValue },
        });
      }
    },
  }));

    const extensions = useMemo(
      () => [
        markdown(),
        syntaxHighlighting(markdownHighlighting),
        createObsidianPlugin(),
        obsidianTheme,
        EditorView.lineWrapping,
      ],
      []
    );

    const handleChange = useCallback(
      (val: string) => {
        onChange(val);
      },
      [onChange]
    );

    return (
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={handleChange}
        extensions={extensions}
        theme="dark"
        className={`rounded-lg overflow-hidden border border-gray-700 ${className || ''}`}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          drawSelection: true,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLineGutter: false,
          indentOnInput: false,
        }}
        minHeight={minHeight}
      />
    );
  }
