import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-paystack-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const body = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get("x-paystack-signature");
    if (signature) {
      const hash = createHmac("sha512", paystackKey).update(body).digest("hex");
      if (hash !== signature) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const event = JSON.parse(body);
    
    if (event.event !== "charge.success") {
      return new Response(JSON.stringify({ message: "Event ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference, metadata } = event.data;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Update payment transaction
    await supabase
      .from("payment_transactions")
      .update({
        status: "success",
        paystack_reference: event.data.id?.toString(),
      })
      .eq("reference", reference);

    const userId = metadata?.user_id;
    const examCategoryId = metadata?.exam_category_id;

    if (!userId || !examCategoryId) {
      console.error("Missing metadata in webhook:", metadata);
      return new Response(JSON.stringify({ error: "Missing metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create subscription: 1 month = 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase.from("subscription_plans").insert({
      user_id: userId,
      exam_category_id: examCategoryId,
      plan_type: "paystack",
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: reference,
    });

    return new Response(JSON.stringify({ message: "Subscription activated" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
