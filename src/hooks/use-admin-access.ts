import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStaff } from "./use-staff";

export const ADMIN_PERMISSIONS = [
  "view_dashboard",
  "manage_bookings",
  "manage_properties",
  "manage_availability",
  "manage_pricing",
  "manage_payments",
  "manage_discounts",
  "manage_reviews",
  "manage_amenities",
  "manage_users",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];
export type AdminRole = "super_admin" | "property_manager" | "staff" | "guest";

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  view_dashboard: "View dashboard",
  manage_bookings: "Manage bookings",
  manage_properties: "Manage properties",
  manage_availability: "Manage availability",
  manage_pricing: "Manage pricing",
  manage_payments: "Manage payments",
  manage_discounts: "Manage discounts",
  manage_reviews: "Manage reviews",
  manage_amenities: "Manage amenities",
  manage_users: "Manage users & roles",
};

export const ROLE_DEFAULT_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [...ADMIN_PERMISSIONS],
  property_manager: [
    "view_dashboard",
    "manage_bookings",
    "manage_properties",
    "manage_availability",
    "manage_pricing",
    "manage_reviews",
    "manage_amenities",
  ],
  staff: ["view_dashboard"],
  guest: [],
};

export function useAdminAccess() {
  const { user, isStaff, loading } = useStaff();
  const db = supabase as any;

  const roleQuery = useQuery({
    queryKey: ["admin-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return (data?.role ?? null) as AdminRole | null;
    },
  });

  const permissionQuery = useQuery({
    queryKey: ["admin-permissions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await db
        .from("user_permissions")
        .select("permission,allowed")
        .eq("user_id", user!.id);
      if (error) return [] as AdminPermission[];
      return (data ?? [])
        .filter((row: any) => row.allowed)
        .map((row: any) => row.permission)
        .filter((permission: string) =>
          (ADMIN_PERMISSIONS as readonly string[]).includes(permission),
        ) as AdminPermission[];
    },
  });

  const role = roleQuery.data ?? (isStaff ? "staff" : "guest");
  const isSuperAdmin = role === "super_admin";
  const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? [];
  const permissions = Array.from(new Set([...defaults, ...(permissionQuery.data ?? [])]));
  const can = (permission: AdminPermission) =>
    isSuperAdmin || permissions.includes(permission);

  return {
    user,
    role,
    isStaff: isStaff || role === "super_admin" || role === "property_manager" || role === "staff",
    isSuperAdmin,
    permissions,
    can,
    loading: loading || (!!user && roleQuery.isLoading),
  };
}
