import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminAccessResult {
  isAdmin: boolean;
  isLoading: boolean;
  user: any;
}

export const useAdminAccess = (): AdminAccessResult => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    verifyAdminAccess();
  }, []);

  const verifyAdminAccess = async () => {
    try {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        toast({
          title: "Authentication Required",
          description: "Please login to continue",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Call the secure admin verification edge function
      const { data, error } = await supabase.functions.invoke("verify-admin-access", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Admin verification error:", error);
        toast({
          title: "Access Denied",
          description: "Unable to verify admin access",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      if (!data?.access) {
        // Log the reason for debugging
        console.warn("Admin access denied:", data?.reason);

        let message = "You don't have admin privileges";
        if (data?.reason === "ip_not_whitelisted") {
          message = "Access restricted: Your IP address is not authorized for admin access";
        } else if (data?.reason === "no_admin_role") {
          message = "You don't have admin privileges";
        }

        toast({
          title: "Access Denied",
          description: message,
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      // Access granted
      setIsAdmin(true);
    } catch (error) {
      console.error("Error verifying admin access:", error);
      toast({
        title: "Error",
        description: "An error occurred while verifying access",
        variant: "destructive",
      });
      navigate("/exam");
    } finally {
      setIsLoading(false);
    }
  };

  return { isAdmin, isLoading, user };
};
