import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to check if the current user has any active subscription.
 * Returns { isSubscribed, loading, userId }
 * Non-subscribed (or logged-out) users see ads.
 */
export const useSubscriptionStatus = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      const now = new Date().toISOString();

      // Check active subscription
      const { data: sub } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "active")
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      if (sub) {
        setIsSubscribed(true);
        setLoading(false);
        return;
      }

      // Check active PIN
      const { data: pin } = await supabase
        .from("access_pins")
        .select("id")
        .eq("used_by", user.id)
        .eq("is_used", true)
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      if (pin) {
        setIsSubscribed(true);
      }

      setLoading(false);
    };

    check();
  }, []);

  return { isSubscribed, loading, userId };
};
