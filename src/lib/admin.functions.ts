import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const accessSchema = z.object({
  accessToken: z.string().min(1),
});

const roleSchema = accessSchema.extend({
  userId: z.string().uuid(),
  role: z.enum(["super_admin", "property_manager", "guest"]),
});

async function requireSuperAdmin(accessToken: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !authData.user) throw new Error("Your session is no longer valid. Please sign in again.");

  const { data: roleRow, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (roleError) throw roleError;
  if (roleRow?.role !== "super_admin") {
    throw new Error("Only super admins can manage user roles.");
  }

  return { supabaseAdmin, user: authData.user };
}

export const listAdminUsers = createServerFn({ method: "POST" })
  .inputValidator(accessSchema.parse)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await requireSuperAdmin(data.accessToken);
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;

    const ids = usersData.users.map((user) => user.id);
    const roles = ids.length
      ? await supabaseAdmin.from("user_roles").select("user_id,role").in("user_id", ids)
      : { data: [], error: null };

    if (roles.error) throw roles.error;
    const roleByUser = new Map((roles.data ?? []).map((row) => [row.user_id, row.role]));

    return usersData.users
      .map((user) => ({
        id: user.id,
        email: user.email ?? "No email",
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        role: roleByUser.get(user.id) ?? ("guest" as const),
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  });

export const setAdminUserRole = createServerFn({ method: "POST" })
  .inputValidator(roleSchema.parse)
  .handler(async ({ data }) => {
    const { supabaseAdmin, user } = await requireSuperAdmin(data.accessToken);

    if (data.userId === user.id && data.role !== "super_admin") {
      throw new Error("You cannot remove your own super admin access.");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", data.userId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .update({ role: data.role })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error) throw error;
    }

    return { ok: true as const };
  });
