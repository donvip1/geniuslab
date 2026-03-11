import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { GoogleAdSense } from "@/components/GoogleAdSense";

interface SubscriptionAwareAdProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shows Google AdSense ads only to non-subscribed users.
 * Subscribed users see nothing — clean ad-free experience.
 */
export const SubscriptionAwareAd = ({
  adSlot,
  adFormat = "auto",
  className,
  style,
}: SubscriptionAwareAdProps) => {
  const { isSubscribed, loading } = useSubscriptionStatus();

  // Don't show ads while loading or if subscribed
  if (loading || isSubscribed) return null;

  return (
    <GoogleAdSense
      adSlot={adSlot}
      adFormat={adFormat}
      className={className}
      style={style}
    />
  );
};

// Convenience components
export const AdBannerSmart = ({ adSlot }: { adSlot: string }) => (
  <SubscriptionAwareAd
    adSlot={adSlot}
    adFormat="horizontal"
    className="w-full my-4"
    style={{ minHeight: "90px" }}
  />
);

export const AdRectangleSmart = ({ adSlot }: { adSlot: string }) => (
  <SubscriptionAwareAd
    adSlot={adSlot}
    adFormat="rectangle"
    className="mx-auto my-4"
    style={{ minHeight: "250px", maxWidth: "336px" }}
  />
);

export const AdInArticleSmart = ({ adSlot }: { adSlot: string }) => (
  <SubscriptionAwareAd
    adSlot={adSlot}
    adFormat="fluid"
    className="my-6"
    style={{ minHeight: "100px" }}
  />
);
