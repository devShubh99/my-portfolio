"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Shield,
    Activity,
    AlertTriangle,
    UserPlus,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    MoreHorizontal,
    LogOut,
    RefreshCw,
    FileText,
    Loader2,
    Download,
    Lock,
    Unlock,
    UserX,
    Key,
    CheckSquare,
    Square,
    MinusSquare,
    Sun,
    Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

/* ───────────────── Types ───────────────── */
interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    deactivatedUsers: number;
    newSignupsToday: number;
    newSignups30d: number;
    failedLoginsToday: number;
    totalAuditLogs: number;
    roleDistribution: { admin: number; moderator: number; user: number };
    signupTrend: { date: string; count: number }[];
    failedLoginTrend: { date: string; count: number }[];
}

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    failedLogins: number;
    lockedUntil: string | null;
    lastLoginAt: string | null;
    createdAt: string;
}

interface AuditLog {
    id: string;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    user: { email: string; name: string | null } | null;
}

interface PermissionRow {
    role: string;
    permissions: { key: string; granted: boolean }[];
}

type Tab = "dashboard" | "users" | "audit" | "permissions";

/* ───────────────── Re-Auth Modal ───────────────── */
function ReAuthModal({
    open,
    onClose,
    onConfirm,
    title,
    description,
    loading,
}: {
    open: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
    title: string;
    description: string;
    loading: boolean;
}) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <Input
                        type="password"
                        placeholder="Enter your admin password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                        }}
                        autoFocus
                    />
                    {error && (
                        <p className="text-sm text-red-400">{error}</p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            if (!password) {
                                setError("Password is required");
                                return;
                            }
                            onConfirm(password);
                        }}
                        disabled={loading || !password}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/* ───────────────── Mini Sparkline ───────────────── */
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (!data.length) return null;
    const max = Math.max(...data, 1);
    const w = 120;
    const h = 32;
    const points = data
        .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
        .join(" ");
    return (
        <svg width={w} height={h} className="inline-block">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
            />
        </svg>
    );
}

