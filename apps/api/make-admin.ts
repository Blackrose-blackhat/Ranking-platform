import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

import * as WebSocket from "ws";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
    realtime: { transport: WebSocket as any }
});

async function makeSuperAdmin() {
  const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
  
  if (fetchError) {
    console.error("Failed to fetch users:", fetchError);
    return;
  }

  if (!users || users.users.length === 0) {
    console.log("No users found.");
    return;
  }

  // Update all users to super_admin for testing
  for (const user of users.users) {
    console.log(`Updating user ${user.email}...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, role: "super_admin" }
    });
    
    if (updateError) {
      console.error(`Failed to update ${user.email}:`, updateError);
    } else {
      console.log(`Successfully made ${user.email} a super_admin!`);
    }

    // Update public.users table as well if it exists
    await supabase.from("users").update({ role: "super_admin" }).eq("id", user.id);
  }
}

makeSuperAdmin();
