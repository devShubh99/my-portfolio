/**
 * Permission matrix — defines what each role can do in the admin panel.
 * This is the single source of truth for RBAC permissions.
 */

export const PERMISSIONS = {
    manage_users: "manage_users",
    manage_roles: "manage_roles",
    view_audit: "view_audit",
    force_logout: "force_logout",
    lock_accounts: "lock_accounts",
    export_data: "export_data",
    manage_admins: "manage_admins",
    bulk_actions: "bulk_actions",
    delete_users: "delete_users",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Role → permissions mapping.
 * ADMIN has all permissions. MODERATOR has a subset. USER has none.
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: Object.values(PERMISSIONS),
    MODERATOR: [
        PERMISSIONS.manage_users,
        PERMISSIONS.view_audit,
        PERMISSIONS.force_logout,
    ],
    USER: [],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: string, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: string): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get the full permission matrix (for admin panel display).
 */
export function getPermissionMatrix() {
    return Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => ({
        role,
        permissions: Object.values(PERMISSIONS).map((p) => ({
            key: p,
            granted: perms.includes(p),
        })),
    }));
}
