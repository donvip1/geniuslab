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
      const { data: { user: authenticatedUser }, error: userError } = await supabase.auth.getUser();

      if (userError || !authenticatedUser) {
        toast({
          title: "Authentication Required",
          description: "Please login to continue",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setUser(authenticatedUser);

      // Use the database role-check function so access remains reliable when
      // direct role-table reads are restricted by row-level security.
      const { data: hasAdminRole, error: roleError } = await supabase.rpc("has_role", {
        _user_id: authenticatedUser.id,
        _role: "admin",
      });

      if (roleError) {
        console.error("Admin role check error:", roleError);
        toast({
          title: "Access Denied",
          description: "Could not verify admin privileges. Please try again.",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      // Log the access in the background — never block on it.
      supabase.from("admin_access_logs").insert([{
        user_id: authenticatedUser.id,
        email: authenticatedUser.email ?? "unknown",
        ip_address: "client",
        user_agent: navigator.userAgent,
        access_granted: true,
        reason: "Access granted",
        timestamp: new Date().toISOString(),
      }]).then(() => {}).catch(() => {});

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
