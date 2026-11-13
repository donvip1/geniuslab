import { AlertTriangle, RefreshCw, XCircle, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  type?: "error" | "warning" | "offline";
  className?: string;
  showIcon?: boolean;
}

export const ErrorState = ({
  title,
  message,
  onRetry,
  type = "error",
  className,
  showIcon = true
}: ErrorStateProps) => {
  const icons = {
    error: <XCircle className="h-12 w-12 text-red-500" />,
    warning: <AlertTriangle className="h-12 w-12 text-amber-500" />,
    offline: <WifiOff className="h-12 w-12 text-gray-500" />
  };

  const titles = {
    error: "Something went wrong",
    warning: "Warning",
    offline: "No internet connection"
  };

  const colors = {
    error: "border-red-200 bg-red-50 dark:bg-red-950/20",
    warning: "border-amber-200 bg-amber-50 dark:bg-amber-950/20",
    offline: "border-gray-200 bg-gray-50 dark:bg-gray-950/20"
  };

  return (
    <Card className={cn(colors[type], className)}>
      <CardContent className="flex flex-col items-center justify-center text-center py-8 px-4">
        {showIcon && (
          <div className="mb-4">
            {icons[type]}
          </div>
        )}

        <h3 className="text-lg font-semibold mb-2">
          {title || titles[type]}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {message}
        </p>

        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}

        {type === "offline" && (
          <p className="text-xs text-muted-foreground mt-4">
            Please check your internet connection and try again
          </p>
        )}
      </CardContent>
    </Card>
  );
};