/* ───────────────── Main Admin Page ───────────────── */
export default function AdminDashboardPage() {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>("dashboard");
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [auditPagination, setAuditPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [permissionMatrix, setPermissionMatrix] = useState<PermissionRow[]>([]);

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [auditActionFilter, setAuditActionFilter] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Selection
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [activeUserMenu, setActiveUserMenu] = useState<string | null>(null);

    // Re-auth modal
    const [reAuthModal, setReAuthModal] = useState<{
        open: boolean;
        title: string;
        description: string;
        onConfirm: (password: string) => void;
    }>({ open: false, title: "", description: "", onConfirm: () => { } });
    const [reAuthLoading, setReAuthLoading] = useState(false);

    // Theme toggle
    const [isDark, setIsDark] = useState(true);
    useEffect(() => {
        const saved = localStorage.getItem("theme");
        const dark = saved ? saved === "dark" : document.documentElement.classList.contains("dark");
        setIsDark(dark);
    }, []);
    const toggleTheme = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
    };

    /* ── Fetchers ── */
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/dashboard");
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch { }
    }, []);

    const fetchUsers = useCallback(
        async (page = 1) => {
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: "15",
                    sortBy,
                    order: sortOrder,
                });
                if (search) params.set("search", search);
                if (statusFilter) params.set("status", statusFilter);
                if (roleFilter) params.set("role", roleFilter);

                const res = await fetch(`/api/admin/users?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setUsers(data.users);
                    setUserPagination(data.pagination);
                }
            } catch { }
        },
        [search, statusFilter, roleFilter, sortBy, sortOrder]
    );

    const fetchAuditLogs = useCallback(
        async (page = 1) => {
            try {
                const params = new URLSearchParams({
                    page: String(page),
                    limit: "20",
                });
                if (auditActionFilter) params.set("action", auditActionFilter);

                const res = await fetch(`/api/admin/audit-logs?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    setAuditLogs(data.logs);
                    setAuditPagination(data.pagination);
                }
            } catch { }
        },
        [auditActionFilter]
    );

    const fetchPermissions = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/permissions");
            if (res.ok) {
                const data = await res.json();
                setPermissionMatrix(data.matrix);
            }
        } catch { }
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchStats(), fetchUsers(), fetchAuditLogs()]).finally(() =>
            setLoading(false)
        );
    }, [fetchStats, fetchUsers, fetchAuditLogs]);

    /* ── Sort handler ── */
    const handleSort = (col: string) => {
        if (sortBy === col) {
            setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(col);
            setSortOrder("desc");
        }
    };

    useEffect(() => {
        if (tab === "users") fetchUsers(1);
    }, [sortBy, sortOrder]); // eslint-disable-line

    /* ── Selection handlers ── */
    const toggleSelect = (id: string) => {
        setSelectedUsers((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(users.map((u) => u.id)));
        }
    };

    /* ── User actions ── */
    const handleUserAction = async (
        userId: string,
        action: "role" | "status" | "unlock" | "delete" | "forceLogout" | "lock",
        value?: string
    ) => {
        setActionLoading(userId);
        try {
            if (action === "forceLogout") {
                await fetch(`/api/admin/users/${userId}/force-logout`, { method: "POST" });
            } else if (action === "lock") {
                await fetch(`/api/admin/users/${userId}/lock`, { method: "POST" });
            } else if (action === "unlock") {
                await fetch(`/api/admin/users/${userId}/lock`, { method: "DELETE" });
            } else if (action === "delete") {
                if (!confirm("Permanently delete this user?")) {
                    setActionLoading(null);
                    return;
                }
                await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
            } else {
                const body: Record<string, any> = {};
                if (action === "role") body.role = value;
                if (action === "status") body.status = value;

                await fetch(`/api/admin/users/${userId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
            }

            await fetchUsers(userPagination.page);
            await fetchStats();
        } catch { }
        setActionLoading(null);
        setActiveUserMenu(null);
    };

    /* ── Bulk actions ── */
    const handleBulkAction = async (
        action: string,
        value?: string,
        needsAuth = false
    ) => {
        const ids = Array.from(selectedUsers);
        if (ids.length === 0) return;

        if (needsAuth) {
            setReAuthModal({
                open: true,
                title: `Confirm Bulk ${action}`,
                description: `This will ${action} ${ids.length} user(s). Enter your admin password to confirm.`,
                onConfirm: async (password) => {
                    setReAuthLoading(true);
                    try {
                        const res = await fetch("/api/admin/users/bulk", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                action,
                                userIds: ids,
                                value,
                                adminPassword: password,
                            }),
                        });
                        if (!res.ok) {
                            const data = await res.json();
                            alert(data.error || "Action failed");
                        } else {
                            setSelectedUsers(new Set());
                            await fetchUsers(userPagination.page);
                            await fetchStats();
                        }
                    } catch { }
                    setReAuthLoading(false);
                    setReAuthModal((m) => ({ ...m, open: false }));
                },
            });
        } else {
            if (!confirm(`${action} ${ids.length} user(s)?`)) return;
            setActionLoading("bulk");
            try {
                await fetch("/api/admin/users/bulk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, userIds: ids, value }),
                });
                setSelectedUsers(new Set());
                await fetchUsers(userPagination.page);
                await fetchStats();
            } catch { }
            setActionLoading(null);
        }
    };

    /* ── CSV export ── */
    const handleExport = async () => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (statusFilter) params.set("status", statusFilter);
        if (roleFilter) params.set("role", roleFilter);

        const res = await fetch(`/api/admin/users/export?${params}`);
        if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    /* ── Logout ── */
    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
    };

    /* ── Sort icon ── */
    const SortIcon = ({ col }: { col: string }) =>
        sortBy === col ? (
            sortOrder === "asc" ? (
                <ChevronUp className="inline h-3 w-3 ml-1" />
            ) : (
                <ChevronDown className="inline h-3 w-3 ml-1" />
            )
        ) : null;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Re-auth modal */}
            <ReAuthModal
                open={reAuthModal.open}
                onClose={() => setReAuthModal((m) => ({ ...m, open: false }))}
                onConfirm={reAuthModal.onConfirm}
                title={reAuthModal.title}
                description={reAuthModal.description}
                loading={reAuthLoading}
            />

            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gradient-to-br from-red-500 to-orange-500 p-2">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold">Admin Panel</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
                            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-6 py-8">
                {/* Tabs */}
                <div className="mb-8 flex gap-1 rounded-lg bg-card/50 p-1 w-fit">
                    {(
                        [
                            { id: "dashboard" as Tab, label: "Dashboard", icon: Activity },
                            { id: "users" as Tab, label: "Users", icon: Users },
                            { id: "audit" as Tab, label: "Audit Logs", icon: FileText },
                            { id: "permissions" as Tab, label: "Permissions", icon: Key },
                        ] as const
                    ).map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => {
                                setTab(id);
                                if (id === "users") fetchUsers();
                                if (id === "audit") fetchAuditLogs();
                                if (id === "permissions") fetchPermissions();
                            }}
                            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* ═══════ Dashboard Tab ═══════ */}
                {tab === "dashboard" && stats && (
                    <div className="space-y-6">
                        {/* Stat cards */}
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
                                { label: "Active Users", value: stats.activeUsers, icon: Activity, color: "text-emerald-400" },
                                { label: "New Today", value: stats.newSignupsToday, icon: UserPlus, color: "text-cyan-400" },
                                { label: "Failed Logins Today", value: stats.failedLoginsToday, icon: AlertTriangle, color: "text-red-400" },
                                { label: "Suspended", value: stats.suspendedUsers, icon: Shield, color: "text-amber-400" },
                                { label: "Deactivated", value: stats.deactivatedUsers, icon: UserX, color: "text-gray-400" },
                                { label: "New (30d)", value: stats.newSignups30d, icon: UserPlus, color: "text-purple-400" },
                                { label: "Total Audit Logs", value: stats.totalAuditLogs, icon: FileText, color: "text-indigo-400" },
                            ].map((stat, i) => (
                                <Card key={i} className="border-border/30">
                                    <CardContent className="flex items-center gap-4 p-5">
                                        <div className={`rounded-lg bg-card p-2.5 ${stat.color}`}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold">{stat.value}</p>
                                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Trends + Role distribution */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="border-border/30">
                                <CardHeader>
                                    <CardTitle className="text-sm text-muted-foreground">Signup Trend (7d)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Sparkline data={stats.signupTrend.map((d) => d.count)} color="#06b6d4" />
                                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                                        <span>{stats.signupTrend[0]?.date.slice(5)}</span>
                                        <span>{stats.signupTrend[6]?.date.slice(5)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/30">
                                <CardHeader>
                                    <CardTitle className="text-sm text-muted-foreground">Failed Logins (7d)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Sparkline data={stats.failedLoginTrend.map((d) => d.count)} color="#ef4444" />
                                    <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                                        <span>{stats.failedLoginTrend[0]?.date.slice(5)}</span>
                                        <span>{stats.failedLoginTrend[6]?.date.slice(5)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-border/30">
                                <CardHeader>
                                    <CardTitle className="text-sm text-muted-foreground">Role Distribution</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: "Admin", count: stats.roleDistribution.admin, color: "bg-red-500" },
                                        { label: "Moderator", count: stats.roleDistribution.moderator, color: "bg-amber-500" },
                                        { label: "User", count: stats.roleDistribution.user, color: "bg-blue-500" },
                                    ].map((r) => (
                                        <div key={r.label} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                                                <span>{r.label}</span>
                                            </div>
                                            <span className="font-medium">{r.count}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* ═══════ Users Tab ═══════ */}
                {tab === "users" && (
                    <div className="space-y-4">
                        {/* Filters row */}
                        <div className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or email..."
                                    className="pl-9"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
                                />
                            </div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="SUSPENDED">Suspended</option>
                                <option value="DEACTIVATED">Deactivated</option>
                            </select>
                            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm">
                                <option value="">All Roles</option>
                                <option value="USER">User</option>
                                <option value="MODERATOR">Moderator</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => fetchUsers(1)} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Search
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                                <Download className="h-4 w-4" />
                                CSV
                            </Button>
                        </div>

                        {/* Bulk action bar */}
                        {selectedUsers.size > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
                                <span className="text-sm font-medium">{selectedUsers.size} selected</span>
                                <div className="ml-auto flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                                        Activate
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-amber-400 border-amber-500/30" onClick={() => handleBulkAction("suspend")}>
                                        Suspend
                                    </Button>
                                    <Button size="sm" variant="outline" className="text-red-400 border-red-500/30" onClick={() => handleBulkAction("delete", undefined, true)}>
                                        Delete
                                    </Button>
                                    <select
                                        className="rounded-md border bg-background px-2 py-1 text-xs"
                                        defaultValue=""
                                        onChange={(e) => {
                                            if (e.target.value) handleBulkAction("changeRole", e.target.value, true);
                                            e.target.value = "";
                                        }}
                                    >
                                        <option value="" disabled>Change Role…</option>
                                        <option value="USER">User</option>
                                        <option value="MODERATOR">Moderator</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedUsers(new Set())}>
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Users Table */}
                        <Card className="border-border/30">
                            <CardHeader>
                                <CardTitle className="text-base">Users ({userPagination.total})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="p-3 w-10">
                                                    <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                                                        {selectedUsers.size === users.length && users.length > 0 ? (
                                                            <CheckSquare className="h-4 w-4" />
                                                        ) : selectedUsers.size > 0 ? (
                                                            <MinusSquare className="h-4 w-4" />
                                                        ) : (
                                                            <Square className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("email")}>
                                                    User <SortIcon col="email" />
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("role")}>
                                                    Role <SortIcon col="role" />
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("status")}>
                                                    Status <SortIcon col="status" />
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("lastLoginAt")}>
                                                    Last Login <SortIcon col="lastLoginAt" />
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                                                    Joined <SortIcon col="createdAt" />
                                                </th>
                                                <th className="p-3 font-medium text-muted-foreground w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} className={`border-b last:border-0 hover:bg-accent/30 ${selectedUsers.has(user.id) ? "bg-primary/5" : ""}`}>
                                                    <td className="p-3">
                                                        <button onClick={() => toggleSelect(user.id)} className="text-muted-foreground hover:text-foreground">
                                                            {selectedUsers.has(user.id) ? (
                                                                <CheckSquare className="h-4 w-4 text-primary" />
                                                            ) : (
                                                                <Square className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-3">
                                                        <div>
                                                            <p className="font-medium">{user.name || "—"}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.role === "ADMIN"
                                                                ? "bg-red-500/10 text-red-400"
                                                                : user.role === "MODERATOR"
                                                                    ? "bg-amber-500/10 text-amber-400"
                                                                    : "bg-blue-500/10 text-blue-400"
                                                                }`}
                                                        >
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${user.status === "ACTIVE"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : user.status === "SUSPENDED"
                                                                    ? "bg-amber-500/10 text-amber-400"
                                                                    : "bg-gray-500/10 text-gray-400"
                                                                }`}
                                                        >
                                                            {user.status}
                                                            {user.lockedUntil && new Date(user.lockedUntil) > new Date() && " 🔒"}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">
                                                        {user.lastLoginAt
                                                            ? new Date(user.lastLoginAt).toLocaleDateString()
                                                            : "Never"}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-xs">
                                                        {new Date(user.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="relative">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => setActiveUserMenu(activeUserMenu === user.id ? null : user.id)}
                                                                disabled={actionLoading === user.id}
                                                            >
                                                                {actionLoading === user.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            {activeUserMenu === user.id && (
                                                                <div className="absolute right-0 top-8 z-50 w-52 rounded-lg border bg-card shadow-xl py-1">
                                                                    {/* Role actions */}
                                                                    <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase">Role</p>
                                                                    {["USER", "MODERATOR", "ADMIN"].filter((r) => r !== user.role).map((r) => (
                                                                        <button
                                                                            key={r}
                                                                            onClick={() => handleUserAction(user.id, "role", r)}
                                                                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                                                                        >
                                                                            Set {r}
                                                                        </button>
                                                                    ))}
                                                                    <div className="my-1 border-t" />

                                                                    {/* Status actions */}
                                                                    <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase">Status</p>
                                                                    {user.status !== "ACTIVE" && (
                                                                        <button onClick={() => handleUserAction(user.id, "status", "ACTIVE")} className="w-full px-3 py-1.5 text-left text-sm text-emerald-400 hover:bg-accent">
                                                                            Activate
                                                                        </button>
                                                                    )}
                                                                    {user.status !== "SUSPENDED" && (
                                                                        <button onClick={() => handleUserAction(user.id, "status", "SUSPENDED")} className="w-full px-3 py-1.5 text-left text-sm text-amber-400 hover:bg-accent">
                                                                            Suspend
                                                                        </button>
                                                                    )}
                                                                    <div className="my-1 border-t" />

                                                                    {/* Security */}
                                                                    <p className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase">Security</p>
                                                                    <button onClick={() => handleUserAction(user.id, "forceLogout")} className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent flex items-center gap-2">
                                                                        <LogOut className="h-3 w-3" /> Force Logout
                                                                    </button>
                                                                    {user.lockedUntil && new Date(user.lockedUntil) > new Date() ? (
                                                                        <button onClick={() => handleUserAction(user.id, "unlock")} className="w-full px-3 py-1.5 text-left text-sm text-cyan-400 hover:bg-accent flex items-center gap-2">
                                                                            <Unlock className="h-3 w-3" /> Unlock Account
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => handleUserAction(user.id, "lock")} className="w-full px-3 py-1.5 text-left text-sm text-amber-400 hover:bg-accent flex items-center gap-2">
                                                                            <Lock className="h-3 w-3" /> Lock Account
                                                                        </button>
                                                                    )}
                                                                    <div className="my-1 border-t" />
                                                                    <button onClick={() => handleUserAction(user.id, "delete")} className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-accent">
                                                                        Delete permanently
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pagination */}
                        {userPagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" disabled={userPagination.page === 1} onClick={() => fetchUsers(userPagination.page - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {userPagination.page} of {userPagination.totalPages}
                                </span>
                                <Button variant="outline" size="icon" disabled={userPagination.page === userPagination.totalPages} onClick={() => fetchUsers(userPagination.page + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ Audit Logs Tab ═══════ */}
                {tab === "audit" && (
                    <div className="space-y-4">
                        {/* Audit filter */}
                        <div className="flex gap-3">
                            <select
                                value={auditActionFilter}
                                onChange={(e) => {
                                    setAuditActionFilter(e.target.value);
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN">Login</option>
                                <option value="LOGIN_FAILED">Login Failed</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="REGISTER">Register</option>
                                <option value="PASSWORD_CHANGED">Password Changed</option>
                                <option value="PASSWORD_RESET">Password Reset</option>
                                <option value="ADMIN_USER_UPDATED">Admin User Updated</option>
                                <option value="ADMIN_USER_DELETED">Admin User Deleted</option>
                                <option value="ADMIN_FORCE_LOGOUT">Force Logout</option>
                                <option value="ADMIN_ACCOUNT_LOCKED">Account Locked</option>
                                <option value="ADMIN_ACCOUNT_UNLOCKED">Account Unlocked</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={() => fetchAuditLogs(1)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Refresh
                            </Button>
                        </div>

                        <Card className="border-border/30">
                            <CardHeader>
                                <CardTitle className="text-base">Audit Logs ({auditPagination.total})</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="p-3 font-medium text-muted-foreground">Time</th>
                                                <th className="p-3 font-medium text-muted-foreground">Action</th>
                                                <th className="p-3 font-medium text-muted-foreground">User</th>
                                                <th className="p-3 font-medium text-muted-foreground">Details</th>
                                                <th className="p-3 font-medium text-muted-foreground">IP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.map((log) => (
                                                <tr key={log.id} className="border-b last:border-0 hover:bg-accent/30">
                                                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(log.createdAt).toLocaleString()}
                                                    </td>
                                                    <td className="p-3">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${log.action.includes("FAIL") || log.action.includes("DELETE")
                                                                ? "bg-red-500/10 text-red-400"
                                                                : log.action.includes("LOGIN") || log.action.includes("REGISTER")
                                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                                    : log.action.includes("LOCK")
                                                                        ? "bg-amber-500/10 text-amber-400"
                                                                        : "bg-blue-500/10 text-blue-400"
                                                                }`}
                                                        >
                                                            {log.action}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-xs">
                                                        {log.user ? <span>{log.user.email}</span> : <span className="text-muted-foreground">—</span>}
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground max-w-[300px] truncate">
                                                        {log.details || "—"}
                                                    </td>
                                                    <td className="p-3 text-xs text-muted-foreground">{log.ipAddress || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {auditPagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="outline" size="icon" disabled={auditPagination.page === 1} onClick={() => fetchAuditLogs(auditPagination.page - 1)}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                    Page {auditPagination.page} of {auditPagination.totalPages}
                                </span>
                                <Button variant="outline" size="icon" disabled={auditPagination.page === auditPagination.totalPages} onClick={() => fetchAuditLogs(auditPagination.page + 1)}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════ Permissions Tab ═══════ */}
                {tab === "permissions" && (
                    <div className="space-y-4">
                        <Card className="border-border/30">
                            <CardHeader>
                                <CardTitle className="text-base">Permission Matrix</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="p-3 font-medium text-muted-foreground">Permission</th>
                                                {permissionMatrix.map((r) => (
                                                    <th key={r.role} className="p-3 font-medium text-center text-muted-foreground">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.role === "ADMIN"
                                                                ? "bg-red-500/10 text-red-400"
                                                                : r.role === "MODERATOR"
                                                                    ? "bg-amber-500/10 text-amber-400"
                                                                    : "bg-blue-500/10 text-blue-400"
                                                                }`}
                                                        >
                                                            {r.role}
                                                        </span>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {permissionMatrix.length > 0 &&
                                                permissionMatrix[0].permissions.map((perm) => (
                                                    <tr key={perm.key} className="border-b last:border-0 hover:bg-accent/30">
                                                        <td className="p-3 font-mono text-xs">
                                                            {perm.key.replace(/_/g, " ")}
                                                        </td>
                                                        {permissionMatrix.map((r) => {
                                                            const granted = r.permissions.find((p) => p.key === perm.key)?.granted;
                                                            return (
                                                                <td key={r.role} className="p-3 text-center">
                                                                    {granted ? (
                                                                        <span className="text-emerald-400 font-bold">✓</span>
                                                                    ) : (
                                                                        <span className="text-gray-600">✗</span>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="rounded-lg border border-border/30 bg-card/50 p-4 text-sm text-muted-foreground">
                            <p><strong>ADMIN</strong> — Full access to all system features including user management, role changes, and admin account management.</p>
                            <p className="mt-1"><strong>MODERATOR</strong> — Can manage users, view audit logs, and force-logout sessions. Cannot change roles, delete users, or manage admins.</p>
                            <p className="mt-1"><strong>USER</strong> — Standard user with no admin panel access.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
