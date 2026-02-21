import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

const WELCOME = `K-View Kubernetes Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected to: k-view-dev-cluster
  kubectl commands are supported (alias: k)
  Type 'kubectl help' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

// Known mock namespaces and pod patterns for detection
const NAMESPACES = ['default', 'auth', 'database', 'messaging', 'monitoring', 'logging', 'ingress-nginx', 'cert-manager', 'kube-system', 'kube-public', 'kube-node-lease', 'database'];

const PROMPT = '❯';

const VERBS = ['get', 'describe', 'logs', 'top', 'delete', 'apply', 'edit', 'version', 'cluster-info'];
const RESOURCES = ['pods', 'nodes', 'svc', 'deploy', 'ns', 'all', 'pv', 'pvc', 'cm', 'secret', 'ing', 'events'];
const FLAGS = ['-A', '-o wide', '-n default', '-w', '--all-namespaces', '-o yaml'];

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

    // Robust Command fragment suggestions
    const suggestions = useMemo(() => {
        const trimmedInput = input.trim();
        const parts = trimmedInput.split(/\s+/);

        // Only suggest if we start with kubectl/k
        if (parts[0] !== 'kubectl' && parts[0] !== 'k') return null;

        // Find the Verb (first match from our known list after current 'kubectl' prefix)
        const verb = parts.slice(1).find(p => VERBS.includes(p));
        const verbIdx = verb ? parts.indexOf(verb) : -1;

        // Find the potential Resource (the first non-flag after the verb)
        // Or if no verb, check if any non-flag is present (unlikely for valid kubectl yet)
        const potentialResource = verbIdx !== -1
            ? parts.slice(verbIdx + 1).find(p => !p.startsWith('-'))
            : null;

        // Stage 1: No Verb -> suggest Actions
        // Also if we are at the very end of 'kubectl '
        if (!verb) {
            return {
                title: 'Actions',
                items: VERBS.map(v => ({ label: v, val: v }))
            };
        }

        // Stage 2: We have Verb but no Resource -> suggest Resources
        // (Certain verbs don't need resources, but for simple mock mode we assume they do)
        if (!potentialResource && !['version', 'cluster-info'].includes(verb)) {
            return {
                title: 'Resources',
                items: RESOURCES.map(r => ({ label: r, val: r }))
            };
        }

        // Stage 3: We have Verb and Resource -> suggest Flags
        // Filter out flags that are already in the command (checking by prefix like -n or -o)
        const currentFlags = parts.filter(p => p.startsWith('-'));
        const remainingFlags = FLAGS.filter(f => {
            const flagPrefix = f.split(' ')[0];
            return !currentFlags.some(cp => cp === flagPrefix || cp.startsWith(flagPrefix + '='));
        });

        if (remainingFlags.length > 0) {
            return {
                title: 'Options',
                items: remainingFlags.map(f => ({ label: f, val: f }))
            };
        }

        return null;
    }, [input]);

    // Tokenize line to find pod names or namespaces
    const renderLine = (line, exitCode, onTokenClick) => {
        let defaultColor = exitCode !== 0 ? 'text-red-400' : 'text-[var(--text-primary)]';
        if (/NotReady|CrashLoop|Error|Failed|Evicted|OOMKilled/i.test(line)) defaultColor = 'text-red-400';
        else if (/Warning|warn/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-yellow-400';
        else if (/Running|Ready|Active|True/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-green-400';

        const words = line.split(/(\s+)/);

        return words.map((word, idx) => {
            if (/^\s+$/.test(word)) return <span key={idx}>{word}</span>;

            if (NAMESPACES.includes(word)) {
                return (
                    <span
                        key={idx}
                        onClick={() => onTokenClick('ns', word)}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-blue-400 hover:bg-blue-900/30 px-0.5 -mx-0.5 rounded transition-all"
                        title="Click to add namespace to command"
                    >
                        {word}
                    </span>
                );
            }

            if (/[a-z0-9]+-[a-z0-9]{5,}(- [a-z0-9]{5,})?/.test(word) || (word.includes('-') && word.length > 8)) {
                if (!/Running|Ready|Active|True|CrashLoop|Error|Failed|Evicted|OOMKilled|Namespace|Name|Status|Age|Restarts/.test(word)) {
                    return (
                        <span
                            key={idx}
                            onClick={() => onTokenClick('pod', word)}
                            className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-blue-400 hover:bg-blue-900/30 px-0.5 -mx-0.5 rounded transition-all"
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
                if (trimmed.includes(`-n ${value}`) || trimmed.includes(`--namespace ${value}`)) return prev;
                return `${trimmed} -n ${value} `;
            }
            if (trimmed.endsWith(value)) return prev;
            return `${trimmed} ${value} `;
        });
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const handleSuggestionClick = (val) => {
        setInput(prev => {
            // Append with space, ensuring we don't have double spaces
            const trimmed = prev.trim();
            return trimmed + ' ' + val + ' ';
        });
        setTimeout(() => inputRef.current?.focus(), 10);
    };

    const runCommand = useCallback(async (raw) => {
        const cmd = raw.trim();
        if (!cmd) return;

        if (bannerVisible) {
            setBannerVisible(false);
            setHistory([{ type: 'cmd', text: cmd }]);
        } else {
            setHistory(h => [...h, { type: 'cmd', text: cmd }]);
        }

        setCmdHistory(h => [cmd, ...h]);
        setHistIdx(-1);
        setInput('kubectl ');
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
            if (next >= 0) setInput(cmdHistory[next]);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = histIdx - 1;
            setHistIdx(next);
            if (next < 0) setInput('kubectl ');
            else setInput(cmdHistory[next]);
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setBannerVisible(false);
            setHistory([]);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setHistory(h => [...h, { type: 'cmd', text: input + ' ^C' }]);
            setInput('kubectl ');
        } else if (e.key === 'Backspace' && input === 'kubectl ') {
            e.preventDefault();
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        if (val.startsWith('kubectl ')) setInput(val);
        else if ('kubectl '.startsWith(val)) setInput('kubectl ');
        else setInput('kubectl ' + val.trim());
    };

    return (
        <div className="flex flex-col h-full bg-[var(--bg-console)] transition-colors duration-200">
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
                            <div className="text-green-400 mb-3 whitespace-pre">{entry.text}</div>
                        )}
                        {entry.type === 'cmd' && (
                            <div className="flex items-start gap-2 text-blue-400">
                                <span className="shrink-0">{PROMPT}</span>
                                <span className="text-white font-bold">{entry.text}</span>
                            </div>
                        )}
                        {entry.type === 'output' && (
                            <div className="ml-4 mb-2 whitespace-pre text-[var(--text-primary)]">
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
                    <div className="flex items-center gap-2 ml-4 text-[var(--text-muted)] mt-1">
                        <span className="animate-pulse">●</span> Running...
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input & Suggestions row */}
            <div className="border-t border-[var(--border-color)] bg-[var(--bg-card)]/80 flex flex-col shrink-0">
                {/* Suggestions bar */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-color)] h-10 overflow-x-auto no-scrollbar">
                    {suggestions ? (
                        <>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest shrink-0 mr-2">{suggestions.title}:</span>
                            {suggestions.items.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSuggestionClick(s.val)}
                                    className="px-2.5 py-1 bg-[var(--bg-muted)] hover:bg-blue-900/40 text-[var(--text-secondary)] hover:text-blue-300 border border-[var(--border-color)] hover:border-blue-700/50 rounded text-xs transition-all whitespace-nowrap"
                                >
                                    {s.label}
                                </button>
                            ))}
                        </>
                    ) : (
                        <span className="text-[10px] text-[var(--text-muted)] italic">Type space or more characters to see suggestions...</span>
                    )}
                </div>

                {/* Input row */}
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
                        className="flex-1 bg-transparent outline-none text-[var(--text-white)] font-mono caret-blue-400"
                    />
                </div>

                {/* Hint / Toolbar */}
                <div className="px-4 py-1.5 flex gap-4 text-[10px] text-[var(--text-muted)] border-t border-[var(--border-color)] uppercase tracking-widest">
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-[var(--text-muted)]">Enter</kbd> execute</span>
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-[var(--text-muted)]">Arrows</kbd> history</span>
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-[var(--text-muted)]">Ctrl+L</kbd> clear</span>
                    <span className="ml-auto opacity-50">Tip: Click output tokens or use suggestions above</span>
                </div>
            </div>
        </div>
    );
}
