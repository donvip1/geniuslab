import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
}

interface AdvertisementPopupProps {
  intervalMs?: number; // Custom interval in milliseconds
  initialDelayMs?: number; // Custom initial delay in milliseconds
}

const DEFAULT_POPUP_INTERVAL = 90000; // 90 seconds (1:30)
const DEFAULT_INITIAL_DELAY = 10000; // 10 seconds

export const AdvertisementPopup = ({ 
  intervalMs = DEFAULT_POPUP_INTERVAL,
  initialDelayMs = DEFAULT_INITIAL_DELAY 
}: AdvertisementPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length === 0) return;

    // Show first ad after initial delay
    const initialTimeout = setTimeout(() => {
      showNextAd();
    }, initialDelayMs);

    // Then show ads at configured interval
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
              <p className="text-muted-foreground whitespace-pre-wrap">
                {currentAd.content}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};