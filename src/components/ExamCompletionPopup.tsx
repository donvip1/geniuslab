import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Star, Sparkles } from "lucide-react";
import holysinnerProfile from "@/assets/holysinner-profile.jpg";

interface ExamCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
}

const DISPLAY_SECONDS = 8;

export const ExamCompletionPopup = ({ 
  isOpen, 
  onClose, 
  score, 
  totalQuestions 
}: ExamCompletionPopupProps) => {
  const [countdown, setCountdown] = useState(DISPLAY_SECONDS);
  const percentage = Math.round((score / totalQuestions) * 100);

  useEffect(() => {
    if (isOpen) {
      setCountdown(DISPLAY_SECONDS);
      
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

  const getMessage = () => {
    if (percentage >= 70) {
      return {
        title: "Outstanding!",
        message: "You've done exceptionally well! Your hard work is paying off. Keep shining and aim even higher!",
        icon: <PartyPopper className="h-8 w-8 text-yellow-500" />,
      };
    } else if (percentage >= 50) {
      return {
        title: "Well Done!",
        message: "Great effort! You're making good progress. Keep pushing forward and you'll reach your goals!",
        icon: <Star className="h-8 w-8 text-primary" />,
      };
    } else {
      return {
        title: "Keep Going!",
        message: "Every attempt is a step toward success. Don't give up—practice makes perfect!",
        icon: <Sparkles className="h-8 w-8 text-blue-500" />,
      };
    }
  };

  const messageData = getMessage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center space-y-4 py-2">
          {/* Founder Section */}
          <div className="relative">
            <img
              src={holysinnerProfile}
              alt="Etim Nsisong Enefiok (Holysinner)"
              className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
            />
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              Founder
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-base">Etim Nsisong Enefiok</h3>
            <p className="text-xs text-muted-foreground">(Holysinner) - Founder & Lead Tutor</p>
          </div>

          {/* Score Section */}
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-3 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              {messageData.icon}
              <h2 className="text-xl font-bold text-primary">
                {messageData.title}
              </h2>
            </div>
            <p className="text-2xl font-bold text-primary">{percentage}%</p>
            <p className="text-sm text-muted-foreground">
              {score} out of {totalQuestions} correct
            </p>
          </div>
          
          {/* Founder Message */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed">
            <p className="italic text-muted-foreground">
              "{messageData.message}"
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground italic">
            "Success is the sum of small efforts, repeated day in and day out." – Robert Collier
          </p>
          
          <div className="flex items-center gap-3 pt-1">
            <Button onClick={onClose} size="sm">
              View Full Results
            </Button>
            <span className="text-sm text-muted-foreground">
              (<span className="font-bold text-primary">{countdown}s</span>)
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
