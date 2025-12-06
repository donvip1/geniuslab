import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Star, Sparkles } from "lucide-react";

interface ExamCompletionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  totalQuestions: number;
}

const DISPLAY_SECONDS = 5;

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
        title: "Outstanding! 🎉",
        message: "You've done exceptionally well! Your hard work is paying off. Keep shining!",
        icon: <PartyPopper className="h-16 w-16 text-yellow-500" />,
      };
    } else if (percentage >= 50) {
      return {
        title: "Well Done! 👏",
        message: "Great effort! You're making good progress. Keep pushing forward!",
        icon: <Star className="h-16 w-16 text-primary" />,
      };
    } else {
      return {
        title: "Keep Going! 💪",
        message: "Every attempt is a step toward success. Don't give up—practice makes perfect!",
        icon: <Sparkles className="h-16 w-16 text-blue-500" />,
      };
    }
  };

  const messageData = getMessage();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="animate-bounce">
            {messageData.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-primary">
            {messageData.title}
          </h2>
          
          <p className="text-muted-foreground leading-relaxed">
            {messageData.message}
          </p>
          
          <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 w-full">
            <p className="text-sm text-muted-foreground mb-1">Your Score</p>
            <p className="text-3xl font-bold text-primary">{percentage}%</p>
            <p className="text-sm text-muted-foreground mt-1">
              {score} out of {totalQuestions} correct
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground italic">
            "Success is the sum of small efforts, repeated day in and day out." – Robert Collier
          </p>
          
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onClose} size="sm">
              View Full Results
            </Button>
            <span className="text-sm text-muted-foreground">
              ({countdown}s)
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
