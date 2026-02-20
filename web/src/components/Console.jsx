import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Terminal, RotateCcw, Copy, Check } from 'lucide-react';

const WELCOME = `K-View Kubernetes Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected to: k-view-dev-cluster
  kubectl commands are supported (alias: k)
  Type 'kubectl help' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

const PROMPT = '❯';

function colorizeOutput(text, exitCode) {
    // Color lines that indicate errors or warnings
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
    const [history, setHistory] = useState([
        { type: 'banner', text: WELCOME }
    ]);
    const [input, setInput] = useState('');
    const [cmdHistory, setCmdHistory] = useState([]);   // previous commands
    const [histIdx, setHistIdx] = useState(-1);          // navigating history
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Focus input on mount and on click anywhere in the terminal
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const runCommand = useCallback(async (raw) => {
        const cmd = raw.trim();
        if (!cmd) return;

        // Add command to visual history
        setHistory(h => [...h, { type: 'cmd', text: cmd }]);
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
    }, []);

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
            setHistory([{ type: 'banner', text: WELCOME }]);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setHistory(h => [...h, { type: 'cmd', text: input + ' ^C' }]);
            setInput('');
        }
    };

    const handleCopyAll = () => {
        const text = history.map(e => e.type === 'cmd' ? `${PROMPT} ${e.text}` : e.text).join('\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Terminal size={22} className="text-green-400" />
                        Console
                    </h2>
                    <p className="text-gray-400 text-sm">kubectl / k — direct Kubernetes access</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setHistory([{ type: 'banner', text: WELCOME }])}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-1.5 rounded transition-colors"
                        title="Clear terminal"
                    >
                        <RotateCcw size={12} /> Clear
                    </button>
                    <button
                        onClick={handleCopyAll}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-3 py-1.5 rounded transition-colors"
                    >
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            {/* Terminal window */}
            <div
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg overflow-auto flex flex-col font-mono text-sm cursor-text"
                onClick={() => inputRef.current?.focus()}
            >
                {/* Window chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-800/80 border-b border-gray-700 shrink-0">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                    <span className="ml-2 text-xs text-gray-500">k-view — kubectl</span>
                </div>

                {/* Output area */}
                <div className="flex-1 p-4 overflow-auto whitespace-pre-wrap leading-relaxed">
                    {history.map((entry, i) => {
                        if (entry.type === 'banner') {
                            return <div key={i} className="text-green-400 mb-3">{entry.text}</div>;
                        }
                        if (entry.type === 'cmd') {
                            return (
                                <div key={i} className="flex items-start gap-2 mt-1">
                                    <span className="text-blue-400 shrink-0 select-none">{PROMPT}</span>
                                    <span className="text-white">{entry.text}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={i} className="mt-0.5 ml-4 mb-2">
                                {colorizeOutput(entry.text, entry.exitCode)}
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="flex items-center gap-2 ml-4 text-gray-500 mt-1">
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
            <div className="mt-2 flex gap-4 text-xs text-gray-600">
                <span><kbd className="bg-gray-800 px-1 rounded">Enter</kbd> run</span>
                <span><kbd className="bg-gray-800 px-1 rounded">↑↓</kbd> history</span>
                <span><kbd className="bg-gray-800 px-1 rounded">Ctrl+L</kbd> clear</span>
                <span><kbd className="bg-gray-800 px-1 rounded">Ctrl+C</kbd> cancel</span>
                <span className="ml-auto">alias: <code className="text-gray-500">k</code> = <code className="text-gray-500">kubectl</code></span>
            </div>
        </div>
    );
}
