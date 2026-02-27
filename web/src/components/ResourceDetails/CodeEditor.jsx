import React from 'react';

export default function CodeEditor({ value, onChange, readOnly, fontSize = 12 }) {
    const lines = value.split('\n');
    const lineCount = lines.length;
    const LINE_HEIGHT = '1.6rem';

    return (
        <div className="bg-main/20 border-t border-border/20 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] flex items-start">
                <div
                    className="sticky left-0 z-10 w-12 flex-shrink-0 bg-[var(--bg-sidebar)] border-r border-border/20 py-4 font-mono text-[var(--font-size-xs)] text-text-muted text-right pr-3 select-none"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {lines.map((_, i) => (
                        <div key={i} style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}>{i + 1}</div>
                    ))}
                </div>

                {readOnly ? (
                    <pre
                        className="flex-1 p-4 font-mono text-[var(--text-editor-code)] whitespace-pre"
                        style={{ lineHeight: LINE_HEIGHT, fontSize: `${fontSize}px` }}
                    >
                        {value}
                    </pre>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="flex-1 p-4 font-mono bg-transparent text-[var(--text-editor-code)] outline-none resize-none focus:ring-0 overflow-hidden"
                        spellCheck="false"
                        rows={lineCount}
                        style={{ lineHeight: LINE_HEIGHT, display: 'block', fontSize: `${fontSize}px` }}
                    />
                )}
            </div>
        </div >
    );
}
