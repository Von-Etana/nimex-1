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

    const results = {
      deletedUsers: [] as string[],
      buyer: null as any,
      vendor: null as any,
      errors: [] as string[],
    };

    // First, delete all existing users except demo accounts
    const { data: allUsers } = await supabase.auth.admin.listUsers();

    if (allUsers?.users) {
      for (const user of allUsers.users) {
        // Skip demo accounts
        if (user.email === 'demo@buyer.nimex.ng' || user.email === 'demo@vendor.nimex.ng') {
          continue;
        }

        try {
          // Delete user from auth
          await supabase.auth.admin.deleteUser(user.id);
          results.deletedUsers.push(user.email || 'unknown');

          // Delete related data (this will cascade due to foreign keys)
          // Profiles, vendors, orders, etc. will be deleted automatically
        } catch (deleteError) {
          results.errors.push(`Failed to delete user ${user.email}: ${deleteError.message}`);
        }
      }
    }

    // Now create/recreate demo accounts
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const buyerExists = existingUsers?.users?.some(u => u.email === 'demo@buyer.nimex.ng');

    if (!buyerExists) {
      const { data: buyerData, error: buyerError } = await supabase.auth.admin.createUser({
        email: 'demo@buyer.nimex.ng',
        password: 'DemoPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Buyer',
        },
      });

      if (buyerError) {
        results.errors.push(`Buyer account error: ${buyerError.message}`);
      } else if (buyerData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: buyerData.user.id,
            email: 'demo@buyer.nimex.ng',
            full_name: 'Demo Buyer',
            phone: '+234 800 123 4567',
            role: 'buyer',
          });

        if (profileError) {
          results.errors.push(`Buyer profile error: ${profileError.message}`);
        }

        results.buyer = { id: buyerData.user.id, email: buyerData.user.email };
      }
    } else {
      results.buyer = { message: 'Buyer account already exists' };
    }

    const vendorExists = existingUsers?.users?.some(u => u.email === 'demo@vendor.nimex.ng');

    if (!vendorExists) {
      const { data: vendorData, error: vendorError } = await supabase.auth.admin.createUser({
        email: 'demo@vendor.nimex.ng',
        password: 'DemoPassword123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Vendor',
        },
      });

      if (vendorError) {
        results.errors.push(`Vendor account error: ${vendorError.message}`);
      } else if (vendorData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: vendorData.user.id,
            email: 'demo@vendor.nimex.ng',
            full_name: 'Demo Vendor',
            phone: '+234 800 765 4321',
            role: 'vendor',
          });

        if (profileError) {
          results.errors.push(`Vendor profile error: ${profileError.message}`);
        }

        const { data: vendorProfile, error: vendorProfileError } = await supabase
          .from('vendors')
          .upsert({
            user_id: vendorData.user.id,
            business_name: 'Demo Artisan Crafts',
            business_description: 'Authentic handmade Nigerian crafts and textiles',
            business_address: '45 Craft Market Road, Ikeja',
            business_phone: '+234 800 765 4321',
            verification_status: 'verified',
            rating: 4.8,
            total_sales: 125,
            wallet_balance: 250500,
            is_active: true,
          })
          .select()
          .single();

        if (vendorProfileError) {
          results.errors.push(`Vendor business profile error: ${vendorProfileError.message}`);
        }

        results.vendor = { id: vendorData.user.id, email: vendorData.user.email };
      }
    } else {
      results.vendor = { message: 'Vendor account already exists' };
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database cleanup and demo accounts setup completed',
        results,
        credentials: {
          buyer: {
            email: 'demo@buyer.nimex.ng',
            password: 'DemoPassword123!',
          },
          vendor: {
            email: 'demo@vendor.nimex.ng',
            password: 'DemoPassword123!',
          },
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Demo account creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});