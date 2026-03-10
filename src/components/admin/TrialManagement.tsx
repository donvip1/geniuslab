import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Save, CreditCard } from "lucide-react";

export const TrialManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [trialsEnabled, setTrialsEnabled] = useState(true);
  const [trialDuration, setTrialDuration] = useState("5");
  const [trialMaxQuestions, setTrialMaxQuestions] = useState("5");
  const [manualPaymentEnabled, setManualPaymentEnabled] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("id, trials_enabled, trial_duration_days, trial_max_questions, manual_payment_enabled, payment_bank_name, payment_account_number, payment_account_holder")
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettingsId(data.id);
        setTrialsEnabled((data as any).trials_enabled ?? true);
        setTrialDuration(String((data as any).trial_duration_days ?? 5));
        setTrialMaxQuestions(String((data as any).trial_max_questions ?? 5));
        setManualPaymentEnabled((data as any).manual_payment_enabled ?? false);
        setBankName(data.payment_bank_name || "");
        setAccountNumber(data.payment_account_number || "");
        setAccountHolder(data.payment_account_holder || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("exam_settings")
        .update({
          trials_enabled: trialsEnabled,
          trial_duration_days: parseInt(trialDuration),
          trial_max_questions: parseInt(trialMaxQuestions),
          manual_payment_enabled: manualPaymentEnabled,
          payment_bank_name: bankName,
          payment_account_number: accountNumber,
          payment_account_holder: accountHolder,
        } as any)
        .eq("id", settingsId);

      if (error) throw error;

      toast({ title: "Saved", description: "Settings updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trial Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Trial Period Settings</CardTitle>
              <CardDescription>Configure free trial access for new users</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Free Trials</Label>
              <p className="text-sm text-muted-foreground">
                {trialsEnabled
                  ? "New users get a free trial before needing to activate"
                   : "Users must activate or enter a PIN to access exams"}
              </p>
            </div>
            <Switch checked={trialsEnabled} onCheckedChange={setTrialsEnabled} />
          </div>

          {trialsEnabled && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Trial Duration</Label>
                <Select value={trialDuration} onValueChange={setTrialDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="5">5 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Questions Per Day (During Trial)</Label>
                <Select value={trialMaxQuestions} onValueChange={setTrialMaxQuestions}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Question</SelectItem>
                    <SelectItem value="3">3 Questions</SelectItem>
                    <SelectItem value="5">5 Questions</SelectItem>
                    <SelectItem value="10">10 Questions</SelectItem>
                    <SelectItem value="15">15 Questions</SelectItem>
                    <SelectItem value="20">20 Questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Manual Payment Option</CardTitle>
              <CardDescription>Show bank transfer details on the pricing page</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Enable Manual Payment</Label>
              <p className="text-sm text-muted-foreground">
                {manualPaymentEnabled
                  ? "Bank transfer details are shown alongside Paystack"
                  : "Only Paystack payment is available"}
              </p>
            </div>
            <Switch checked={manualPaymentEnabled} onCheckedChange={setManualPaymentEnabled} />
          </div>

          {manualPaymentEnabled && (
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Bank Name</Label>
                <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Opay, GTBank" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Number</Label>
                <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Holder Name</Label>
                <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="e.g. John Doe" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save All Settings
      </Button>
    </div>
  );
};
