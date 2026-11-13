import { useToast as useToastOriginal } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

/**
 * Enhanced toast notifications with better UX
 */
export const useEnhancedToast = () => {
  const { toast } = useToastOriginal();

  return {
    success: (title: string, description?: string) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span>{title}</span>
          </div>
        ) as any,
        description,
        className: "border-green-200 bg-green-50 dark:bg-green-950/20",
      });
    },

    error: (title: string, description?: string) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>{title}</span>
          </div>
        ) as any,
        description,
        variant: "destructive",
      });
    },

    warning: (title: string, description?: string) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span>{title}</span>
          </div>
        ) as any,
        description,
        className: "border-amber-200 bg-amber-50 dark:bg-amber-950/20",
      });
    },

    info: (title: string, description?: string) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>{title}</span>
          </div>
        ) as any,
        description,
        className: "border-blue-200 bg-blue-50 dark:bg-blue-950/20",
      });
    },

    loading: (title: string, description?: string) => {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span>{title}</span>
          </div>
        ) as any,
        description,
        duration: 30000, // Longer duration for loading states
      });
    },

    promise: async <T,>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string;
        success: string | ((data: T) => string);
        error: string | ((error: any) => string);
      }
    ): Promise<T> => {
      const { dismiss } = toast({
        title: (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span>{loading}</span>
          </div>
        ) as any,
        duration: 30000,
      });

      try {
        const data = await promise;
        dismiss();

        const successMsg = typeof success === "function" ? success(data) : success;
        toast({
          title: (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>{successMsg}</span>
            </div>
          ) as any,
          className: "border-green-200 bg-green-50 dark:bg-green-950/20",
        });

        return data;
      } catch (err) {
        dismiss();

        const errorMsg = typeof error === "function" ? error(err) : error;
        toast({
          title: (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          ) as any,
          variant: "destructive",
        });

        throw err;
      }
    },
  };
};
