import { useEffect, useState } from "react";
import { isNativePlatform, showBannerAd, hideBannerAd } from "@/lib/admob";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface NativeAdBannerProps {
  position?: "TOP" | "BOTTOM";
}

/**
 * Shows a native AdMob banner on Capacitor (Android/iOS).
 * On web, renders nothing (AdSense handles web ads).
 * Subscribed users see no ads.
 */
export const NativeAdBanner = ({ position = "BOTTOM" }: NativeAdBannerProps) => {
  const { isSubscribed, loading } = useSubscriptionStatus();
  const [isNative] = useState(isNativePlatform());

  useEffect(() => {
    if (!isNative || loading) return;

    if (!isSubscribed) {
      showBannerAd(position);
    }

    return () => {
      hideBannerAd();
    };
  }, [isNative, isSubscribed, loading, position]);

  // Native ads are overlaid by the plugin — no DOM element needed
  return null;
};
