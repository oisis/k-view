import React, { useState, useRef, useEffect, useCallback } from 'react';

const WELCOME = `K-View Kubernetes Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected to: k-view-dev-cluster
  kubectl commands are supported (alias: k)
  Type 'kubectl help' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

const PROMPT = '❯';

function colorizeOutput(text, exitCode) {
    return text.split('\n').map((line, i) => {
        let color = 'text-gray-200';
        if (exitCode !== 0) color = 'text-red-400';
        else if (/NotReady|CrashLoop|Error|Failed|Evicted|OOMKilled/i.test(line)) color = 'text-red-400';
        else if (/Warning|warn/i.test(line) && !line.startsWith('NAME')) color = 'text-yellow-400';
        else if (/Running|Ready|Active|True/i.test(line) && !line.startsWith('NAME')) color = 'text-green-400';
        return <span key={i} className={color}>{line}{'\n'}</span>;
    });
}

export default function Console() {
    // Show banner only on first render; cleared after first command
    const [history, setHistory] = useState([
        { type: 'banner', text: WELCOME }
    ]);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [input, setInput] = useState('');
    const [cmdHistory, setCmdHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [loading, setLoading] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const runCommand = useCallback(async (raw) => {
        const cmd = raw.trim();
        if (!cmd) return;

        // Hide banner on first command
        const newHistory = bannerVisible
            ? [{ type: 'cmd', text: cmd }]          // drop banner
            : (h => [...h, { type: 'cmd', text: cmd }])(history); // append

        if (bannerVisible) {
            setBannerVisible(false);
            setHistory([{ type: 'cmd', text: cmd }]);
        } else {
            setHistory(h => [...h, { type: 'cmd', text: cmd }]);
        }

        setCmdHistory(h => [cmd, ...h]);
        setHistIdx(-1);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/console/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd }),
            });
            const data = await res.json();
            const text = data.output ?? data.error ?? 'No output.';
            const exitCode = data.exitCode ?? (res.ok ? 0 : 1);
            setHistory(h => [...h, { type: 'output', text, exitCode }]);
        } catch {
            setHistory(h => [...h, { type: 'output', text: 'Connection error: unable to reach backend.', exitCode: 1 }]);
        } finally {
            setLoading(false);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [bannerVisible, history]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            runCommand(input);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(histIdx + 1, cmdHistory.length - 1);
            setHistIdx(next);
            setInput(cmdHistory[next] ?? '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = histIdx - 1;
            if (next < 0) { setHistIdx(-1); setInput(''); return; }
            setHistIdx(next);
            setInput(cmdHistory[next] ?? '');
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setBannerVisible(false);
            setHistory([]);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setHistory(h => [...h, { type: 'cmd', text: input + ' ^C' }]);
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Terminal window — full height, no outer header */}
            <div
                className="flex-1 bg-gray-950 overflow-auto flex flex-col font-mono text-sm"
                onClick={(e) => {
                    // Only focus input if user isn't trying to select text
                    if (!window.getSelection()?.toString()) {
                        inputRef.current?.focus();
                    }
                }}
            >
                {/* Output area — selectable */}
                <div className="flex-1 p-4 overflow-auto whitespace-pre-wrap leading-relaxed select-text cursor-text">
                    {history.map((entry, i) => {
                        if (entry.type === 'banner') {
                            return <div key={i} className="text-green-400 mb-3 select-text">{entry.text}</div>;
                        }
                        if (entry.type === 'cmd') {
                            return (
                                <div key={i} className="flex items-start gap-2 mt-1 select-text">
                                    <span className="text-blue-400 shrink-0">{PROMPT}</span>
                                    <span className="text-white">{entry.text}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="mt-0.5 ml-4 mb-2 select-text">
                                {colorizeOutput(entry.text, entry.exitCode)}
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="flex items-center gap-2 ml-4 text-gray-500 mt-1 select-none">
                            <span className="animate-pulse">●</span> Running...
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2 border-t border-gray-800 px-4 py-3 shrink-0">
                    <span className="text-blue-400 select-none">{PROMPT}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        placeholder={loading ? 'Running...' : 'kubectl get pods'}
                        className="flex-1 bg-transparent outline-none text-white placeholder-gray-600 caret-blue-400"
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                </div>
            </div>

            {/* Hint bar */}
            <div className="px-4 py-1.5 flex gap-4 text-xs text-gray-600 border-t border-gray-800 bg-gray-900 shrink-0">
                <span><kbd className="bg-gray-800 px-1 rounded">Enter</kbd> run</span>
                <span><kbd className="bg-gray-800 px-1 rounded">↑↓</kbd> history</span>
                <span><kbd className="bg-gray-800 px-1 rounded">Ctrl+L</kbd> clear</span>
                <span><kbd className="bg-gray-800 px-1 rounded">Ctrl+C</kbd> cancel</span>
                <span className="ml-auto">alias: <code className="text-gray-500">k</code> = <code className="text-gray-500">kubectl</code></span>
            </div>
        </div>
    );
}
