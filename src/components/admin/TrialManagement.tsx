import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Gift, Save } from "lucide-react";

export const TrialManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [trialsEnabled, setTrialsEnabled] = useState(true);
  const [trialDuration, setTrialDuration] = useState("5");
  const [trialMaxQuestions, setTrialMaxQuestions] = useState("5");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("id, trials_enabled, trial_duration_days, trial_max_questions")
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettingsId(data.id);
        setTrialsEnabled((data as any).trials_enabled ?? true);
        setTrialDuration(String((data as any).trial_duration_days ?? 5));
        setTrialMaxQuestions(String((data as any).trial_max_questions ?? 5));
      }
    } catch (error) {
      console.error("Error fetching trial settings:", error);
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
        } as any)
        .eq("id", settingsId);

      if (error) throw error;

      toast({ title: "Saved", description: "Trial settings updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to save trial settings.", variant: "destructive" });
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
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">Enable Free Trials</Label>
            <p className="text-sm text-muted-foreground">
              {trialsEnabled 
                ? "New users get a free trial before needing to subscribe" 
                : "Users must subscribe or enter a PIN to access exams"}
            </p>
          </div>
          <Switch checked={trialsEnabled} onCheckedChange={setTrialsEnabled} />
        </div>

        {trialsEnabled && (
          <>
            {/* Duration */}
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

            {/* Max questions per day */}
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

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Trial Settings
        </Button>
      </CardContent>
    </Card>
  );
};
