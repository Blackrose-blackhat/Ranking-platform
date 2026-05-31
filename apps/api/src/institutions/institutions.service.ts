import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

export class CreateInstitutionDto {
  name: string;
  code?: string;
  type?: "university" | "college" | "institute";
}

export class CreateDepartmentDto {
  institution_id: string;
  name: string;
  code?: string;
}

@Injectable()
export class InstitutionsService implements OnModuleInit {
  private supabase: SupabaseClient;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws as any },
    });
  }

  // ── Institutions ────────────────────────────

  async createInstitution(dto: CreateInstitutionDto) {
    const { data, error } = await this.supabase
      .from("institutions")
      .insert(dto)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listInstitutions() {
    const { data, error } = await this.supabase
      .from("institutions")
      .select("*, departments(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  async getInstitution(id: string) {
    const { data, error } = await this.supabase
      .from("institutions")
      .select("*, departments(*)")
      .eq("id", id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ── Departments ─────────────────────────────

  async createDepartment(dto: CreateDepartmentDto) {
    const { data, error } = await this.supabase
      .from("departments")
      .insert(dto)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async listDepartments(institutionId: string) {
    const { data, error } = await this.supabase
      .from("departments")
      .select("*")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }
}
