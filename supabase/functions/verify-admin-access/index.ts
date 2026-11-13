import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
};

// IP whitelist - Add your trusted IPs here
// You can get your IP from: https://api.ipify.org or ipconfig/ifconfig
const WHITELISTED_IPS: string[] = [
  // Add your admin IPs here, for example:
  // "197.210.226.58", // Your office IP
  // "102.89.32.15",   // Your home IP
  // "::1",            // IPv6 localhost for development
  // "127.0.0.1",      // IPv4 localhost for development
];

// Enable/disable IP whitelisting (set to false during development)
const ENABLE_IP_WHITELIST = Deno.env.get("ENABLE_ADMIN_IP_WHITELIST") === "true";

interface AdminAccessLog {
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string;
  access_granted: boolean;
  reason: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header", access: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token", access: false }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get IP address from headers
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
               req.headers.get("x-real-ip") ||
               "unknown";

    const userAgent = req.headers.get("user-agent") || "unknown";

    // Check if user has admin role in database
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      // Log unauthorized access attempt
      await logAccess(supabaseClient, {
        user_id: user.id,
        email: user.email || "unknown",
        ip_address: ip,
        user_agent: userAgent,
        access_granted: false,
        reason: "No admin role found",
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "Access denied - Admin privileges required",
          access: false,
          reason: "no_admin_role"
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check IP whitelist if enabled
    if (ENABLE_IP_WHITELIST && WHITELISTED_IPS.length > 0) {
      if (!WHITELISTED_IPS.includes(ip)) {
        // Log blocked IP attempt
        await logAccess(supabaseClient, {
          user_id: user.id,
          email: user.email || "unknown",
          ip_address: ip,
          user_agent: userAgent,
          access_granted: false,
          reason: `IP not whitelisted: ${ip}`,
          timestamp: new Date().toISOString(),
        });

        // Send alert notification (you can add email/SMS here)
        console.error(`[SECURITY ALERT] Unauthorized admin access attempt from IP: ${ip}, User: ${user.email}`);

        return new Response(
          JSON.stringify({
            error: "Access denied - IP not authorized",
            access: false,
            reason: "ip_not_whitelisted"
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Check for suspicious session behavior
    const { data: recentSessions, error: sessionError } = await supabaseClient
      .from("admin_access_logs")
      .select("ip_address, timestamp")
      .eq("user_id", user.id)
      .eq("access_granted", true)
      .order("timestamp", { ascending: false })
      .limit(5);

    if (!sessionError && recentSessions && recentSessions.length > 0) {
      const lastSession = recentSessions[0];
      const lastIP = lastSession.ip_address;

      // Alert if IP changed rapidly (potential session hijacking)
      if (lastIP !== ip && lastIP !== "unknown" && ip !== "unknown") {
        const lastTime = new Date(lastSession.timestamp).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - lastTime) / 1000 / 60; // minutes

        if (timeDiff < 5) { // IP changed in less than 5 minutes
          console.warn(`[SECURITY WARNING] IP changed rapidly for user ${user.email}: ${lastIP} -> ${ip}`);
        }
      }
    }

    // Log successful access
    await logAccess(supabaseClient, {
      user_id: user.id,
      email: user.email || "unknown",
      ip_address: ip,
      user_agent: userAgent,
      access_granted: true,
      reason: "Access granted",
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        access: true,
        user: {
          id: user.id,
          email: user.email,
        },
        ip_verified: ENABLE_IP_WHITELIST ? "yes" : "disabled",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("Error in verify-admin-access:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", access: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function logAccess(supabaseClient: any, log: AdminAccessLog) {
  try {
    await supabaseClient
      .from("admin_access_logs")
      .insert([log]);
  } catch (error) {
    console.error("Failed to log access:", error);
  }
}
