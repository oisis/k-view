import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';

const WELCOME = `K-View Kubernetes Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected to: k-view-dev-cluster
  Type 'kubectl help' for available commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

// Dynamic namespaces will be fetched
const PROMPT = '❯';

const VERBS = ['get', 'describe', 'logs', 'top', 'delete', 'apply', 'edit', 'version', 'cluster-info'];
const RESOURCES = ['pods', 'nodes', 'svc', 'deploy', 'ns', 'all', 'pv', 'pvc', 'cm', 'secret', 'ing', 'events'];
const FLAGS = ['-A', '-o wide', '-w', '--all-namespaces', '-o yaml'];

export default function Console() {
    const [selectedNs, setSelectedNs] = useState('');
    const [nsMenuOpen, setNsMenuOpen] = useState(false);
    const [nsBtnRect, setNsBtnRect] = useState(null);
    // Input always starts with "kubectl " or "kubectl -n <ns> "
    const [input, setInput] = useState('kubectl ');
    const [history, setHistory] = useState([
        { type: 'banner', text: WELCOME }
    ]);
    const [bannerVisible, setBannerVisible] = useState(true);
    const [cmdHistory, setCmdHistory] = useState([]);
    const [histIdx, setHistIdx] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [namespaces, setNamespaces] = useState([]);

    const nsRef = useRef(null);

    const getPrefix = useCallback((ns) => {
        return ns ? `kubectl -n ${ns} ` : 'kubectl ';
    }, []);

    useEffect(() => {
        // Fetch all namespaces to make them clickable in console output
        fetch('/api/namespaces')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (Array.isArray(data)) {
                    setNamespaces(data);
                } else if (data && data.items) {
                    setNamespaces(data.items.map(ns => ns.metadata.name));
                }
            })
            .catch(() => { });
    }, []);

    const updateInputWithNamespace = useCallback((ns) => {
        const prefix = getPrefix(ns);
        setInput(prev => {
            const commandPart = prev.replace(/^kubectl\s*(-n\s+[^\s]+\s*)?/i, '');
            return prefix + commandPart;
        });
    }, [getPrefix]);

    const handleNsSelect = (ns) => {
        setSelectedNs(ns);
        setNsMenuOpen(false);
        updateInputWithNamespace(ns);
        setTimeout(focusAndEnd, 10);
    };

    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom on new output
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    // Helper to focus and move cursor to end
    const focusAndEnd = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            const len = inputRef.current.value.length;
            inputRef.current.setSelectionRange(len, len);
        }
    }, []);

    // Initial focus
    useEffect(() => {
        focusAndEnd();
    }, [focusAndEnd]);

    useEffect(() => {
        function handleClickOutside(event) {
            // Check if the click is inside the portal
            const portal = document.getElementById('ns-portal-root');
            if (portal && portal.contains(event.target)) {
                return;
            }

            if (nsRef.current && !nsRef.current.contains(event.target)) {
                setNsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleNsMenu = (e) => {
        e.stopPropagation();
        if (!nsMenuOpen) {
            setNsBtnRect(e.currentTarget.getBoundingClientRect());
        }
        setNsMenuOpen(!nsMenuOpen);
    };

    // Robust Command fragment suggestions
    const suggestions = useMemo(() => {
        const trimmedInput = input.trim();
        const parts = trimmedInput.split(/\s+/);

        // Find the index where the actual command starts (after kubectl [-n ns])
        let startIndex = 1;
        if (parts[1] === '-n' && parts.length > 2) {
            startIndex = 3;
        }

        // Only suggest if we start with kubectl/k
        if (parts[0] !== 'kubectl' && parts[0] !== 'k') return null;

        // Find the Verb (first match from our known list after current prefix)
        const verb = parts.slice(startIndex).find(p => VERBS.includes(p));
        const verbIdx = verb ? parts.indexOf(verb) : -1;

        // Find the potential Resource (the first non-flag after the verb)
        const potentialResource = verbIdx !== -1
            ? parts.slice(verbIdx + 1).find(p => !p.startsWith('-'))
            : null;

        // Stage 1: No Verb -> suggest Actions
        if (!verb) {
            return {
                title: 'Actions',
                items: VERBS.map(v => ({ label: v, val: v }))
            };
        }

        // Stage 2: We have Verb but no Resource -> suggest Resources
        if (!potentialResource && !['version', 'cluster-info'].includes(verb)) {
            return {
                title: 'Resources',
                items: RESOURCES.map(r => ({ label: r, val: r }))
            };
        }

        // Stage 3: We have Verb and Resource -> suggest Flags
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
        let defaultColor = exitCode !== 0 ? 'text-error' : 'text-primary';
        if (/NotReady|CrashLoop|Error|Failed|Evicted|OOMKilled/i.test(line)) defaultColor = 'text-error';
        else if (/Warning|warn/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-warning';
        else if (/Running|Ready|Active|True/i.test(line) && !line.startsWith('NAME')) defaultColor = 'text-success';

        const words = line.split(/(\s+)/);

        return words.map((word, idx) => {
            if (/^\s+$/.test(word)) return <span key={idx}>{word}</span>;

            if (namespaces.includes(word)) {
                return (
                    <span
                        key={idx}
                        onClick={() => onTokenClick('ns', word)}
                        className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-info hover:bg-info/10 px-0.5 -mx-0.5 rounded transition-all"
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
                            className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-info hover:bg-info/10 px-0.5 -mx-0.5 rounded transition-all"
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
        if (type === 'ns') {
            handleNsSelect(value);
            return;
        }
        setInput(prev => {
            const trimmed = prev.trim();
            if (trimmed.endsWith(value)) return prev;
            return `${trimmed} ${value} `;
        });
        setTimeout(focusAndEnd, 10);
    };

    const handleSuggestionClick = (val) => {
        setInput(prev => {
            const trimmed = prev.trim();
            return trimmed + ' ' + val + ' ';
        });
        setTimeout(focusAndEnd, 10);
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
        setInput(getPrefix(selectedNs));
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
            setTimeout(focusAndEnd, 50);
        }
    }, [bannerVisible, focusAndEnd, selectedNs, getPrefix]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            runCommand(input);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const next = Math.min(histIdx + 1, cmdHistory.length - 1);
            setHistIdx(next);
            if (next >= 0) setInput(cmdHistory[next]);
            setTimeout(focusAndEnd, 0);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = histIdx - 1;
            setHistIdx(next);
            if (next < 0) setInput(getPrefix(selectedNs));
            else setInput(cmdHistory[next]);
            setTimeout(focusAndEnd, 0);
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault();
            setBannerVisible(false);
            setHistory([]);
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            setHistory(h => [...h, { type: 'cmd', text: input + ' ^C' }]);
            setInput(getPrefix(selectedNs));
        } else if (e.key === 'Backspace') {
            const prefix = getPrefix(selectedNs);
            if (input === prefix) {
                e.preventDefault();
            }
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        const prefix = getPrefix(selectedNs);
        
        // If the user tries to delete the prefix, force it back
        if (!val.startsWith(prefix)) {
            // Check if they are typing something new or just deleted
            const commandPart = val.replace(/^kubectl\s*(-n\s+[^\s]+\s*)?/i, '');
            setInput(prefix + commandPart);
            return;
        }
        
        const commandPart = val.slice(prefix.length);
        setInput(prefix + commandPart);
    };

    const handleSelect = (e) => {
        const prefix = getPrefix(selectedNs);
        if (e.target.selectionStart < prefix.length) {
            e.target.setSelectionRange(prefix.length, prefix.length);
        }
    };

    return (
        <div className="flex flex-col h-full bg-glass/40 glass transition-colors duration-200">
            {/* Terminal output container */}
            <div
                className="flex-1 overflow-auto flex flex-col font-mono text-sm p-4 leading-relaxed cursor-text"
                onClick={(e) => {
                    if (!window.getSelection()?.toString()) {
                        focusAndEnd();
                    }
                }}
            >
                {history.map((entry, i) => (
                    <div key={i} className="mb-1">
                        {entry.type === 'banner' && (
                            <div className="text-red-500 mb-3 whitespace-pre">{entry.text}</div>
                        )}
                        {entry.type === 'cmd' && (
                            <div className="flex items-start gap-2 text-info">
                                <span className="shrink-0">{PROMPT}</span>
                                <span className="text-white font-bold">{entry.text}</span>
                            </div>
                        )}
                        {entry.type === 'output' && (
                            <div className="ml-4 mb-2 whitespace-pre text-primary">
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
                    <div className="flex items-center gap-2 ml-4 text-text-muted mt-1">
                        <span className="animate-pulse">●</span> Running...
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input & Suggestions row */}
            <div className="border-t border-border bg-card/80 flex flex-col shrink-0">
                {/* Suggestions bar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border h-10 bg-[var(--bg-muted)]/50">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                        {suggestions ? (
                            <>
                                <span className="text-xs text-text-muted font-bold uppercase tracking-widest shrink-0 mr-2">{suggestions.title}:</span>
                                {suggestions.items.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSuggestionClick(s.val)}
                                        className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-success border border-green-500/50 rounded text-sm transition-all whitespace-nowrap font-bold"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <span className="text-xs text-text-muted italic">Type space or more characters to see suggestions...</span>
                        )}
                    </div>

                    <div className="relative" ref={nsRef}>
                        <button
                            onClick={toggleNsMenu}
                            className="flex items-center gap-2 bg-[var(--bg-input)] border border-border text-[var(--text-input)] text-sm rounded-lg px-3 py-1 hover:border-info transition-colors min-w-[160px] font-sans font-medium justify-between shadow-sm"
                        >
                            <span className="truncate">{selectedNs || '(all namespaces)'}</span>
                            <span className={`transition-transform duration-200 ${nsMenuOpen ? 'rotate-180' : ''}`}>▾</span>
                        </button>

                        {nsMenuOpen && nsBtnRect && createPortal(
                            <div 
                                id="ns-portal-root"
                                style={{
                                    position: 'fixed',
                                    bottom: `${window.innerHeight - nsBtnRect.top + 8}px`,
                                    left: `${nsBtnRect.left}px`,
                                    width: `${nsBtnRect.width}px`,
                                    zIndex: 10000,
                                }}
                                className="bg-glass glass border border-border rounded-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200"
                            >
                                <div className="max-h-60 overflow-y-auto bg-[var(--bg-input)]">
                                    <button
                                        onClick={(e) => { 
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleNsSelect('');
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 transition-colors ${selectedNs === '' ? 'text-success font-bold bg-[var(--accent)]/5' : 'text-[var(--text-input)]'}`}
                                    >
                                        (all namespaces)
                                    </button>
                                    {namespaces.map(ns => (
                                        <button
                                            key={ns}
                                            onClick={(e) => { 
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleNsSelect(ns);
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--accent)]/10 transition-colors ${selectedNs === ns ? 'text-success font-bold bg-[var(--accent)]/5' : 'text-[var(--text-input)]'}`}
                                        >
                                            {ns}
                                        </button>
                                    ))}
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>
                </div>

                {/* Input row */}
                <div className="flex items-center gap-2 px-4 py-3 bg-main/30">
                    <span className="text-info font-mono font-bold select-none">{PROMPT}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        onSelect={handleSelect}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                        spellCheck={false}
                        autoComplete="off"
                        className="flex-1 bg-transparent outline-none text-primary font-mono caret-[var(--text-info)] font-bold"
                    />
                </div>

                {/* Hint / Toolbar */}
                <div className="px-4 py-1.5 flex gap-4 text-xs text-text-muted border-t border-border uppercase tracking-widest">
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-text-muted">Enter</kbd> execute</span>
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-text-muted">Arrows</kbd> history</span>
                    <span><kbd className="bg-[var(--bg-muted)] px-1 rounded text-text-muted">Ctrl+L</kbd> clear</span>
                    <span className="ml-auto opacity-50">Tip: Click output tokens or use suggestions above</span>
                </div>
            </div>
        </div>
    );
}
