import { useState, useEffect } from 'react';

/**
 * Keyboard shortcuts hook with help modal
 */
export function useKeyboardShortcuts(shortcuts) {
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            shortcuts.forEach(({ key, ctrl, shift, alt, callback }) => {
                const ctrlMatch = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey;
                const shiftMatch = shift ? e.shiftKey : !e.shiftKey;
                const altMatch = alt ? e.altKey : !e.altKey;
                const keyMatch = e.key.toLowerCase() === key.toLowerCase();

                if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                    e.preventDefault();
                    callback(e);
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Keyboard shortcuts help modal
 */
export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6">
            <div className="glass w-full max-w-2xl p-10 rounded-[40px] border-white/10 relative max-h-[80vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors"
                >
                    ✕
                </button>

                <h3 className="text-3xl font-black title-font mb-2 uppercase">
                    Keyboard Shortcuts
                </h3>
                <p className="text-sm text-slate-400 mb-8">
                    Navigate faster with these keyboard shortcuts
                </p>

                <div className="space-y-4">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
                        >
                            <span className="text-sm text-slate-300 font-medium">
                                {shortcut.description}
                            </span>
                            <div className="flex items-center gap-2">
                                {shortcut.ctrl && (
                                    <kbd className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-mono border border-slate-600">
                                        {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                                    </kbd>
                                )}
                                {shortcut.shift && (
                                    <kbd className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-mono border border-slate-600">
                                        Shift
                                    </kbd>
                                )}
                                {shortcut.alt && (
                                    <kbd className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-xs font-mono border border-slate-600">
                                        Alt
                                    </kbd>
                                )}
                                <kbd className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-mono border border-amber-500">
                                    {shortcut.key.toUpperCase()}
                                </kbd>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">
                        Pro Tip
                    </p>
                    <p className="text-sm text-slate-300">
                        Press <kbd className="px-2 py-1 bg-slate-700 rounded text-xs font-mono">?</kbd> anytime to view this help menu
                    </p>
                </div>
            </div>
        </div>
    );
}
