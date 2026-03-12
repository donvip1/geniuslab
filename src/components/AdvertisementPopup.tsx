import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import { trackAdClick } from "@/hooks/usePageTracking";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface Advertisement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
}

interface AdvertisementPopupProps {
  intervalMs?: number;
  initialDelayMs?: number;
}

const DEFAULT_POPUP_INTERVAL = 90000;
const DEFAULT_INITIAL_DELAY = 10000;

export const AdvertisementPopup = ({ 
  intervalMs = DEFAULT_POPUP_INTERVAL,
  initialDelayMs = DEFAULT_INITIAL_DELAY 
}: AdvertisementPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [adIndex, setAdIndex] = useState(0);
  const { isSubscribed, loading: subLoading } = useSubscriptionStatus();

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0 || isSubscribed || subLoading) return;

    const initialTimeout = setTimeout(() => {
      showNextAd();
    }, initialDelayMs);

    const interval = setInterval(() => {
      showNextAd();
    }, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [ads, adIndex, intervalMs, initialDelayMs]);

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .eq("is_active", true);

    if (!error && data && data.length > 0) {
      setAds(data);
    }
  };

  const showNextAd = () => {
    if (ads.length === 0) return;
    
    setCurrentAd(ads[adIndex % ads.length]);
    setIsOpen(true);
    setAdIndex((prev) => prev + 1);
  };

  const handleVisitLink = async () => {
    if (currentAd?.link_url) {
      await trackAdClick(currentAd.id);
      window.open(currentAd.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!currentAd) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogTitle className="sr-only">{currentAd.title}</DialogTitle>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {currentAd.image_url && (
            <img
              src={currentAd.image_url}
              alt={currentAd.title}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-6">
            <h3 className="text-xl font-bold mb-2">{currentAd.title}</h3>
            {currentAd.content && (
              <p className="text-muted-foreground whitespace-pre-wrap mb-4">
                {currentAd.content}
              </p>
            )}
            {currentAd.link_url && (
              <Button 
                onClick={handleVisitLink}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Link
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};