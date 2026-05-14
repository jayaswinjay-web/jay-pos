import { useEffect, useCallback } from 'react';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[], enabled: boolean = true) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Only allow Escape in inputs
      if (e.key !== 'Escape') return;
    }

    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        e.preventDefault();
        shortcut.handler();
        return;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: ShortcutHandler[] }) {
  const formatShortcut = (s: ShortcutHandler) => {
    const parts = [];
    if (s.ctrl) parts.push('Ctrl');
    if (s.alt) parts.push('Alt');
    if (s.shift) parts.push('Shift');
    parts.push(s.key.toUpperCase());
    return parts.join(' + ');
  };

  return (
    <div className="space-y-2">
      {shortcuts.map((s, idx) => (
        <div key={idx} className="flex justify-between text-sm">
          <span className="text-muted-foreground">{s.description}</span>
          <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
            {formatShortcut(s)}
          </kbd>
        </div>
      ))}
    </div>
  );
}