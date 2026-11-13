import { CheckCircle2, Sparkles, Trophy, PartyPopper } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SuccessFeedbackProps {
  title: string;
  message: string;
  onContinue?: () => void;
  continueLabel?: string;
  type?: "default" | "achievement" | "celebration";
  className?: string;
}

export const SuccessFeedback = ({
  title,
  message,
  onContinue,
  continueLabel = "Continue",
  type = "default",
  className
}: SuccessFeedbackProps) => {
  const icons = {
    default: <CheckCircle2 className="h-16 w-16 text-green-500" />,
    achievement: <Trophy className="h-16 w-16 text-amber-500" />,
    celebration: <PartyPopper className="h-16 w-16 text-purple-500" />
  };

  return (
    <Card className={cn("border-green-200 bg-green-50 dark:bg-green-950/20", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center py-8 px-4">
        <div className="mb-4 relative">
          {icons[type]}
          {type !== "default" && (
            <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
          )}
        </div>

        <h3 className="text-xl font-bold mb-2 text-green-700 dark:text-green-300">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {message}
        </p>

        {onContinue && (
          <Button onClick={onContinue} className="w-full max-w-xs">
            {continueLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
