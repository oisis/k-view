import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../ThemeContext';

export default function CodeEditor({ value, onChange, readOnly, fontSize = 13, language = 'yaml' }) {
    const { activeTheme } = useTheme();
    const lines = (value || '').split('\n');
    const lineCount = lines.length;
    const LINE_HEIGHT = '1.25rem';
    
    const isLightTheme = activeTheme === 'light';
    
    // Create a modified theme object to force transparent background while keeping syntax colors
    const baseStyle = isLightTheme ? prism : vscDarkPlus;
    const highlighterStyle = {
        ...baseStyle,
        'pre[class*="language-"]': {
            ...baseStyle['pre[class*="language-"]'],
            background: 'transparent',
            backgroundColor: 'transparent',
        },
        'code[class*="language-"]': {
            ...baseStyle['code[class*="language-"]'],
            background: 'transparent',
            backgroundColor: 'transparent',
        }
    };

    return (
        <div className="bg-transparent border-t border-border/20 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-[var(--border-color)] flex items-start relative">
                <div
                    className="sticky left-0 z-10 w-12 flex-shrink-0 bg-primary/5 border-r border-border/20 py-4 font-mono text-xs text-muted-foreground text-right pr-3 select-none"
                    style={{ fontSize: `${fontSize}px` }}
                >
                    {(lines || []).map((_, i) => (
                        <div key={i} style={{ height: LINE_HEIGHT, lineHeight: LINE_HEIGHT }}>{i + 1}</div>
                    ))}
                </div>

                {readOnly ? (
                    <div className="flex-1 min-w-0">
                        <SyntaxHighlighter
                            language={language}
                            style={highlighterStyle}
                            customStyle={{
                                margin: 0,
                                padding: '1rem',
                                background: 'transparent',
                                backgroundColor: 'transparent',
                                fontSize: `${fontSize}px`,
                                lineHeight: LINE_HEIGHT,
                                width: '100%',
                                overflow: 'visible'
                            }}
                            codeTagProps={{
                                style: {
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                                }
                            }}
                        >
                            {value}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className={`flex-1 p-4 font-mono bg-transparent outline-none resize-none focus:ring-0 overflow-hidden ${isLightTheme ? 'text-foreground' : 'text-[var(--text-editor-code)]'}`}
                        spellCheck="false"
                        rows={lineCount}
                        style={{ lineHeight: LINE_HEIGHT, display: 'block', fontSize: `${fontSize}px` }}
                    />
                )}
            </div>
        </div >
    );
}
