import { Injectable, OnModuleInit } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import ws from "ws";

import { Role } from "../auth/roles.enum";

export class SyncUserDto {
  role?: Role;
  institutionId?: string;
  departmentId?: string;
  permissions?: string[];
}

@Injectable()
export class UsersService implements OnModuleInit {
  private supabaseAdmin: SupabaseClient;

  onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL || "https://krkmjuhjzzmpxmpzumdu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "your_supabase_service_role_key";
    this.supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      realtime: {
        transport: ws as any,
      },
    });
  }

  async createUser(syncData: SyncUserDto & { email: string; password?: string }) {
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: syncData.email,
      password: syncData.password || "Password123!",
      email_confirm: true,
      user_metadata: {
        role: syncData.role || Role.FACULTY,
        institutionId: syncData.institutionId || null,
        departmentId: syncData.departmentId || null,
      }
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    const { data, error } = await this.supabaseAdmin
      .from("users")
      .upsert({
        id: authData.user.id,
        email: syncData.email,
        role: syncData.role ?? Role.FACULTY,
        institution_id: syncData.institutionId || null,
        department_id: syncData.departmentId || null,
        permissions: syncData.permissions ?? [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to sync user: ${error.message}`);
    }

    return { user: authData.user, profile: data };
  }

  async inviteUser(email: string, syncData: SyncUserDto, redirectTo?: string) {
    let authUser: any;
    let inviteLink: string | undefined;

    // Try sending email natively
    const { data: inviteData, error: inviteError } = await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        role: syncData.role || Role.FACULTY,
        institutionId: syncData.institutionId || null,
        departmentId: syncData.departmentId || null,
      },
      redirectTo: redirectTo,
    });

    if (inviteError) {
      // Fallback: Generate the link if email sending failed
      console.warn(`Email invite failed for ${email}, generating fallback link...`, inviteError);
      const { data: linkData, error: linkError } = await this.supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          data: {
            role: syncData.role || Role.FACULTY,
            institutionId: syncData.institutionId || null,
            departmentId: syncData.departmentId || null,
          },
          redirectTo: redirectTo,
        }
      });
      if (linkError) throw new Error(`Failed to generate fallback invite link: ${linkError.message}`);
      
      authUser = linkData.user;
      inviteLink = linkData.properties?.action_link;
    } else {
      authUser = inviteData.user;
    }

    const { data, error } = await this.supabaseAdmin
      .from("users")
      .upsert({
        id: authUser.id,
        email: email,
        role: syncData.role ?? Role.FACULTY,
        institution_id: syncData.institutionId || null,
        department_id: syncData.departmentId || null,
        permissions: syncData.permissions ?? [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to sync invited user: ${error.message}`);
    }

    return { user: authUser, profile: data, inviteLink };
  }

  async syncUser(userId: string, email: string, syncData: SyncUserDto) {
    const { data, error } = await this.supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        email: email,
        role: syncData.role ?? Role.FACULTY,
        institution_id: syncData.institutionId || null,
        department_id: syncData.departmentId || null,
        permissions: syncData.permissions ?? [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to sync user: ${error.message}`);
    }

    return data;
  }
}
