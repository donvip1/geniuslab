import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  status: "pending" | "active" | "completed" | "error";
}

interface ProgressStepsProps {
  steps: Step[];
  className?: string;
}

export const ProgressSteps = ({ steps, className }: ProgressStepsProps) => {
  const completedSteps = steps.filter(s => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className={cn("space-y-4", className)}>
      <Progress value={progress} className="h-2" />

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg transition-all",
              step.status === "active" && "bg-primary/10 border border-primary/20",
              step.status === "completed" && "bg-green-50 dark:bg-green-950/20",
              step.status === "error" && "bg-red-50 dark:bg-red-950/20",
              step.status === "pending" && "bg-muted/30"
            )}
          >
            {step.status === "completed" && (
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            )}
            {step.status === "active" && (
              <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />
            )}
            {step.status === "pending" && (
              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            )}
            {step.status === "error" && (
              <div className="h-5 w-5 rounded-full bg-red-500 shrink-0" />
            )}

            <span className={cn(
              "text-sm font-medium",
              step.status === "completed" && "text-green-700 dark:text-green-300",
              step.status === "active" && "text-primary",
              step.status === "error" && "text-red-700 dark:text-red-300",
              step.status === "pending" && "text-muted-foreground"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
