import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
    const payload = await req.json();
    
    console.log("GIGL Webhook received:", payload);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      shipment_id,
      tracking_number,
      status,
      location,
      timestamp,
      notes,
      event_type,
    } = payload;

    if (!tracking_number || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: delivery, error: deliveryError } = await supabaseClient
      .from("deliveries")
      .select("id, order_id")
      .eq("gigl_shipment_id", shipment_id)
      .single();

    if (deliveryError || !delivery) {
      console.error("Delivery not found:", deliveryError);
      return new Response(
        JSON.stringify({ error: "Delivery not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const statusMap: Record<string, string> = {
      "picked_up": "pickup_scheduled",
      "in_transit": "in_transit",
      "out_for_delivery": "out_for_delivery",
      "delivered": "delivered",
      "failed": "failed",
      "returned": "returned",
    };

    const deliveryStatus = statusMap[status.toLowerCase()] || status;

    const updateData: any = {
      delivery_status: deliveryStatus,
      last_status_update: new Date().toISOString(),
      gigl_response_data: payload,
    };

    if (deliveryStatus === "delivered") {
      updateData.actual_delivery_date = timestamp || new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("deliveries")
      .update(updateData)
      .eq("id", delivery.id);

    if (updateError) {
      console.error("Error updating delivery:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update delivery" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabaseClient
      .from("delivery_status_history")
      .insert({
        delivery_id: delivery.id,
        status: deliveryStatus,
        location: location || null,
        notes: notes || null,
        updated_by: "gigl_webhook",
      });

    if (deliveryStatus === "delivered") {
      await supabaseClient
        .from("orders")
        .update({
          status: "delivered",
          delivered_at: timestamp || new Date().toISOString(),
        })
        .eq("id", delivery.order_id);
    } else if (["in_transit", "out_for_delivery"].includes(deliveryStatus)) {
      await supabaseClient
        .from("orders")
        .update({ status: "shipped" })
        .eq("id", delivery.order_id);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("GIGL Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});