import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Key,
  CreditCard,
  Loader2,
  MessageCircle,
  Copy,
  ArrowLeft,
  ShieldCheck,
  Clock,
  Zap,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Award,
  FileText,
  Wrench,
  CheckCircle,
} from "lucide-react";

interface PaymentInfo {
  contact: string;
  accountNumber: string;
  bankName: string;
  accountHolder: string;
  amount: number;
  manualPaymentEnabled: boolean;
}

interface ExamCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  monthly_price: number;
}

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  BookOpen: <BookOpen className="h-6 w-6" />,
  Award: <Award className="h-6 w-6" />,
  FileText: <FileText className="h-6 w-6" />,
  Wrench: <Wrench className="h-6 w-6" />,
};

const Payment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryIdParam = searchParams.get("category");
  const categoryNameParam = searchParams.get("name");

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ExamCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | null>(null);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successCategoryName, setSuccessCategoryName] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    contact: "08124269495",
    accountNumber: "",
    bankName: "",
    accountHolder: "",
    amount: 2500,
    manualPaymentEnabled: false,
  });

  useEffect(() => {
    checkAuth();
    fetchPaymentInfo();
    fetchCategories();
  }, []);

  // Detect Paystack callback
  useEffect(() => {
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference && user) {
      verifyPaystackCallback(reference);
    }
  }, [searchParams, user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("exam_categories").select("*").eq("is_active", true).order("display_order");
    if (data) {
      setCategories(data as ExamCategory[]);
      if (categoryIdParam) {
        const found = data.find((c: any) => c.id === categoryIdParam);
        if (found) setSelectedCategory(found as ExamCategory);
      }
    }
  };

  const fetchPaymentInfo = async () => {
    const { data } = await supabase
      .from("exam_settings")
      .select("payment_contact, payment_account_number, payment_bank_name, payment_account_holder, payment_amount, manual_payment_enabled")
      .limit(1)
      .maybeSingle();
    if (data) {
      setPaymentInfo({
        contact: data.payment_contact || "08124269495",
        accountNumber: data.payment_account_number || "",
        bankName: data.payment_bank_name || "",
        accountHolder: data.payment_account_holder || "",
        amount: data.payment_amount || 2500,
        manualPaymentEnabled: (data as any).manual_payment_enabled ?? false,
      });
    }
  };

  const verifyPaystackCallback = async (reference: string) => {
    setVerifyingPayment(true);
    try {
      // Directly verify with Paystack API via edge function and grant access
      const { data, error } = await supabase.functions.invoke("verify-paystack-payment", {
        body: { reference },
      });

      if (error) {
        console.error("Verification function error:", error);
        toast({
          title: "Verification Issue",
          description: "We couldn't verify your payment right now. Please contact support.",
          variant: "destructive",
        });
        return;
      }

      if (data?.success) {
        setSuccessCategoryName(data.category_name || categoryNameParam || "your selected exam");
        setShowSuccessPopup(true);
      } else {
        // Payment not yet confirmed — maybe still processing
        toast({
          title: "Payment Processing",
          description: data?.message || "Your payment is being processed. Please wait a moment and refresh.",
        });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast({
        title: "Verification Issue",
        description: "We couldn't verify your payment right now. If you paid, access will be granted automatically.",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 8 || !user || !selectedCategory) return;
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
      expiresAt.setDate(expiresAt.getDate() + 90); // 3 months = 90 days

      await supabase
        .from("access_pins")
        .update({
          is_used: true,
          used_by: user.id,
          used_by_email: user.email,
          used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          exam_category_id: selectedCategory.id,
        })
        .eq("id", pinData.id)
        .eq("is_used", false);

      await supabase.from("subscription_plans").insert({
        user_id: user.id,
        exam_category_id: selectedCategory.id,
        plan_type: "pin",
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

      toast({ title: "PIN Activated!", description: "You now have exam access for 3 months." });
      navigate("/exam");
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to activate PIN.", variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const handlePaystack = async () => {
    if (!selectedCategory) return;
    if (!user) {
      toast({ title: "Login Required", description: "Please login first to make a payment.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          exam_category_id: selectedCategory.id,
          callback_url: `${window.location.origin}/payment?category=${selectedCategory.id}&name=${encodeURIComponent(selectedCategory.name)}`,
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
    const catName = selectedCategory?.name || "Exam";
    const message = encodeURIComponent(
      `I just made payment via manual method for ${catName}.\nVerify and send me activation pin.`,
    );
    window.open(`https://wa.me/234${paymentInfo.contact.slice(1)}?text=${message}`, "_blank");
  };

  if (loading || verifyingPayment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {verifyingPayment && <p className="text-muted-foreground">Verifying your payment...</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 lg:pb-0">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Payment Success Popup */}
        <Dialog open={showSuccessPopup} onOpenChange={setShowSuccessPopup}>
          <DialogContent className="sm:max-w-md text-center">
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
              <p className="text-muted-foreground">
                You now have unlimited access to <strong>{successCategoryName || categoryNameParam || "your exam category"}</strong> for 3 months.
              </p>
              <Button onClick={() => navigate("/exam")} className="w-full" size="lg">
                <Zap className="mr-2 h-4 w-4" />
                Start Practicing
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Hero */}
        <section className="py-12 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              {selectedCategory ? `Activate ${selectedCategory.name}` : "Pricing & Activation"}
            </h1>
            <p className="opacity-90 text-lg">
              {selectedCategory
                ? "Get unlimited access to all questions and practice exams"
                : "Choose an exam category and unlock unlimited practice"}
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-background rounded-lg p-5 border shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Activate GeniusLab CBT for unlimited access</h3>
                    <p className="text-sm text-muted-foreground">₦2,500/3 months</p>
                  </div>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Unlock all Subjects",
                    "Unlock all Years",
                    "Unlock all Past Questions",
                    "Unlimited Practice Exams",
                    "Access Detailed Explanations",
                    "Track Your Performance",
                    "No ads or interruptions",
                    "Activation lasts for 3 months",
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Category Selection or Payment */}
        {!selectedCategory ? (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-center mb-2">Choose an Exam Category</h2>
                <p className="text-center text-muted-foreground mb-8">Select the exam type you want to activate</p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((cat) => (
                    <Card
                      key={cat.id}
                      className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group"
                      onClick={() => setSelectedCategory(cat)}
                    >
                      <CardHeader className="pb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          {iconMap[cat.icon_name || ""] || <BookOpen className="h-6 w-6" />}
                        </div>
                        <CardTitle className="text-lg">{cat.name}</CardTitle>
                        <CardDescription className="text-sm">{cat.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            ₦{cat.monthly_price.toLocaleString()}
                            <span className="text-sm font-normal text-muted-foreground">/month</span>
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Back button */}
                <Button variant="ghost" className="mb-6" onClick={() => setSelectedCategory(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Categories
                </Button>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* PIN Entry + Manual Payment */}
                  <Card>
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Key className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Enter Access PIN</CardTitle>
                      <CardDescription>Already have an 8-character PIN? Enter it below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!user && (
                        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
                          You need to{" "}
                          <a href="/auth" className="underline font-medium">login</a>{" "}
                          first to activate a PIN.
                        </p>
                      )}
                      <Input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                        placeholder="XXXXXXXX"
                        className="text-center text-xl font-mono tracking-widest h-12"
                        maxLength={8}
                        disabled={!user}
                      />
                      <p className="text-xs text-center text-muted-foreground">{pin.length}/8 characters</p>
                      <Button onClick={handlePinSubmit} disabled={pin.length !== 8 || pinLoading || !user} className="w-full">
                        {pinLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Activate PIN
                      </Button>

                      {/* Manual Payment Section - under PIN */}
                      <div className="relative pt-2">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">or pay manually for PIN</span>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 space-y-2 border text-sm">
                        <p className="font-medium">Bank Transfer:</p>
                        <div className="flex justify-between items-center">
                          <span>Bank: <strong>Opay</strong></span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold">8124269495</span>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard("8124269495", "Account number")}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground">Nsisong Etim</span>
                      </div>

                      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
                        <strong>Instructions:</strong> Pay to the account above, then send proof of payment via WhatsApp to receive your PIN.
                      </div>

                      <Button onClick={handleWhatsApp} variant="outline" className="w-full">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Contact on WhatsApp
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Paystack Payment */}
                  <Card className="border-primary/20">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>Pay ₦{selectedCategory.monthly_price.toLocaleString()}</CardTitle>
                      <CardDescription>3 months access to {selectedCategory.name} — instant activation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2 border">
                        <p className="font-medium">What you get:</p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                          <li>Unlimited practice questions</li>
                          <li>Download study materials</li>
                          <li>90 days of full access</li>
                          <li>Instant activation after payment</li>
                        </ul>
                      </div>
                      <Button onClick={handlePaystack} disabled={paymentLoading} className="w-full" size="lg">
                        {paymentLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="mr-2 h-4 w-4" />
                        )}
                        Pay with Paystack
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Secure payment powered by Paystack
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Payment;
