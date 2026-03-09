import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference } = await req.json();
    if (!reference) {
      return new Response(JSON.stringify({ error: "Reference is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if subscription already exists for this reference
    const { data: existingSub } = await supabase
      .from("subscription_plans")
      .select("id")
      .eq("payment_reference", reference)
      .eq("status", "active")
      .maybeSingle();

    if (existingSub) {
      // Already activated — get category name
      const { data: txn } = await supabase
        .from("payment_transactions")
        .select("exam_category_id")
        .eq("reference", reference)
        .maybeSingle();

      let categoryName = "your exam";
      if (txn?.exam_category_id) {
        const { data: cat } = await supabase
          .from("exam_categories")
          .select("name")
          .eq("id", txn.exam_category_id)
          .single();
        categoryName = cat?.name || categoryName;
      }

      return new Response(JSON.stringify({ 
        success: true, 
        already_active: true,
        category_name: categoryName,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify transaction with Paystack API
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${paystackKey}`,
      },
    });

    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== "success") {
      return new Response(JSON.stringify({ 
        success: false, 
        message: "Payment not confirmed by Paystack",
        paystack_status: verifyData.data?.status,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paystackData = verifyData.data;
    const metadata = paystackData.metadata || {};
    const examCategoryId = metadata.exam_category_id;
    const paymentUserId = metadata.user_id;

    // Security: ensure the logged-in user matches the payment user
    if (paymentUserId && paymentUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Payment does not belong to this user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!examCategoryId) {
      return new Response(JSON.stringify({ error: "Missing exam category in payment metadata" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update payment transaction status
    await supabase
      .from("payment_transactions")
      .update({
        status: "success",
        paystack_reference: paystackData.id?.toString(),
      })
      .eq("reference", reference);

    // Create subscription: 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await supabase.from("subscription_plans").insert({
      user_id: user.id,
      exam_category_id: examCategoryId,
      plan_type: "paystack",
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_reference: reference,
    });

    // Get category name
    const { data: cat } = await supabase
      .from("exam_categories")
      .select("name")
      .eq("id", examCategoryId)
      .single();

    return new Response(JSON.stringify({ 
      success: true,
      category_name: cat?.name || "your exam",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
