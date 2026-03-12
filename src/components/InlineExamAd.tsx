import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { GoogleAdSense } from "@/components/GoogleAdSense";

const AD_SLOT = "6977766720";

/**
 * Compact inline ad shown between exam questions for free users.
 * Shows every N questions (controlled by parent).
 */
export const InlineExamAd = () => {
  const { isSubscribed, loading } = useSubscriptionStatus();

  if (loading || isSubscribed) return null;

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
      <div className="text-[10px] text-muted-foreground text-center py-0.5">Sponsored</div>
      <GoogleAdSense
        adSlot={AD_SLOT}
        adFormat="fluid"
        className="w-full"
        style={{ minHeight: "60px" }}
      />
    </div>
  );
};
