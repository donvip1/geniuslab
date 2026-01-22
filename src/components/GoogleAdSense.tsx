import { useEffect, useRef } from "react";

interface GoogleAdSenseProps {
  adSlot: string;
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  style?: React.CSSProperties;
  className?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const GoogleAdSense = ({
  adSlot,
  adFormat = "auto",
  style,
  className = "",
  fullWidthResponsive = true,
}: GoogleAdSenseProps) => {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // Only load ad once
    if (isAdLoaded.current) return;
    
    try {
      if (typeof window !== "undefined" && adRef.current) {
        // Check if adsbygoogle is available
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
          isAdLoaded.current = true;
        }
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  // Get the AdSense client ID from environment or use placeholder
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";

  // Don't render if no client ID is configured
  if (!adClient) {
    return null;
  }

  return (
    <div className={`adsense-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
      />
    </div>
  );
};

// Banner ad for header/footer areas
export const AdBanner = ({ adSlot }: { adSlot: string }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="horizontal"
    className="w-full my-4"
    style={{ minHeight: "90px" }}
  />
);

// Rectangle ad for sidebar or content areas
export const AdRectangle = ({ adSlot }: { adSlot: string }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="rectangle"
    className="mx-auto my-4"
    style={{ minHeight: "250px", maxWidth: "336px" }}
  />
);

// In-article ad
export const AdInArticle = ({ adSlot }: { adSlot: string }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="fluid"
    className="my-6"
    style={{ minHeight: "100px" }}
  />
);

// Responsive auto ad
export const AdAuto = ({ adSlot }: { adSlot: string }) => (
  <GoogleAdSense
    adSlot={adSlot}
    adFormat="auto"
    fullWidthResponsive={true}
    className="my-4"
  />
);
