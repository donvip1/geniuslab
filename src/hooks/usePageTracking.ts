import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
};

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from("page_views").insert({
          page_path: location.pathname,
          user_id: user?.id || null,
          session_id: sessionId,
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
        });
      } catch (error) {
        // Silently fail - don't break the app for analytics
        console.error("Page tracking error:", error);
      }
    };

    trackPageView();
  }, [location.pathname]);
};

export const trackAdClick = async (advertisementId: string): Promise<void> => {
  try {
    const sessionId = getOrCreateSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    // Insert click record
    await supabase.from("ad_clicks").insert({
      advertisement_id: advertisementId,
      user_id: user?.id || null,
      session_id: sessionId,
    });

    // Get current click count and increment
    const { data: currentAd } = await supabase
      .from("advertisements")
      .select("click_count")
      .eq("id", advertisementId)
      .single();
      
    if (currentAd) {
      await supabase
        .from("advertisements")
        .update({ click_count: (currentAd.click_count || 0) + 1 })
        .eq("id", advertisementId);
    }
  } catch (error) {
    console.error("Ad click tracking error:", error);
  }
};
