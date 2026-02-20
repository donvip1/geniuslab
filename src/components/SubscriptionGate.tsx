import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Key, CreditCard, Clock, Loader2, CheckCircle, Gift, MessageCircle, Copy, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGateProps {
  examCategoryId: string;
  examCategoryName: string;
  userId: string;
  userEmail: string;
  children: React.ReactNode;
}

interface TrialInfo {
  daysRemaining: number;
  questionsUsedToday: number;
  isTrialActive: boolean;
}

export const SubscriptionGate = ({
  examCategoryId,
  examCategoryName,
  userId,
  userEmail,
  children,
}: SubscriptionGateProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [pin, setPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    contact: "08124269495",
    accountNumber: "8124269495",
    bankName: "Opay",
    accountHolder: "Nsisong Etim",
    amount: 1000,
  });

  useEffect(() => {
    checkAccess();
    fetchPaymentInfo();
  }, [examCategoryId, userId]);

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

  const checkAccess = async () => {
    setLoading(true);
    try {
      // 1. Check active subscription
      const now = new Date().toISOString();
      const { data: subscription } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("user_id", userId)
        .eq("exam_category_id", examCategoryId)
        .eq("status", "active")
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      if (subscription) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 2. Check active PIN for this category
      const { data: activePin } = await supabase
        .from("access_pins")
        .select("id")
        .eq("used_by", userId)
        .eq("is_used", true)
        .eq("exam_category_id", examCategoryId)
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      if (activePin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 3. Also check legacy pins (no category) for backward compatibility
      const { data: legacyPin } = await supabase
        .from("access_pins")
        .select("id")
        .eq("used_by", userId)
        .eq("is_used", true)
        .is("exam_category_id", null)
        .gt("expires_at", now)
        .limit(1)
        .maybeSingle();

      if (legacyPin) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // 4. Check trial status
      const { data: trial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .eq("exam_category_id", examCategoryId)
        .maybeSingle();

      if (!trial) {
        // First time — create trial
        const { error: insertError } = await supabase.from("user_trials").insert({
          user_id: userId,
          exam_category_id: examCategoryId,
          trial_start_date: new Date().toISOString().split("T")[0],
          questions_used_today: 0,
        });
        if (insertError) {
          console.error("Trial insert error:", insertError);
        }
        // Auto-grant access for new trials
        setTrialInfo({ daysRemaining: 5, questionsUsedToday: 0, isTrialActive: true });
        setHasAccess(true);
        setLoading(false);
        return;
      } else {
        const startDate = new Date(trial.trial_start_date);
        const today = new Date();
        const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 5 - daysPassed);
        const todayStr = today.toISOString().split("T")[0];
        const questionsUsedToday = trial.last_question_date === todayStr ? trial.questions_used_today : 0;
        const isTrialActive = daysRemaining > 0 && questionsUsedToday < 5;

        setTrialInfo({
          daysRemaining,
          questionsUsedToday,
          isTrialActive,
        });

        // Auto-grant access if trial is still active
        if (isTrialActive) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 8) return;
    setPinLoading(true);
    try {
      const { data: pinData } = await supabase
        .from("access_pins")
        .select("*")
        .eq("pin_code", pin.toUpperCase())
        .maybeSingle();

      if (!pinData) {
        toast({ title: "Invalid PIN", description: "This PIN does not exist.", variant: "destructive" });
        setPinLoading(false);
        return;
      }

      if (pinData.is_used && pinData.used_by !== userId) {
        toast({ title: "PIN Already Used", description: "This PIN has been activated by another user.", variant: "destructive" });
        setPinLoading(false);
        return;
      }

      if (pinData.is_used && pinData.used_by === userId && pinData.expires_at && new Date(pinData.expires_at) > new Date()) {
        setHasAccess(true);
        toast({ title: "Welcome Back!", description: "Your PIN is still active." });
        setPinLoading(false);
        return;
      }

      // Activate PIN — 35 days (1 month + 5 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 35);

      await supabase
        .from("access_pins")
        .update({
          is_used: true,
          used_by: userId,
          used_by_email: userEmail,
          used_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          exam_category_id: examCategoryId,
        })
        .eq("id", pinData.id)
        .eq("is_used", false);

      // Also create a subscription record
      await supabase.from("subscription_plans").insert({
        user_id: userId,
        exam_category_id: examCategoryId,
        plan_type: "pin",
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

      setHasAccess(true);
      toast({ title: "PIN Activated!", description: "You now have exam access for 1 month + 5 days." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to activate PIN.", variant: "destructive" });
    } finally {
      setPinLoading(false);
    }
  };

  const handlePaystack = async () => {
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-initialize", {
        body: {
          exam_category_id: examCategoryId,
          callback_url: window.location.href,
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
      `Hi, I want to purchase a ${examCategoryName} exam access PIN for GENIUSLAB.\n\nAmount: ₦${paymentInfo.amount.toLocaleString()}\nBank: ${paymentInfo.bankName}\nAccount: ${paymentInfo.accountNumber}\nName: ${paymentInfo.accountHolder}`
    );
    window.open(`https://wa.me/234${paymentInfo.contact.slice(1)}?text=${message}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Trial or subscription needed
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Access {examCategoryName}</h2>
        <p className="text-muted-foreground">Choose how you'd like to access exams</p>
      </div>

      {/* Trial Banner */}
      {trialInfo && trialInfo.isTrialActive && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Free Trial Active</p>
                <p className="text-sm text-muted-foreground">
                  {trialInfo.daysRemaining} day(s) left · {5 - trialInfo.questionsUsedToday} questions remaining today
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => setHasAccess(true)}>
              Continue Trial
            </Button>
          </CardContent>
        </Card>
      )}

      {trialInfo && !trialInfo.isTrialActive && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardContent className="py-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Trial Expired</p>
              <p className="text-sm text-muted-foreground">
                Your 5-day free trial has ended. Subscribe or enter a PIN to continue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
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
              {pinLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Activate PIN
            </Button>
          </CardContent>
        </Card>

        {/* Payment Options */}
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-800 dark:text-green-300">Subscribe — ₦{paymentInfo.amount.toLocaleString()}/month</CardTitle>
            <CardDescription className="text-green-700 dark:text-green-400">Get 1 month + 5 days access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Paystack Button */}
            <Button onClick={handlePaystack} disabled={paymentLoading} className="w-full bg-green-600 hover:bg-green-700">
              {paymentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay with Paystack
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-green-50 dark:bg-green-950/20 px-2 text-muted-foreground">or</span></div>
            </div>

            {/* Manual payment info */}
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

      <div className="mt-6 text-center">
        <Button variant="ghost" onClick={() => navigate("/exam")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exam Categories
        </Button>
      </div>
    </div>
  );
};
