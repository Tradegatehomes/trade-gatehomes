import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailPlus, RefreshCw, ShieldCheck, Trash2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_DEFAULT_PERMISSIONS,
  type AdminPermission,
  type AdminRole,
} from "@/hooks/use-admin-access";

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_id: string | null;
  role: AdminRole;
  permissions: AdminPermission[];
  property_ids: string[];
};

const roleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  property_manager: "Property Manager",
  staff: "Staff",
  guest: "Guest",
};

export function UserAccess() {
  const db = supabase as any;
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Exclude<AdminRole, "guest">>("staff");

  const usersQuery = useQuery({
    queryKey: ["admin-user-access"],
    queryFn: async () => {
      const [profilesResult, rolesResult, permissionsResult, assignmentsResult, propertiesResult, invitesResult] =
        await Promise.all([
          db.from("profiles").select("id,full_name,email").order("full_name"),
          db.from("user_roles").select("id,user_id,role"),
          db.from("user_permissions").select("user_id,permission,allowed"),
          db.from("user_property_assignments").select("user_id,property_id"),
          db.from("properties").select("id,name").order("name"),
          db.from("admin_invites").select("id,email,role,created_at,expires_at,accepted_at").order("created_at", { ascending: false }),
        ]);

      for (const result of [
        profilesResult,
        rolesResult,
        permissionsResult,
        assignmentsResult,
        propertiesResult,
        invitesResult,
      ]) {
        if (result.error) throw result.error;
      }

      const roles = rolesResult.data ?? [];
      const permissions = permissionsResult.data ?? [];
      const assignments = assignmentsResult.data ?? [];

      const users: UserRow[] = (profilesResult.data ?? []).map((profile: any) => {
        const roleRow = roles.find((row: any) => row.user_id === profile.id);
        const role = (roleRow?.role ?? "guest") as AdminRole;
        return {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role_id: roleRow?.id ?? null,
          role,
          permissions: permissions
            .filter((row: any) => row.user_id === profile.id && row.allowed)
            .map((row: any) => row.permission)
            .filter((permission: string) =>
              (ADMIN_PERMISSIONS as readonly string[]).includes(permission),
            ) as AdminPermission[],
          property_ids: assignments
            .filter((row: any) => row.user_id === profile.id)
            .map((row: any) => row.property_id),
        };
      });

      return {
        users,
        properties: (propertiesResult.data ?? []) as { id: string; name: string }[],
        invites: (invitesResult.data ?? []) as {
          id: string;
          email: string;
          role: AdminRole;
          created_at: string;
          expires_at: string;
          accepted_at: string | null;
        }[],
      };
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const email = inviteEmail.trim().toLowerCase();
      if (!email) throw new Error("Enter an email address.");

      const { data, error } = await db.rpc("invite_admin_by_email", {
        p_email: email,
        p_role: inviteRole,
      });
      if (error) throw error;

      if ((data as any)?.status === "pending") {
        const { error: emailError } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (emailError) {
          return { ...data, emailSent: false, emailError: emailError.message };
        }
        return { ...data, emailSent: true };
      }

      return data;
    },
    onSuccess: (result: any) => {
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["admin-user-access"] });
      if (result?.status === "assigned") {
        toast.success("Admin access assigned");
      } else if (result?.emailSent) {
        toast.success("Admin invitation sent");
      } else {
        toast.success("Admin invitation saved");
        if (result?.emailError) toast.error(result.emailError);
      }
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not add admin"),
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (invite: { email: string; role: AdminRole }) => {
      const { data, error } = await db.rpc("invite_admin_by_email", {
        p_email: invite.email,
        p_role: invite.role,
      });
      if (error) throw error;

      const { error: emailError } = await supabase.auth.signInWithOtp({
        email: invite.email,
        options: { emailRedirectTo: window.location.origin + "/admin" },
      });
      if (emailError) throw emailError;

      return data;
    },
    onSuccess: () => {
      toast.success("Invitation resent");
      qc.invalidateQueries({ queryKey: ["admin-user-access"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not resend invitation"),
  });

  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await db.rpc("cancel_admin_invite", {
        p_invite_id: inviteId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Pending invitation cancelled");
      qc.invalidateQueries({ queryKey: ["admin-user-access"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not cancel invitation"),
  });

  const saveMutation = useMutation({
    mutationFn: async (input: {
      user: UserRow;
      role: AdminRole;
      permissions: AdminPermission[];
      propertyIds: string[];
    }) => {
      const { user, role, permissions, propertyIds } = input;

      if (user.role_id) {
        const { error } = await db.from("user_roles").update({ role }).eq("id", user.role_id);
        if (error) throw error;
      } else {
        const { error } = await db.from("user_roles").insert({ user_id: user.id, role });
        if (error) throw error;
      }

      const { error: clearPermissionsError } = await db
        .from("user_permissions")
        .delete()
        .eq("user_id", user.id);
      if (clearPermissionsError) throw clearPermissionsError;

      const explicitPermissions =
        role === "super_admin"
          ? []
          : permissions.filter(
              (permission) => !ROLE_DEFAULT_PERMISSIONS[role].includes(permission),
            );

      if (explicitPermissions.length) {
        const { error } = await db.from("user_permissions").insert(
          explicitPermissions.map((permission) => ({
            user_id: user.id,
            permission,
            allowed: true,
          })),
        );
        if (error) throw error;
      }

      const { error: clearAssignmentsError } = await db
        .from("user_property_assignments")
        .delete()
        .eq("user_id", user.id);
      if (clearAssignmentsError) throw clearAssignmentsError;

      if (role !== "super_admin" && propertyIds.length) {
        const { error } = await db.from("user_property_assignments").insert(
          propertyIds.map((property_id) => ({ user_id: user.id, property_id })),
        );
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Access updated");
      qc.invalidateQueries({ queryKey: ["admin-user-access"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not update access"),
  });

  if (usersQuery.isLoading) {
    return <p className="text-muted-foreground">Loading users…</p>;
  }

  if (usersQuery.error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-card p-6">
        <h3 className="font-display text-xl font-bold text-ink">Users & roles needs the database migration</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          The interface is ready, but the permissions tables have not been created in Supabase yet.
        </p>
      </div>
    );
  }

  const users = usersQuery.data?.users ?? [];
  const properties = usersQuery.data?.properties ?? [];
  const invites = usersQuery.data?.invites ?? [];
  const pendingInvites = invites.filter((invite) => !invite.accepted_at);

  return (
    <div className="mt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Access control</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-ink">Users & roles</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Assign staff roles, choose what each person can manage, and limit them to specific properties.
          </p>
        </div>
        <Badge variant="secondary" className="rounded-full">
          <ShieldCheck className="mr-1 size-3.5" /> Super Admin only
        </Badge>
      </div>

      <div className="mb-6 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-brand">
            <MailPlus className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-bold text-ink">Add new admin</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter their email and choose a role. Existing users are updated immediately; new users receive a sign-in invitation.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
              <Input
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                className="rounded-xl"
              />
              <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as Exclude<AdminRole, "guest">)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="property_manager">Property Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button
                className="rounded-xl"
                disabled={inviteMutation.isPending || !inviteEmail.trim()}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? "Adding…" : "Add admin"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="mb-6 rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Pending invites</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                These people have been invited but have not completed their first sign-in yet.
              </p>
            </div>
            <Badge variant="secondary" className="rounded-full">{pendingInvites.length} pending</Badge>
          </div>
          <div className="mt-4 divide-y divide-border">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{invite.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Invited as {roleLabels[invite.role] ?? invite.role} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="w-fit rounded-full">Pending Invite</Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    disabled={resendInviteMutation.isPending || cancelInviteMutation.isPending}
                    onClick={() => resendInviteMutation.mutate({ email: invite.email, role: invite.role })}
                  >
                    <RefreshCw className="mr-1 size-3.5" />
                    Resend
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-destructive hover:text-destructive"
                    disabled={resendInviteMutation.isPending || cancelInviteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Cancel the pending invitation for ${invite.email}?`)) {
                        cancelInviteMutation.mutate(invite.id);
                      }
                    }}
                  >
                    <Trash2 className="mr-1 size-3.5" />
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {users.map((user) => (
          <UserAccessCard
            key={user.id}
            user={user}
            properties={properties}
            saving={saveMutation.isPending}
            onSave={(values) => saveMutation.mutate({ user, ...values })}
          />
        ))}
      </div>
    </div>
  );
}

function UserAccessCard({
  user,
  properties,
  saving,
  onSave,
}: {
  user: UserRow;
  properties: { id: string; name: string }[];
  saving: boolean;
  onSave: (values: {
    role: AdminRole;
    permissions: AdminPermission[];
    propertyIds: string[];
  }) => void;
}) {
  const [role, setRole] = useState<AdminRole>(user.role);
  const [permissions, setPermissions] = useState<AdminPermission[]>(() =>
    Array.from(
      new Set([
        ...ROLE_DEFAULT_PERMISSIONS[user.role],
        ...user.permissions,
      ]),
    ),
  );
  const [propertyIds, setPropertyIds] = useState<string[]>(user.property_ids);

  const effectivePermissions = useMemo(
    () =>
      role === "super_admin"
        ? [...ADMIN_PERMISSIONS]
        : Array.from(new Set([...ROLE_DEFAULT_PERMISSIONS[role], ...permissions])),
    [role, permissions],
  );

  function changeRole(next: AdminRole) {
    setRole(next);
    setPermissions([...ROLE_DEFAULT_PERMISSIONS[next]]);
    if (next === "super_admin" || next === "guest") setPropertyIds([]);
  }

  function togglePermission(permission: AdminPermission, checked: boolean) {
    if (ROLE_DEFAULT_PERMISSIONS[role].includes(permission)) return;
    setPermissions((current) =>
      checked
        ? Array.from(new Set([...current, permission]))
        : current.filter((item) => item !== permission),
    );
  }

  function toggleProperty(propertyId: string, checked: boolean) {
    setPropertyIds((current) =>
      checked
        ? Array.from(new Set([...current, propertyId]))
        : current.filter((id) => id !== propertyId),
    );
  }

  return (
    <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-brand/10 text-brand">
              <UserCog className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">
                {user.full_name || user.email || "Unnamed user"}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email || user.id}</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-56">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Role
          </p>
          <Select value={role} onValueChange={(value) => changeRole(value as AdminRole)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(roleLabels) as AdminRole[]).map((value) => (
                <SelectItem key={value} value={value}>
                  {roleLabels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {role !== "guest" && (
        <>
          <div className="mt-5">
            <p className="text-sm font-semibold text-ink">Permissions</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Default permissions for the selected role are locked on. Add any extra access needed.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {ADMIN_PERMISSIONS.map((permission) => {
                const locked = role === "super_admin" || ROLE_DEFAULT_PERMISSIONS[role].includes(permission);
                return (
                  <label
                    key={permission}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2.5 text-sm"
                  >
                    <Checkbox
                      checked={effectivePermissions.includes(permission)}
                      disabled={locked}
                      onCheckedChange={(value) => togglePermission(permission, value === true)}
                    />
                    <span className="text-ink">{PERMISSION_LABELS[permission]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {role !== "super_admin" && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-ink">Assigned properties</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Staff and property managers can only work with the properties selected here.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {properties.map((property) => (
                  <label
                    key={property.id}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 px-3 py-2.5 text-sm"
                  >
                    <Checkbox
                      checked={propertyIds.includes(property.id)}
                      onCheckedChange={(value) => toggleProperty(property.id, value === true)}
                    />
                    <span className="truncate text-ink">{property.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-5 flex justify-end">
        <Button
          className="rounded-full"
          disabled={saving}
          onClick={() => onSave({ role, permissions: effectivePermissions, propertyIds })}
        >
          {saving ? "Saving…" : "Save access"}
        </Button>
      </div>
    </div>
  );
}
