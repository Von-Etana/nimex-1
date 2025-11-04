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
      product: null as any,
      errors: [] as string[],
    };

    // Get the demo vendor ID
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('business_name', 'Demo Artisan Crafts')
      .single();

    if (vendorError || !vendorData) {
      results.errors.push('Demo vendor not found. Please run create-demo-accounts first.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Demo vendor not found',
          results,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get electronics category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Electronics')
      .single();

    if (categoryError || !categoryData) {
      results.errors.push('Electronics category not found');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Category not found',
          results,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create demo product
    const demoProduct = {
      vendor_id: vendorData.id,
      category_id: categoryData.id,
      title: 'Demo Smartphone - Test Product',
      description: 'This is a demo product for testing the complete ecommerce flow. Experience adding to cart, checkout, escrow protection, and delivery tracking. Perfect for testing all NIMEX features.',
      price: 150000, // ₦150,000
      compare_at_price: 180000, // ₦180,000
      images: [
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
        'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=400&h=400&fit=crop'
      ],
      stock_quantity: 10,
      location: 'Lagos, Nigeria',
      status: 'active',
      views_count: 0,
      favorites_count: 0,
      rating: 4.5,
      is_featured: true,
    };

    // Check if demo product already exists
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('title', demoProduct.title)
      .single();

    if (existingProduct) {
      results.product = { message: 'Demo product already exists', id: existingProduct.id };
    } else {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert(demoProduct)
        .select()
        .single();

      if (productError) {
        results.errors.push(`Product creation error: ${productError.message}`);
      } else {
        results.product = productData;
      }
    }

    const hasErrors = results.errors.length > 0;

    return new Response(
      JSON.stringify({
        success: !hasErrors,
        message: hasErrors ? 'Demo product creation completed with errors' : 'Demo product created successfully',
        results,
        demoProduct: {
          title: demoProduct.title,
          price: `₦${demoProduct.price.toLocaleString()}`,
          description: demoProduct.description,
          features: [
            'Complete ecommerce flow testing',
            'Cart functionality',
            'Secure checkout with Paystack',
            'Escrow protection',
            'GIGL delivery integration',
            'Order tracking',
            'Vendor dashboard access'
          ]
        },
      }),
      {
        status: hasErrors ? 207 : 200, // 207 = Multi-Status
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Demo product creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});