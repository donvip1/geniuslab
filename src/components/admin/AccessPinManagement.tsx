import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Key, Printer, Loader2, RefreshCw, Search, Filter, Lock, CreditCard, Settings } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AccessPin {
  id: string;
  pin_code: string;
  batch_id: string;
  is_used: boolean;
  used_by: string | null;
  used_by_email: string | null;
  used_at: string | null;
  expires_at: string | null;
  created_at: string;
  exam_category_id: string | null;
}

interface PinBatch {
  id: string;
  batch_name: string | null;
  pin_count: number;
  created_at: string;
}

interface PinStats {
  total: number;
  unused: number;
  used: number;
  expired: number;
  active: number;
}

interface PaymentSettings {
  payment_contact: string;
  payment_account_number: string;
  payment_bank_name: string;
  payment_account_holder: string;
  payment_amount: number;
}

interface ExamCategory {
  id: string;
  name: string;
  slug: string;
}

export const AccessPinManagement = () => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Settings state
  const [isPinRequired, setIsPinRequired] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  // Password state
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(true);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPasswordGate, setShowPasswordGate] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [gatePassword, setGatePassword] = useState("");
  const [passwordActionLoading, setPasswordActionLoading] = useState(false);
  
  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_contact: "08124269495",
    payment_account_number: "8124269495",
    payment_bank_name: "Opay",
    payment_account_holder: "Nsisong Etim",
    payment_amount: 1000,
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Generator state
  const [pinCount, setPinCount] = useState("100");
  const [batchName, setBatchName] = useState("");
  const [generating, setGenerating] = useState(false);
  
  // Pins list state
  const [pins, setPins] = useState<AccessPin[]>([]);
  const [batches, setBatches] = useState<PinBatch[]>([]);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchFilter, setBatchFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pinsPerPage = 50;
  
  // Stats
  const [stats, setStats] = useState<PinStats>({ total: 0, unused: 0, used: 0, expired: 0, active: 0 });

  // Exam categories
  const [examCategories, setExamCategories] = useState<ExamCategory[]>([]);
  const [selectedCategoryForGen, setSelectedCategoryForGen] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryAccessModes, setCategoryAccessModes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
    fetchPins();
    fetchBatches();
    checkPasswordExists();
    fetchPaymentSettings();
    fetchExamCategories();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [pins]);

  const checkPasswordExists = async () => {
    try {
      const { data } = await supabase
        .from("pin_generator_settings")
        .select("id")
        .limit(1)
        .maybeSingle();
      
      setHasPassword(!!data);
    } catch (error) {
      console.error("Error checking password:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  const fetchExamCategories = async () => {
    const { data } = await supabase
      .from("exam_categories")
      .select("id, name, slug, access_mode")
      .eq("is_active", true)
      .order("display_order");
    if (data) {
      setExamCategories(data);
      if (data.length > 0 && !selectedCategoryForGen) {
        setSelectedCategoryForGen(data[0].id);
      }
      // Fetch access_mode for each category
      const modes: Record<string, string> = {};
      for (const cat of data) {
        modes[cat.id] = (cat as any).access_mode || "free";
      }
      setCategoryAccessModes(modes);
    }
  };

  const toggleCategoryAccessMode = async (categoryId: string) => {
    const currentMode = categoryAccessModes[categoryId] || "free";
    const newMode = currentMode === "free" ? "pin" : "free";
    
    const { error } = await supabase
      .from("exam_categories")
      .update({ access_mode: newMode } as any)
      .eq("id", categoryId);

    if (error) {
      toast({ title: "Error", description: "Failed to update access mode", variant: "destructive" });
      return;
    }

    setCategoryAccessModes(prev => ({ ...prev, [categoryId]: newMode }));
    toast({
      title: "Updated",
      description: `${examCategories.find(c => c.id === categoryId)?.name} is now in ${newMode === "free" ? "Free" : "PIN"} mode`,
    });
  };

  const fetchPaymentSettings = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("payment_contact, payment_account_number, payment_bank_name, payment_account_holder, payment_amount")
        .limit(1)
        .maybeSingle();

      if (data) {
        setPaymentSettings({
          payment_contact: data.payment_contact || "08124269495",
          payment_account_number: data.payment_account_number || "8124269495",
          payment_bank_name: data.payment_bank_name || "Opay",
          payment_account_holder: data.payment_account_holder || "Nsisong Etim",
          payment_amount: data.payment_amount || 1000,
        });
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("exam_settings")
        .select("is_pin_required")
        .limit(1)
        .maybeSingle();

      if (data) {
        setIsPinRequired(data.is_pin_required || false);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchPins = async () => {
    setPinsLoading(true);
    try {
      const { data, error } = await supabase
        .from("access_pins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPins(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load PINs",
        variant: "destructive",
      });
    } finally {
      setPinsLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from("pin_batches")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const newStats: PinStats = {
      total: pins.length,
      unused: 0,
      used: 0,
      expired: 0,
      active: 0,
    };

    pins.forEach(pin => {
      if (!pin.is_used) {
        newStats.unused++;
      } else {
        newStats.used++;
        if (pin.expires_at && new Date(pin.expires_at) > now) {
          newStats.active++;
        } else if (pin.expires_at && new Date(pin.expires_at) <= now) {
          newStats.expired++;
        }
      }
    });

    setStats(newStats);
  };

  const togglePinRequired = async () => {
    try {
      const newValue = !isPinRequired;
      
      const { error } = await supabase
        .from("exam_settings")
        .update({ is_pin_required: newValue })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setIsPinRequired(newValue);
      toast({
        title: "Success",
        description: `PIN requirement ${newValue ? "enabled" : "disabled"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const handleSetPassword = async () => {
    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      toast({
        title: "Invalid Password",
        description: "Password must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setPasswordActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("set_pin_generator_password", {
        new_password: newPassword,
        old_password: null,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to set password");

      setHasPassword(true);
      setShowPasswordSetup(false);
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Success",
        description: "Generation password has been set",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setPasswordActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (currentPassword.length !== 4 || !/^\d{4}$/.test(currentPassword)) {
      toast({
        title: "Invalid Current Password",
        description: "Current password must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      toast({
        title: "Invalid New Password",
        description: "New password must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure new passwords match",
        variant: "destructive",
      });
      return;
    }

    setPasswordActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("set_pin_generator_password", {
        new_password: newPassword,
        old_password: currentPassword,
      });

      if (error) throw error;
      if (!data) {
        toast({
          title: "Incorrect Password",
          description: "The current password you entered is incorrect",
          variant: "destructive",
        });
        return;
      }

      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Success",
        description: "Generation password has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setPasswordActionLoading(false);
    }
  };

  const handlePasswordGateSubmit = async () => {
    if (gatePassword.length !== 4 || !/^\d{4}$/.test(gatePassword)) {
      toast({
        title: "Invalid Password",
        description: "Please enter a 4-digit password",
        variant: "destructive",
      });
      return;
    }

    setPasswordActionLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_pin_generator_password", {
        input_password: gatePassword,
      });

      if (error) throw error;
      if (!data) {
        toast({
          title: "Incorrect Password",
          description: "The password you entered is incorrect",
          variant: "destructive",
        });
        setPasswordActionLoading(false);
        return;
      }

      setShowPasswordGate(false);
      setGatePassword("");
      await executeGeneratePins();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify password",
        variant: "destructive",
      });
    } finally {
      setPasswordActionLoading(false);
    }
  };

  const handleUpdatePaymentSettings = async () => {
    setPaymentLoading(true);
    try {
      const { error } = await supabase
        .from("exam_settings")
        .update({
          payment_contact: paymentSettings.payment_contact,
          payment_account_number: paymentSettings.payment_account_number,
          payment_bank_name: paymentSettings.payment_bank_name,
          payment_account_holder: paymentSettings.payment_account_holder,
          payment_amount: paymentSettings.payment_amount,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment settings updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update payment settings",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const generatePin = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pin = "";
    for (let i = 0; i < 8; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
  };

  const handleGeneratePins = async () => {
    const count = parseInt(pinCount);
    if (isNaN(count) || count < 1 || count > 1000) {
      toast({
        title: "Invalid Count",
        description: "Please enter a number between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    if (hasPassword) {
      setShowPasswordGate(true);
    } else {
      await executeGeneratePins();
    }
  };

  const executeGeneratePins = async () => {
    const count = parseInt(pinCount);
    setGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: batchData, error: batchError } = await supabase
        .from("pin_batches")
        .insert({
          batch_name: batchName || `Batch ${new Date().toLocaleDateString()}`,
          pin_count: count,
          created_by: session.user.id,
        })
        .select()
        .single();

      if (batchError) throw batchError;

      const generatedPins: Set<string> = new Set();
      while (generatedPins.size < count) {
        generatedPins.add(generatePin());
      }

      const pinArray = Array.from(generatedPins).map(pin => ({
        pin_code: pin,
        batch_id: batchData.id,
        created_by: session.user.id,
        exam_category_id: selectedCategoryForGen || null,
      }));

      const batchSize = 100;
      for (let i = 0; i < pinArray.length; i += batchSize) {
        const batch = pinArray.slice(i, i + batchSize);
        const { error } = await supabase.from("access_pins").insert(batch);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Generated ${count} PINs successfully`,
      });

      setBatchName("");
      setPinCount("100");
      fetchPins();
      fetchBatches();
    } catch (error: any) {
      console.error("Error generating PINs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate PINs",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getFilteredPins = () => {
    const now = new Date();
    
    // First filter pins based on criteria
    const filtered = pins.filter(pin => {
      if (statusFilter === "unused" && pin.is_used) return false;
      if (statusFilter === "used" && !pin.is_used) return false;
      if (statusFilter === "expired" && (!pin.expires_at || new Date(pin.expires_at) > now)) return false;
      if (statusFilter === "active" && (!pin.is_used || !pin.expires_at || new Date(pin.expires_at) <= now)) return false;
      
      if (batchFilter !== "all" && pin.batch_id !== batchFilter) return false;
      if (categoryFilter !== "all" && pin.exam_category_id !== categoryFilter) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          pin.pin_code.toLowerCase().includes(query) ||
          (pin.used_by_email && pin.used_by_email.toLowerCase().includes(query))
        );
      }
      
      return true;
    });

    // Then sort: used pins first (by used_at desc), then unused (by created_at desc)
    return filtered.sort((a, b) => {
      // Used pins come first
      if (a.is_used && !b.is_used) return -1;
      if (!a.is_used && b.is_used) return 1;
      
      // Among used pins, sort by used_at (most recent first)
      if (a.is_used && b.is_used) {
        const aDate = a.used_at ? new Date(a.used_at).getTime() : 0;
        const bDate = b.used_at ? new Date(b.used_at).getTime() : 0;
        return bDate - aDate;
      }
      
      // Among unused pins, sort by created_at (most recent first)
      const aCreated = new Date(a.created_at).getTime();
      const bCreated = new Date(b.created_at).getTime();
      return bCreated - aCreated;
    });
  };

  const filteredPins = getFilteredPins();
  const totalPages = Math.ceil(filteredPins.length / pinsPerPage);
  const paginatedPins = filteredPins.slice(
    (currentPage - 1) * pinsPerPage,
    currentPage * pinsPerPage
  );

  const getPinStatus = (pin: AccessPin) => {
    const now = new Date();
    if (!pin.is_used) return { label: "Unused", variant: "secondary" as const };
    if (pin.expires_at && new Date(pin.expires_at) <= now) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    const pinsForPrint = batchFilter !== "all" 
      ? pins.filter(p => p.batch_id === batchFilter && !p.is_used)
      : pins.filter(p => !p.is_used);
    
    if (pinsForPrint.length === 0) {
      toast({
        title: "No PINs to Print",
        description: "Select a batch with unused PINs to print",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const pinsPerPage = 20;
    const pages: string[] = [];

    for (let i = 0; i < pinsForPrint.length; i += pinsPerPage) {
      const pagePins = pinsForPrint.slice(i, i + pinsPerPage);
      const pinCards = pagePins.map(pin => `
        <div style="
          border: 1px dashed #ccc;
          padding: 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        ">
          <div style="font-weight: bold; font-size: 12px; color: #2563eb;">GENIUSLAB</div>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #1e293b;">${pin.pin_code}</div>
          <div style="font-size: 10px; color: #64748b;">Valid for 1 month after activation</div>
          <div style="font-size: 10px; color: #64748b;">Single use only</div>
        </div>
      `).join("");

      pages.push(`
        <div style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-template-rows: repeat(5, 1fr);
          gap: 0;
          width: 210mm;
          height: 297mm;
          page-break-after: always;
          box-sizing: border-box;
          padding: 10mm;
        ">
          ${pinCards}
        </div>
      `);
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GENIUSLAB Access PINs</title>
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${pages.join("")}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  if (settingsLoading || passwordLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Setup Alert */}
      {!hasPassword && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Lock className="h-5 w-5" />
              Set Up Generation Password
            </CardTitle>
            <CardDescription className="text-orange-600">
              Create a 4-digit password to secure PIN generation. Only those with the password can generate new PINs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowPasswordSetup(true)} className="bg-orange-600 hover:bg-orange-700">
              <Lock className="mr-2 h-4 w-4" />
              Set Password
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Per-Category Access Mode Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Per-Category Access Control
          </CardTitle>
          <CardDescription>
            Toggle each exam category between Free Mode (open access) and PIN Mode (requires PIN/subscription)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {examCategories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
              <div>
                <p className="font-medium">{cat.name}</p>
                <p className="text-sm text-muted-foreground">
                  {categoryAccessModes[cat.id] === "pin"
                    ? "PIN/Subscription required"
                    : "Free access — all questions open"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${categoryAccessModes[cat.id] === "pin" ? "text-destructive" : "text-green-600"}`}>
                  {categoryAccessModes[cat.id] === "pin" ? "PIN Mode" : "Free Mode"}
                </span>
                <Switch
                  checked={categoryAccessModes[cat.id] === "pin"}
                  onCheckedChange={() => toggleCategoryAccessMode(cat.id)}
                />
              </div>
            </div>
          ))}
          
          {hasPassword && (
            <div className="pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPasswordChange(true)}>
                <Lock className="mr-2 h-4 w-4" />
                Change Generation Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Configure payment details shown to students when they need to purchase a PIN
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentContact">WhatsApp Contact Number</Label>
              <Input
                id="paymentContact"
                value={paymentSettings.payment_contact}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, payment_contact: e.target.value }))}
                placeholder="08124269495"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentBank">Bank Name</Label>
              <Input
                id="paymentBank"
                value={paymentSettings.payment_bank_name}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, payment_bank_name: e.target.value }))}
                placeholder="Opay"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAccount">Account Number</Label>
              <Input
                id="paymentAccount"
                value={paymentSettings.payment_account_number}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, payment_account_number: e.target.value }))}
                placeholder="8124269495"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentHolder">Account Holder Name</Label>
              <Input
                id="paymentHolder"
                value={paymentSettings.payment_account_holder}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, payment_account_holder: e.target.value }))}
                placeholder="Nsisong Etim"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Amount (₦)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentSettings.payment_amount}
                onChange={(e) => setPaymentSettings(prev => ({ ...prev, payment_amount: parseInt(e.target.value) || 0 }))}
                placeholder="1000"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleUpdatePaymentSettings} disabled={paymentLoading}>
              {paymentLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-4 w-4" />
                  Update Payment Info
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.unused}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.used}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Used</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* PIN Generator */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Generate New PINs</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Max 1,000 per batch{hasPassword && " · Password required"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pinCount" className="text-xs sm:text-sm">Count</Label>
              <Input
                id="pinCount"
                type="number"
                min="1"
                max="1000"
                value={pinCount}
                onChange={(e) => setPinCount(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batchName" className="text-xs sm:text-sm">Batch Name</Label>
              <Input
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Jan 2026"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pinCategory" className="text-xs sm:text-sm">Category</Label>
              <Select value={selectedCategoryForGen} onValueChange={setSelectedCategoryForGen}>
                <SelectTrigger id="pinCategory">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {examCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end col-span-2 sm:col-span-1">
              <Button 
                onClick={handleGeneratePins} 
                disabled={generating || !selectedCategoryForGen}
                className="w-full"
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>
                ) : (
                  <><Key className="mr-2 h-4 w-4" />Generate</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PIN List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>PIN List</CardTitle>
              <CardDescription>
                View and manage all generated PINs
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchPins} disabled={pinsLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${pinsLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print PINs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PIN or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unused">Unused</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {examCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={batchFilter} onValueChange={(v) => { setBatchFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                {batches.map((batch) => (
                  <SelectItem key={batch.id} value={batch.id}>
                    {batch.batch_name || `Batch ${formatDate(batch.created_at)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PIN Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used By</TableHead>
                  <TableHead>Activated</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No PINs found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPins.map((pin) => {
                    const status = getPinStatus(pin);
                    return (
                      <TableRow key={pin.id}>
                        <TableCell className="font-mono font-bold">{pin.pin_code}</TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>{pin.used_by_email || "-"}</TableCell>
                        <TableCell>{formatDate(pin.used_at)}</TableCell>
                        <TableCell>{formatDate(pin.expires_at)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pinsPerPage + 1} to {Math.min(currentPage * pinsPerPage, filteredPins.length)} of {filteredPins.length} PINs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Setup Dialog */}
      <Dialog open={showPasswordSetup} onOpenChange={setShowPasswordSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Generation Password</DialogTitle>
            <DialogDescription>
              Create a 4-digit password that will be required to generate new PINs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New 4-Digit Password</Label>
              <Input
                id="newPassword"
                type="password"
                maxLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                maxLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordSetup(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetPassword} disabled={passwordActionLoading}>
              {passwordActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Set Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Generation Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                maxLength={4}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPasswordChange">New 4-Digit Password</Label>
              <Input
                id="newPasswordChange"
                type="password"
                maxLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPasswordChange">Confirm New Password</Label>
              <Input
                id="confirmPasswordChange"
                type="password"
                maxLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                className="text-center text-2xl tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordChange(false);
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordActionLoading}>
              {passwordActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Gate Dialog */}
      <AlertDialog open={showPasswordGate} onOpenChange={setShowPasswordGate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Enter Generation Password
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the 4-digit password to generate PINs
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              maxLength={4}
              value={gatePassword}
              onChange={(e) => setGatePassword(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              className="text-center text-3xl tracking-widest h-16"
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setGatePassword("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordGateSubmit} disabled={passwordActionLoading || gatePassword.length !== 4}>
              {passwordActionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm & Generate"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
