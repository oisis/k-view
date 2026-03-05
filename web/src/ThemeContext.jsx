import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    LayoutDashboard, Server, Terminal, LogOut, FlaskConical, ShieldAlert,
    Boxes, Package, GitBranch, RefreshCw, Clock, Network, Globe,
    FileText, Lock, Database, Puzzle, ChevronDown, ChevronRight,
    Shield, Key, User, Users, Link, AlertTriangle, Globe2, Activity,
    Settings as SettingsIcon, Moon, Sun, Palette, Info, PanelLeftClose, PanelLeftOpen,
    Layers, Repeat, ShieldCheck, Plus, Zap, Heart, Search, X, AlertCircle, ExternalLink, Edit3, Download, Play,
    ChevronLeft, Check, Fingerprint, List, Languages, Cpu, Hash, Box, MemoryStick, CheckCircle,
    XCircle, MoreVertical, ChevronUp, ArrowUpDown, Clipboard, CheckCircle2, ChevronsLeft, ChevronsRight, Trash2,
    ShieldOff, HardDrive, Layout, FileCode2, SquareCode, Eye, EyeOff
} from 'lucide-react';

const commonIcons = {
    dashboard: LayoutDashboard,
    nodes: Server,
    console: Terminal,
    about: Info,
    settings: SettingsIcon,
    logout: LogOut,
    admin_panel: ShieldAlert,
    expand_menu: PanelLeftOpen,
    collapse_menu: PanelLeftClose,
    chevron_down: ChevronDown,
    chevron_up: ChevronUp,
    chevron_right: ChevronRight,
    chevron_left: ChevronLeft,
    chevrons_left: ChevronsLeft,
    chevrons_right: ChevronsRight,
    plus: Plus,
    zap: Zap,
    heart: Heart,
    search: Search,
    close: X,
    alert: AlertCircle,
    alert_triangle: AlertTriangle,
    external_link: ExternalLink,
    edit: Edit3,
    download: Download,
    refresh: RefreshCw,
    activity: Activity,
    palette: Palette,
    sun: Sun,
    moon: Moon,
    play: Play,
    check: Check,
    fingerprint: Fingerprint,
    list: List,
    languages: Languages,
    cpu: Cpu,
    hash: Hash,
    box: Box,
    terminal: Terminal,
    memory: MemoryStick,
    check_circle: CheckCircle,
    check_circle_alt: CheckCircle2,
    x_circle: XCircle,
    more: MoreVertical,
    sort: ArrowUpDown,
    clipboard: Clipboard,
    clock: Clock,
    manifest: FileText,
    trash: Trash2,
    shield: Shield,
    lock: Lock,
    eye: Eye,
    eye_off: EyeOff,
    globe: Globe,
    database: Database,
    puzzle: Puzzle,
    users: Users,
    link: Link,
    layout: Layout,
    file_code: FileCode2,
    shield_off: ShieldOff,
    hard_drive: HardDrive,
    user: User,
    layers: Layers,
    shield_check: ShieldCheck,

    // Resource types
    cronjob: Clock,
    daemonset: RefreshCw,
    deployment: Package,
    job: Database,
    pod: Boxes,
    replicaset: Layers,
    replicationcontroller: Repeat,
    statefulset: GitBranch,
    ingressclass: Globe,
    ingress: Globe,
    service: Network,
    configmap: FileText,
    pvc: Database,
    secret: Lock,
    storageclass: Database,
    clusterrolebinding: Link,
    clusterrole: Shield,
    crd: Puzzle,
    event: Activity,
    namespace: Globe2,
    networkpolicy: AlertTriangle,
    pv: Database,
    rolebinding: Link,
    role: Key,
    serviceaccount: Users
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    // Default to 'k-view' theme if no saved theme, matching the :root definition
    const [activeTheme, setActiveTheme] = useState(localStorage.getItem('kview-theme') || 'k-view');

    // Effect to apply theme class and update localStorage
    useEffect(() => {
        const root = document.documentElement;
        // Remove previous theme classes and apply the new one
        root.className = ''; 
        root.classList.add(`theme-${activeTheme}`);

        // Update local storage
        localStorage.setItem('kview-theme', activeTheme);
    }, [activeTheme]);

    // Sync theme across tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'kview-theme' && e.newValue) {
                setActiveTheme(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const value = {
        themes: {
            'dark': { id: 'dark', name: 'Dark' },
            'k-view': { id: 'k-view', name: 'K-View' },
            'light': { id: 'light', name: 'Light' }
        }, // Provide theme options based on CSS classes
        activeTheme,
        setTheme: setActiveTheme,
        icons: commonIcons, // Use a static set of icons
        loading: false // No dynamic loading, so always ready
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
