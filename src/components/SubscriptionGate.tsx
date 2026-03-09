import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Clock, CreditCard, ArrowLeft } from "lucide-react";
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
  maxQuestions: number;
}

interface TrialConfig {
  trialsEnabled: boolean;
  trialDurationDays: number;
  trialMaxQuestions: number;
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
  const [trialConfig, setTrialConfig] = useState<TrialConfig>({
    trialsEnabled: true,
    trialDurationDays: 5,
    trialMaxQuestions: 5,
  });

  // VIP emails that get free access to all exams
  const VIP_EMAILS = [
    "robinsonwealth1@gmail.com",
    "chekwubedorcas9@gmail.com",
  ];

  const isVip = VIP_EMAILS.includes(userEmail.toLowerCase().trim());

  useEffect(() => {
    if (isVip) {
      setHasAccess(true);
      setLoading(false);
      return;
    }
    checkAccessMode();
  }, [examCategoryId, userId, userEmail]);

  const checkAccessMode = async () => {
    setLoading(true);
    try {

      // Check if this category is in free mode
      const { data: category } = await supabase
        .from("exam_categories")
        .select("access_mode")
        .eq("id", examCategoryId)
        .maybeSingle();

      if (category && (category as any).access_mode === "free") {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Fetch trial config from exam_settings
      const { data: settings } = await supabase
        .from("exam_settings")
        .select("trials_enabled, trial_duration_days, trial_max_questions")
        .limit(1)
        .maybeSingle();

      if (settings) {
        setTrialConfig({
          trialsEnabled: (settings as any).trials_enabled ?? true,
          trialDurationDays: (settings as any).trial_duration_days ?? 5,
          trialMaxQuestions: (settings as any).trial_max_questions ?? 5,
        });
      }

      await checkAccess(settings);
    } catch (error) {
      console.error("Error checking access mode:", error);
      setLoading(false);
    }
  };

  const checkAccess = async (settings?: any) => {
    try {
      const now = new Date().toISOString();
      
      // 1. Check active subscription
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

      // 3. Check legacy pins
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

      // 4. Trial logic — only if trials are enabled
      const trialsEnabled = settings ? (settings.trials_enabled ?? true) : trialConfig.trialsEnabled;
      const trialDuration = settings ? (settings.trial_duration_days ?? 5) : trialConfig.trialDurationDays;
      const trialMaxQ = settings ? (settings.trial_max_questions ?? 5) : trialConfig.trialMaxQuestions;

      if (!trialsEnabled) {
        // No trials — go straight to payment
        setLoading(false);
        return;
      }

      const { data: trial } = await supabase
        .from("user_trials")
        .select("*")
        .eq("user_id", userId)
        .eq("exam_category_id", examCategoryId)
        .maybeSingle();

      if (!trial) {
        // First time — create trial
        await supabase.from("user_trials").insert({
          user_id: userId,
          exam_category_id: examCategoryId,
          trial_start_date: new Date().toISOString().split("T")[0],
          questions_used_today: 0,
        });
        setTrialInfo({ daysRemaining: trialDuration, questionsUsedToday: 0, isTrialActive: true, maxQuestions: trialMaxQ });
        setHasAccess(true);
        setLoading(false);
        return;
      }

      const startDate = new Date(trial.trial_start_date);
      const today = new Date();
      const daysPassed = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, trialDuration - daysPassed);
      const todayStr = today.toISOString().split("T")[0];
      const questionsUsedToday = trial.last_question_date === todayStr ? trial.questions_used_today : 0;
      const isTrialActive = daysRemaining > 0 && questionsUsedToday < trialMaxQ;

      setTrialInfo({ daysRemaining, questionsUsedToday, isTrialActive, maxQuestions: trialMaxQ });

      if (isTrialActive) {
        setHasAccess(true);
      }
    } catch (error) {
      console.error("Error checking access:", error);
    } finally {
      setLoading(false);
    }
  };

  const goToPayment = () => {
    navigate(`/payment?category=${examCategoryId}&name=${encodeURIComponent(examCategoryName)}`);
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

  // No access — show upgrade prompt
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Access {examCategoryName}</h2>
        <p className="text-muted-foreground">Subscribe or enter an access PIN to unlock exam content</p>
      </div>

      {/* Trial status banners */}
      {trialInfo && trialInfo.isTrialActive && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Free Trial Active</p>
                <p className="text-sm text-muted-foreground">
                  {trialInfo.daysRemaining} day(s) left · {trialInfo.maxQuestions - trialInfo.questionsUsedToday} questions remaining today
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
                Your free trial has ended. Subscribe or enter a PIN to continue.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!trialConfig.trialsEnabled && !trialInfo && (
        <Card className="mb-6 border-amber-300/50 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-300">Subscription Required</p>
              <p className="text-sm text-muted-foreground">
                A subscription or access PIN is required to access this exam category.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={goToPayment} size="lg" className="w-full mb-4">
        <CreditCard className="mr-2 h-5 w-5" />
        Subscribe — ₦1,000/month
      </Button>

      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate("/exam")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Exam Categories
        </Button>
      </div>
    </div>
  );
};
