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

      // Check admin role directly in the database.
      // The DB-level RLS policies (has_role check) are the real security boundary;
      // this UI gate just prevents non-admins from seeing the admin page.
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

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

      if (!roleData) {
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
        user_id: session.user.id,
        email: session.user.email ?? "unknown",
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
