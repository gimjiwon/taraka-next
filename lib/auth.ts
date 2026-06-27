import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function getRequestUser(request?: NextRequest) {
  const authHeader = request?.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";

  if (token) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user) return data.user;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}
