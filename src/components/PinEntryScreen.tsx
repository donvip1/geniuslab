import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface PinEntryScreenProps {
  onSuccess: () => void;
  userEmail: string;
}

export const PinEntryScreen = ({ onSuccess, userEmail }: PinEntryScreenProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow alphanumeric characters, max 8
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    setPin(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 8) {
      toast({
        title: "Invalid PIN",
        description: "Please enter a complete 8-character PIN",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if PIN exists and is unused
      const { data: pinData, error: fetchError } = await supabase
        .from("access_pins")
        .select("*")
        .eq("pin_code", pin)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!pinData) {
        toast({
          title: "Invalid PIN",
          description: "This PIN does not exist. Please check and try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (pinData.is_used) {
        toast({
          title: "PIN Already Used",
          description: "This PIN has already been activated by another user.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Activate the PIN
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error: updateError } = await supabase
        .from("access_pins")
        .update({
          is_used: true,
          used_by: session.user.id,
          used_by_email: userEmail,
          used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", pinData.id)
        .eq("is_used", false); // Extra safety check

      if (updateError) throw updateError;

      setSuccess(true);
      toast({
        title: "PIN Activated!",
        description: "You now have exam access for 1 month.",
      });

      // Wait a moment before continuing
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.error("Error activating PIN:", error);
      toast({
        title: "Error",
        description: "Failed to activate PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center pt-16 bg-gradient-to-br from-primary/5 to-secondary/5">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">PIN Activated!</h2>
              <p className="text-muted-foreground mb-4">
                Your exam access is now active for 1 month.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting to exams...
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center pt-16 bg-gradient-to-br from-primary/5 to-secondary/5">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Enter Access PIN</CardTitle>
            <CardDescription>
              Enter your 8-character access PIN to take exams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="XXXXXXXX"
                  className="text-center text-2xl font-mono tracking-widest h-14"
                  maxLength={8}
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-center text-muted-foreground">
                  {pin.length}/8 characters
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                <p className="font-medium">About Access PINs:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Valid for 1 month after first use</li>
                  <li>Can only be used by one person</li>
                  <li>Take unlimited exams during the validity period</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg"
                  disabled={loading || pin.length !== 8}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Activate PIN"
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};
