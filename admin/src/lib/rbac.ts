export type UserRole = "super_admin" | "sales_manager" | "sales_executive" | "viewer";

export interface PermissionCheck {
  role: UserRole;
  action: "create" | "edit" | "delete" | "restore" | "export" | "settings" | "users";
}

const PERMISSIONS_MATRIX: Record<UserRole, Record<PermissionCheck["action"], boolean>> = {
  super_admin: {
    create: true,
    edit: true,
    delete: true,
    restore: true,
    export: true,
    settings: true,
    users: true,
  },
  sales_manager: {
    create: true,
    edit: true,
    delete: false,
    restore: false,
    export: true,
    settings: false,
    users: false,
  },
  sales_executive: {
    create: true,
    edit: true,
    delete: false,
    restore: false,
    export: false,
    settings: false,
    users: false,
  },
  viewer: {
    create: false,
    edit: false,
    delete: false,
    restore: false,
    export: false,
    settings: false,
    users: false,
  },
};

export function hasPermission(role: UserRole = "super_admin", action: PermissionCheck["action"]): boolean {
  return PERMISSIONS_MATRIX[role]?.[action] ?? false;
}
