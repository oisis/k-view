import React, { useState, useRef, useEffect, useCallback } from 'react';

const WELCOME = `K-View Kubernetes Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected to: k-view-dev-cluster
  kubectl commands are supported (alias: k)
  Type 'kubectl help' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

// Known mock namespaces and pod patterns for detection
const NAMESPACES = ['default', 'auth', 'database', 'messaging', 'monitoring', 'logging', 'ingress-nginx', 'cert-manager', 'kube-system', 'kube-public', 'kube-node-lease', 'database'];

const PROMPT = '❯';

export default function Console() {
    // Input always starts with "kubectl "
    const [input, setInput] = useState('kubectl ');
    const [history, setHistory] = useState([
        { type: 'banner', text: WELCOME }
    ]);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [cmdHistory, setCmdHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [loading, setLoading] = useState(false);

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Initial focus
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Tokenize line to find pod names or namespaces
    const renderLine = (line, exitCode, onTokenClick) => {
        let defaultColor = exitCode !== 0 ? 'text-red-400' : 'text-gray-200';
        if (/NotReady|CrashLoop|Error|Failed|Evicted|OOMKilled/i.test(line)) defaultColor = 'text-red-400';
        else if (/Warning|warn/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-yellow-400';
        else if (/Running|Ready|Active|True/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-green-400';

        // Split line into words to detect interactive tokens
        const words = line.split(/(\s+)/);

        return words.map((word, idx) => {
            if (/^\s+$/.test(word)) return <span key={idx}>{word}</span>;

            // Check if word looks like a namespace
            if (NAMESPACES.includes(word)) {
                return (
                    <span
                        key={idx}
                        onClick={() => onTokenClick('ns', word)}
                        className="cursor-pointer font-bold underline decoration-dotted underline-offset-2 hover:text-blue-400 transition-colors"
                        title="Click to add namespace to command"
                    >
                        {word}
                    </span>
                );
            }

            // Check if word looks like a pod name (e.g., frontend-web-5d8f7b)
            // Pattern: letters/numbers/dashes, usually with a hash-like suffix
            if (/[a-z0-9]+-[a-z0-9]{5,}(- [a-z0-9]{5,})?/.test(word) || (word.includes('-') && word.length > 8)) {
                // If it's not a known status or something else
                if (!/Running|Ready|Active|True|CrashLoop|Error|Failed|Evicted|OOMKilled|Namespace|Name|Status|Age|Restarts/.test(word)) {
                    return (
                        <span
                            key={idx}
                            onClick={() => onTokenClick('pod', word)}
                            className="cursor-pointer font-bold underline decoration-dotted underline-offset-2 hover:text-blue-400 transition-colors"
                            title="Click to add pod name to command"
                        >
                            {word}
                        </span>
                    );
                }
            }

            return <span key={idx} className={defaultColor}>{word}</span>;
        });
    };

    const appendToInput = (type, value) => {
        setInput(prev => {
            const trimmed = prev.trim();
            if (type === 'ns') {
                // Add -n namespace if not already present for this namespace
                if (trimmed.includes(`-n ${value}`) || trimmed.includes(`--namespace ${value}`)) return prev;
                return `${trimmed} -n ${value} `;
            }
            // Just add pod name
            if (trimmed.endsWith(value)) return prev;
            return `${trimmed} ${value} `;
        });
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const runCommand = useCallback(async (raw) => {
        const cmd = raw.trim();
        if (!cmd) return;

        // Hide banner on first command
        if (bannerVisible) {
            setBannerVisible(false);
            setHistory([{ type: 'cmd', text: cmd }]);
        } else {
            setHistory(h => [...h, { type: 'cmd', text: cmd }]);
        }

        setCmdHistory(h => [cmd, ...h]);
        setHistIdx(-1);
        setInput('kubectl '); // Reset to kubectl prefix
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
    }, [bannerVisible]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            runCommand(input);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(histIdx + 1, cmdHistory.length - 1);
            setHistIdx(next);
            if (next >= 0) {
                setInput(cmdHistory[next]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = histIdx - 1;
            setHistIdx(next);
            if (next < 0) {
                setInput('kubectl ');
            } else {
                setInput(cmdHistory[next]);
            }
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setBannerVisible(false);
            setHistory([]);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setHistory(h => [...h, { type: 'cmd', text: input + ' ^C' }]);
            setInput('kubectl ');
        } else if (e.key === 'Backspace' && input === 'kubectl ') {
            // Prevent deleting the prefix
            e.preventDefault();
        }
    };

    // Ensure input always starts with kubectl
    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val.startsWith('kubectl ')) {
            setInput(val);
        } else if ('kubectl '.startsWith(val)) {
            // User tried to delete part of prefix
            setInput('kubectl ');
        } else {
            // User pasted something without prefix? Let's just prepend it.
            setInput('kubectl ' + val.trim());
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-950">
            {/* Terminal output container */}
            <div
                className="flex-1 overflow-auto flex flex-col font-mono text-sm p-4 leading-relaxed cursor-text"
                onClick={(e) => {
                    if (!window.getSelection()?.toString()) {
                        inputRef.current?.focus();
                    }
                }}
            >
                {history.map((entry, i) => (
                    <div key={i} className="mb-1">
                        {entry.type === 'banner' && (
                            <div className="text-green-400 mb-3 whitespace-pre-wrap">{entry.text}</div>
                        )}
                        {entry.type === 'cmd' && (
                            <div className="flex items-start gap-2 text-blue-400">
                                <span className="shrink-0">{PROMPT}</span>
                                <span className="text-white font-bold">{entry.text}</span>
                            </div>
                        )}
                        {entry.type === 'output' && (
                            <div className="ml-4 mb-2">
                                {entry.text.split('\n').map((line, li) => (
                                    <div key={li} className="min-h-[1.25rem]">
                                        {renderLine(line, entry.exitCode, appendToInput)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2 ml-4 text-gray-500 mt-1">
                        <span className="animate-pulse">●</span> Running...
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input row */}
            <div className="border-t border-gray-800 bg-gray-900/50 flex flex-col shrink-0">
                <div className="flex items-center gap-2 px-4 py-3">
                    <span className="text-blue-400 font-mono font-bold select-none">{PROMPT}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        spellCheck={false}
                        autoComplete="off"
                        className="flex-1 bg-transparent outline-none text-white font-mono caret-blue-400"
                    />
                </div>

                {/* Hint / Toolbar */}
                <div className="px-4 py-1.5 flex gap-4 text-[10px] text-gray-500 border-t border-gray-800/50 uppercase tracking-widest">
                    <span><kbd className="bg-gray-800 px-1 rounded text-gray-400">Enter</kbd> execute</span>
                    <span><kbd className="bg-gray-800 px-1 rounded text-gray-400">Arrows</kbd> history</span>
                    <span><kbd className="bg-gray-800 px-1 rounded text-gray-400">Ctrl+L</kbd> clear</span>
                    <span className="ml-auto opacity-50">Tip: Click Namespaces or Pods to build commands</span>
                </div>
            </div>
        </div>
    );
}
