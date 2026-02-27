import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, CreditCard, Loader2, MessageCircle, Copy, ArrowLeft, ShieldCheck, Clock, Zap } from "lucide-react";

interface PaymentInfo {
  contact: string;
  accountNumber: string;
  bankName: string;
  accountHolder: string;
  amount: number;
}

const Payment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("category");
  const categoryName = searchParams.get("name") || "Exam";

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    contact: "08124269495",
    accountNumber: "8124269495",
    bankName: "Opay",
    accountHolder: "Nsisong Etim",
    amount: 1000,
  });

  useEffect(() => {
    checkAuth();
    fetchPaymentInfo();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    setLoading(false);
  };

  const fetchPaymentInfo = async () => {
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
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 8 || !user || !categoryId) return;
    setPinLoading(true);
    try {
      const { data: pinData } = await supabase
        .from("access_pins")
        .select("*")
        .eq("pin_code", pin.toUpperCase())
        .maybeSingle();

      if (!pinData) {
        toast({ title: "Invalid PIN", description: "This PIN does not exist.", variant: "destructive" });
        return;
      }
      if (pinData.is_used && pinData.used_by !== user.id) {
        toast({ title: "PIN Already Used", description: "This PIN has been activated by another user.", variant: "destructive" });
        return;
      }
      if (pinData.is_used && pinData.used_by === user.id && pinData.expires_at && new Date(pinData.expires_at) > new Date()) {
        toast({ title: "Welcome Back!", description: "Your PIN is still active." });
        navigate("/exam");
        return;
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 35);

      await supabase
        .from("access_pins")
        .update({
          is_used: true,
          used_by: user.id,
          used_by_email: user.email,
          used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          exam_category_id: categoryId,
        })
        .eq("id", pinData.id)
        .eq("is_used", false);

      await supabase.from("subscription_plans").insert({
        user_id: user.id,
        exam_category_id: categoryId,
        plan_type: "pin",
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

      toast({ title: "PIN Activated!", description: "You now have exam access for 1 month + 5 days." });
      navigate("/exam");
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to activate PIN.", variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const handlePaystack = async () => {
    if (!categoryId) return;
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          exam_category_id: categoryId,
          callback_url: window.location.origin + "/exam",
        },
      });
      if (error) throw error;
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error: any) {
      toast({ title: "Payment Error", description: error.message || "Failed to initialize payment.", variant: "destructive" });
    } finally {
      setPaymentLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi, I want to purchase a ${categoryName} exam access PIN for GENIUSLAB.\n\nAmount: ₦${paymentInfo.amount.toLocaleString()}\nBank: ${paymentInfo.bankName}\nAccount: ${paymentInfo.accountNumber}\nName: ${paymentInfo.accountHolder}`
    );
    window.open(`https://wa.me/234${paymentInfo.contact.slice(1)}?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-16 md:pb-0">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Hero */}
        <section className="py-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Subscribe to {categoryName}</h1>
            <p className="opacity-90 text-lg">Get unlimited access to all questions and practice exams</p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: "Unlimited Questions", desc: "Access all practice questions" },
                { icon: Clock, title: "35 Days Access", desc: "1 month + 5 days grace period" },
                { icon: ShieldCheck, title: "Instant Activation", desc: "Start practicing immediately" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-3 bg-background rounded-lg p-4 border">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Options */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
              {/* PIN Entry */}
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Key className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Enter Access PIN</CardTitle>
                  <CardDescription>Already have an 8-character PIN? Enter it below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                    placeholder="XXXXXXXX"
                    className="text-center text-xl font-mono tracking-widest h-12"
                    maxLength={8}
                  />
                  <p className="text-xs text-center text-muted-foreground">{pin.length}/8 characters</p>
                  <Button onClick={handlePinSubmit} disabled={pin.length !== 8 || pinLoading} className="w-full">
                    {pinLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Activate PIN
                  </Button>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-green-800 dark:text-green-300">Pay ₦{paymentInfo.amount.toLocaleString()}</CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-400">1 month + 5 days access</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handlePaystack} disabled={paymentLoading || !categoryId} className="w-full bg-green-600 hover:bg-green-700">
                    {paymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                    Pay with Paystack
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-green-50 dark:bg-green-950/20 px-2 text-muted-foreground">or</span></div>
                  </div>

                  <div className="bg-white dark:bg-background rounded-lg p-3 space-y-2 border text-sm">
                    <p className="font-medium">Bank Transfer:</p>
                    <div className="flex justify-between items-center">
                      <span>Bank: <strong>{paymentInfo.bankName}</strong></span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">{paymentInfo.accountNumber}</span>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(paymentInfo.accountNumber, "Account number")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-xs text-muted-foreground">{paymentInfo.accountHolder}</span>
                  </div>

                  <Button onClick={handleWhatsApp} variant="outline" className="w-full border-green-300 text-green-700 hover:bg-green-100">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Send Proof via WhatsApp
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={() => navigate("/exam")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Exam Categories
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
