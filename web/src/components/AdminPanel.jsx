import React, { useState, useEffect } from 'react';
import { useTranslation } from '../SettingsContext';
import { useTheme } from '../ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export default function AdminPanel() {
    const { t } = useTranslation();
    const { icons } = useTheme();

    const [status, setStatus] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRoles, setExpandedRoles] = useState({});

    useEffect(() => {
        Promise.all([
            fetch('/api/rbac/status').then(res => {
                if (!res.ok) throw new Error('Failed to fetch RBAC status');
                return res.json();
            }),
            fetch('/api/rbac/roles').then(res => {
                if (!res.ok) throw new Error('Failed to fetch K-View roles');
                return res.json();
            })
        ])
            .then(([statusData, rolesData]) => {
                setStatus(statusData);
                setRoles(rolesData);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const toggleRole = (roleName) => {
        setExpandedRoles(prev => ({
            ...prev,
            [roleName]: !prev[roleName]
        }));
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
                <icons.refresh size={32} className="text-primary" />
            </motion.div>
            <p className="animate-pulse font-medium">{t('loading')}...</p>
        </div>
    );

    if (error) {
        return (
            <div className="p-8">
                <Card className="border-destructive/30 bg-destructive/5 p-8 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-2xl bg-destructive/20 text-destructive">
                            <icons.alert size={24} />
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-destructive uppercase italic">{t('error')}</h3>
                    </div>
                    <p className="text-muted-foreground font-medium">{error}</p>
                </Card>
            </div>
        );
    }

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="p-4 md:pt-4 md:px-8 md:pb-8 space-y-10 max-w-[1600px] mx-auto"
        >            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground tracking-tighter italic uppercase underline decoration-primary/30 decoration-4 underline-offset-8 flex items-center gap-4">
                        {icons.role && React.createElement(icons.role, { className: "text-primary", size: 32 })} 
                        {t('access_control')}
                    </h2>
                    <p className="text-muted-foreground mt-4 font-bold text-xs uppercase tracking-widest opacity-80">
                        {t('effective_permissions_desc')}
                    </p>
                </div>
                <Badge variant="outline" className="h-10 px-4 border-border/50 bg-muted/20 text-muted-foreground uppercase tracking-widest font-black text-[10px] flex items-center gap-2">
                    {icons.deployment && React.createElement(icons.deployment, { size: 14, className: "text-emerald-400" })}
                    Source: Git/Helm (Read-Only)
                </Badge>
            </motion.div>

            {/* My Permissions Section */}
            <motion.div variants={itemVariants}>
                <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-xl hover:border-primary/30 transition-all">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/30 bg-muted/10 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            {icons.admin_panel && React.createElement(icons.admin_panel, { className: "text-primary", size: 20 })} 
                            {t('effective_permissions')}
                        </CardTitle>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{t('assigned_role')}:</span>
                            <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase text-[10px] py-1">
                                {status?.role} {status?.namespace ? `(${status.namespace})` : ''}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="mb-8 p-4 bg-muted/20 rounded-xl border border-border/30">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {t('connected_as')} <span className="text-foreground font-black px-2 py-0.5 bg-foreground/5 rounded">{status?.email}</span>
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {status?.rules?.map((rule, idx) => (
                                <motion.div 
                                    key={idx} 
                                    whileHover={{ x: 4 }}
                                    className="flex flex-col gap-2 p-4 bg-muted/10 rounded-xl border border-border/20 hover:border-primary/30 transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        {icons.check_circle && React.createElement(icons.check_circle, { size: 14, className: "text-emerald-500" })}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{rule.resource}</span>
                                    </div>
                                    <div className="text-[10px] font-mono text-primary font-bold bg-primary/5 p-2 rounded-lg border border-primary/10 overflow-hidden text-ellipsis whitespace-nowrap">
                                        {rule.verbs}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Role Definitions Section */}
            <motion.div variants={itemVariants}>
                <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-xl hover:border-primary/30 transition-all">
                    <CardHeader className="border-b border-border/30 bg-muted/10 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            {icons.lock && React.createElement(icons.lock, { className: "text-cyan-400", size: 20 })} 
                            {t('role_definitions')}
                        </CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-border/20">
                        {roles.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-60">No K-View roles detected.</div>
                        ) : (
                            (roles || []).map((role, i) => (
                                <div key={i} className="group">
                                    <button
                                        onClick={() => toggleRole(role.name)}
                                        className="w-full px-8 py-6 flex items-center justify-between hover:bg-muted/30 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center border border-cyan-400/20 group-hover:scale-110 transition-transform">
                                                {icons.shield && React.createElement(icons.shield, { size: 20, className: "text-cyan-400" })}
                                            </div>
                                            <div>
                                                <span className="font-black text-sm text-foreground uppercase tracking-widest">{role.name}</span>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-0.5">RBAC Profile</p>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedRoles[role.name] ? 180 : 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-muted-foreground"
                                        >
                                            {icons.chevron_down && React.createElement(icons.chevron_down, { size: 20 })}
                                        </motion.div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedRoles[role.name] && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden bg-muted/5"
                                            >
                                                <div className="px-8 pb-8 pt-2 overflow-x-auto">
                                                    <table className="w-full text-left text-[10px] border border-border rounded-xl overflow-hidden border-separate border-spacing-0">
                                                        <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider">
                                                            <tr>
                                                                <th className="px-6 py-4 border-b-2 border-border border-r border-border/60">{t('api_groups')}</th>
                                                                <th className="px-6 py-4 border-b-2 border-border border-r border-border/60">{t('resources')}</th>
                                                                <th className="px-6 py-4 border-b-2 border-border">{t('verbs')}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="">
                                                            {role.rules?.map((rule, idx) => (
                                                                <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                                                    <td className="px-6 py-4 border-b border-border border-r border-border/40 font-mono font-bold text-muted-foreground italic">
                                                                        {rule.apiGroups?.map(g => g === "" ? "(core)" : g).join(', ')}
                                                                    </td>
                                                                    <td className="px-6 py-4 border-b border-border border-r border-border/40 text-foreground">
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {rule.resources?.map((res, rIdx) => (
                                                                                <Badge key={rIdx} variant="outline" className="bg-muted/30 border-border/30 font-bold px-2 py-0 text-[9px]">
                                                                                    {res}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-6 py-4 border-b border-border font-mono font-bold text-primary">
                                                                        {rule.verbs?.join(', ')}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </motion.div>

            {/* Global Assignments Table */}
            <motion.div variants={itemVariants}>
                <Card className="border-border/50 bg-card/50 backdrop-blur-md overflow-hidden shadow-xl hover:border-primary/30 transition-all">
                    <CardHeader className="border-b border-border/30 bg-muted/10 pb-4">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                            {icons.shield && React.createElement(icons.shield, { className: "text-emerald-400", size: 20 })} 
                            Global Assignments
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-foreground border-separate border-spacing-0">
                            <thead className="text-[10px] font-semibold text-muted-foreground bg-muted/40 uppercase tracking-wider">
                                <tr>
                                    <th className="px-8 py-5 border-b-2 border-border border-r border-border/60">{t('user')}</th>
                                    <th className="px-8 py-5 border-b-2 border-border border-r border-border/60">Type</th>
                                    <th className="px-8 py-5 border-b-2 border-border border-r border-border/60">Role</th>
                                    <th className="px-8 py-5 border-b-2 border-border">Namespace</th>
                                </tr>
                            </thead>
                            <tbody className="">
                                {!status?.assignments || status.assignments.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-16 text-center text-muted-foreground font-semibold uppercase tracking-widest text-xs opacity-60">No k-view role bindings detected in the cluster.</td>
                                    </tr>
                                ) : (
                                    status.assignments.map((assignment, i) => (
                                        <tr key={i} className="hover:bg-muted/50 transition-all group">
                                            <td className="px-8 py-6 border-b border-border border-r border-border/40 font-bold text-foreground">
                                                {assignment.user || assignment.group || 'Unknown'}
                                            </td>
                                            <td className="px-8 py-6 border-b border-border border-r border-border/40">
                                                <Badge variant="outline" className="text-[9px] uppercase font-semibold bg-muted/30 border-border/30">
                                                    {assignment.user ? 'User' : 'Group'}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6 border-b border-border border-r border-border/40">
                                                <span className="text-primary font-semibold uppercase text-[10px] tracking-wider bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20">
                                                    {assignment.role}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 border-b border-border">
                                                {assignment.namespace ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold">
                                                        {assignment.namespace}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 shadow-inner">
                                                        Cluster-Wide
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </motion.div>

            {/* Info Footer */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-12 flex items-center gap-8 justify-center border-t border-border/30 pt-8"
            >
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                    <icons.about size={14} className="text-primary/60" />
                    Read-only RBAC view
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
                    <icons.activity size={14} className="text-emerald-500/60" />
                    Security profile active
                </div>
            </motion.div>
        </motion.div>
    );
}
