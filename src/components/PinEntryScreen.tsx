import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Key, Loader2, ArrowLeft, CheckCircle, MessageCircle, CreditCard, Copy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface PinEntryScreenProps {
  onSuccess: () => void;
  userEmail: string;
}

interface PaymentInfo {
  contact: string;
  accountNumber: string;
  bankName: string;
  accountHolder: string;
  amount: number;
}

export const PinEntryScreen = ({ onSuccess, userEmail }: PinEntryScreenProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    contact: "08124269495",
    accountNumber: "8124269495",
    bankName: "Opay",
    accountHolder: "Nsisong Etim",
    amount: 1000,
  });

  useEffect(() => {
    fetchPaymentInfo();
  }, []);

  const fetchPaymentInfo = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("payment_contact, payment_account_number, payment_bank_name, payment_account_holder, payment_amount")
        .limit(1)
        .maybeSingle();

      if (data) {
        setPaymentInfo({
          contact: data.payment_contact || "08124269495",
          accountNumber: data.payment_account_number || "8124269495",
          bankName: data.payment_bank_name || "Opay",
          accountHolder: data.payment_account_holder || "Nsisong Etim",
          amount: data.payment_amount || 1000,
        });
      }
    } catch (error) {
      console.error("Error fetching payment info:", error);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        // Check if this PIN belongs to the current user and is still valid
        if (
          pinData.used_by === session.user.id &&
          pinData.expires_at &&
          new Date(pinData.expires_at) > new Date()
        ) {
          // User's own active PIN — grant access
          setSuccess(true);
          toast({
            title: "Welcome Back!",
            description: "Your PIN is still active. Redirecting to exams...",
          });
          setTimeout(() => {
            onSuccess();
          }, 1500);
          setLoading(false);
          return;
        }

        toast({
          title: "PIN Already Used",
          description: "This PIN has already been activated by another user.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 1 month

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
        .eq("is_used", false);

      if (updateError) throw updateError;

      setSuccess(true);
      toast({
        title: "PIN Activated!",
        description: "You now have exam access for 1 month.",
      });

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

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent(
      `Hi, I want to purchase an exam access PIN for GENIUSLAB.\n\nPayment Details:\nAmount: ₦${paymentInfo.amount.toLocaleString()}\nBank: ${paymentInfo.bankName}\nAccount: ${paymentInfo.accountNumber}\nName: ${paymentInfo.accountHolder}\n\nI will make payment and send proof.`
    );
    window.open(`https://wa.me/234${paymentInfo.contact.slice(1)}?text=${message}`, "_blank");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
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
      <main className="flex-1 pt-16 pb-8 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PIN Entry Card */}
            <Card>
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

            {/* Payment Info Card */}
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                  <CreditCard className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl text-green-800">Need to Purchase a PIN?</CardTitle>
                <CardDescription className="text-green-700">
                  Get your exam access PIN by making a payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount */}
                <div className="bg-white rounded-lg p-4 text-center border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                  <p className="text-3xl font-bold text-green-600">₦{paymentInfo.amount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">per PIN (1 month access)</p>
                </div>

                {/* Payment Details */}
                <div className="bg-white rounded-lg p-4 space-y-3 border border-green-200">
                  <p className="font-medium text-sm text-gray-700">Payment Details:</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium">{paymentInfo.bankName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Number</p>
                      <p className="font-mono font-bold text-lg">{paymentInfo.accountNumber}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(paymentInfo.accountNumber, "Account number")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Account Name</p>
                      <p className="font-medium">{paymentInfo.accountHolder}</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                  <p className="text-amber-800">
                    <strong>Instructions:</strong> Pay to the account above, then send proof of payment via WhatsApp or via SMS to receive your PIN instantly to the provided Phone no.
                  </p>
                </div>

                {/* WhatsApp Button */}
                <Button 
                  onClick={handleWhatsAppClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact on WhatsApp
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Contact: {paymentInfo.contact}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
