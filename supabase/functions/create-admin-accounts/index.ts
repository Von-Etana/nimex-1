import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const adminAccounts = [
      {
        email: 'admin@nimex.ng',
        password: 'NimexAdmin2024!',
        full_name: 'NIMEX Super Admin',
        roleName: 'super_admin',
      },
      {
        email: 'accounts@nimex.ng',
        password: 'NimexAccounts2024!',
        full_name: 'NIMEX Account Team',
        roleName: 'account_team',
      },
      {
        email: 'support@nimex.ng',
        password: 'NimexSupport2024!',
        full_name: 'NIMEX Customer Support',
        roleName: 'customer_support',
      },
    ];

    const results = {
      created: [] as any[],
      existing: [] as any[],
      errors: [] as string[],
    };

    const { data: existingUsers } = await supabase.auth.admin.listUsers();

    for (const account of adminAccounts) {
      const userExists = existingUsers?.users?.some(u => u.email === account.email);

      if (!userExists) {
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            full_name: account.full_name,
          },
        });

        if (userError) {
          results.errors.push(`${account.email}: ${userError.message}`);
          continue;
        }

        if (!userData.user) {
          results.errors.push(`${account.email}: User creation returned no data`);
          continue;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userData.user.id,
            email: account.email,
            full_name: account.full_name,
            role: 'admin',
          });

        if (profileError) {
          results.errors.push(`${account.email} profile: ${profileError.message}`);
        }

        const { data: roleData } = await supabase
          .from('admin_roles')
          .select('id')
          .eq('name', account.roleName)
          .single();

        if (roleData) {
          const { error: assignmentError } = await supabase
            .from('admin_role_assignments')
            .upsert({
              user_id: userData.user.id,
              role_id: roleData.id,
            });

          if (assignmentError) {
            results.errors.push(`${account.email} role assignment: ${assignmentError.message}`);
          }
        }

        results.created.push({
          email: account.email,
          role: account.roleName,
          id: userData.user.id,
        });
      } else {
        const existingUser = existingUsers?.users?.find(u => u.email === account.email);

        if (existingUser) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: existingUser.id,
              email: account.email,
              full_name: account.full_name,
              role: 'admin',
            });

          if (profileError) {
            results.errors.push(`${account.email} profile update: ${profileError.message}`);
          }

          const { data: roleData } = await supabase
            .from('admin_roles')
            .select('id')
            .eq('name', account.roleName)
            .single();

          if (roleData) {
            const { error: assignmentError } = await supabase
              .from('admin_role_assignments')
              .upsert({
                user_id: existingUser.id,
                role_id: roleData.id,
              });

            if (assignmentError && !assignmentError.message.includes('duplicate')) {
              results.errors.push(`${account.email} role assignment: ${assignmentError.message}`);
            }
          }
        }

        results.existing.push({
          email: account.email,
          role: account.roleName,
          message: 'Account already exists, ensured profile and role assignment',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Admin accounts setup completed',
        results,
        credentials: adminAccounts.map(a => ({
          email: a.email,
          password: a.password,
          role: a.roleName,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Admin account creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
