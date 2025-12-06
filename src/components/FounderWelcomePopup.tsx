import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import holysinnerProfile from "@/assets/holysinner-profile.jpg";

interface FounderWelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 8;

export const FounderWelcomePopup = ({ isOpen, onClose }: FounderWelcomePopupProps) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (isOpen) {
      setCountdown(COUNTDOWN_SECONDS);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold text-primary">
              Welcome, Student!
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 -mr-2 -mt-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img
              src={holysinnerProfile}
              alt="Etim Nsisong Enefiok (Holysinner)"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Founder
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Etim Nsisong Enefiok</h3>
            <p className="text-sm text-muted-foreground">(Holysinner)</p>
            <p className="text-sm font-medium text-primary">Founder & Lead Tutor</p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed">
            <p className="italic">
              "Welcome to GeniusLab CBT Practice! Remember, success is not just about passing exams—it's about understanding and growing. 
              Take your time, stay focused, and believe in yourself. Every question you answer brings you closer to your goals. 
              Good luck! 🌟"
            </p>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onClose} variant="outline" size="sm">
              Start Exam Now
            </Button>
            <span className="text-sm text-muted-foreground">
              Auto-closing in <span className="font-bold text-primary">{countdown}s</span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
