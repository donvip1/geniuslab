import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, UserX, Pause, Ban, AlertTriangle, Undo2, Loader2, Calendar } from "lucide-react";

interface UserRestriction {
  id: string;
  user_id: string;
  email: string;
  restriction_type: "paused" | "suspended" | "banned";
  reason: string | null;
  restricted_by: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
}

interface Profile {
  user_id: string;
  email: string;
  full_name: string;
}

export const UserManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [applying, setApplying] = useState(false);
  
  // New restriction form
  const [restrictionType, setRestrictionType] = useState<"paused" | "suspended" | "banned">("paused");
  const [restrictionReason, setRestrictionReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    fetchRestrictions();
  }, []);

  const fetchRestrictions = async () => {
    try {
      const { data, error } = await supabase
        .from("user_restrictions")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRestrictions((data || []) as UserRestriction[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load user restrictions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, email, full_name")
        .eq("email", searchEmail.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast({
          title: "User Not Found",
          description: "No user with this email address exists",
          variant: "destructive",
        });
        return;
      }

      // Check if user is already restricted
      const existingRestriction = restrictions.find(r => r.user_id === data.user_id);
      if (existingRestriction) {
        toast({
          title: "Already Restricted",
          description: `This user is already ${existingRestriction.restriction_type}`,
          variant: "destructive",
        });
        return;
      }

      setSearchResult(data);
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleApplyRestriction = async () => {
    if (!searchResult) return;

    setApplying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_restrictions")
        .insert({
          user_id: searchResult.user_id,
          email: searchResult.email,
          restriction_type: restrictionType,
          reason: restrictionReason || null,
          restricted_by: user.id,
          expires_at: expiresAt || null,
        });

      if (error) throw error;

      toast({
        title: "Restriction Applied",
        description: `User has been ${restrictionType}`,
      });

      // Reset form
      setSearchResult(null);
      setSearchEmail("");
      setRestrictionReason("");
      setExpiresAt("");
      setRestrictionType("paused");
      
      fetchRestrictions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveRestriction = async (restrictionId: string) => {
    try {
      const { error } = await supabase
        .from("user_restrictions")
        .update({ is_active: false })
        .eq("id", restrictionId);

      if (error) throw error;

      toast({
        title: "Restriction Removed",
        description: "User can now access the platform normally",
      });

      fetchRestrictions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRestrictionBadge = (type: string) => {
    switch (type) {
      case "paused":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Pause className="h-3 w-3 mr-1" /> Paused</Badge>;
      case "suspended":
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      case "banned":
        return <Badge variant="destructive"><Ban className="h-3 w-3 mr-1" /> Banned</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Restriction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Restrict User Access
          </CardTitle>
          <CardDescription>
            Search for a user by email to pause, suspend, or ban them from the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Section */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Enter user email address..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>
          </div>

          {/* Search Result - Apply Restriction Form */}
          {searchResult && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{searchResult.full_name}</p>
                    <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSearchResult(null)}>
                    Cancel
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Restriction Type</Label>
                    <Select value={restrictionType} onValueChange={(v: "paused" | "suspended" | "banned") => setRestrictionType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paused">
                          <span className="flex items-center gap-2"><Pause className="h-4 w-4 text-yellow-600" /> Pause (Temporary)</span>
                        </SelectItem>
                        <SelectItem value="suspended">
                          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" /> Suspend</span>
                        </SelectItem>
                        <SelectItem value="banned">
                          <span className="flex items-center gap-2"><Ban className="h-4 w-4 text-red-600" /> Ban (Permanent)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Expires At (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason (Optional - will be shown to user)</Label>
                  <Textarea
                    placeholder="Enter reason for restriction..."
                    value={restrictionReason}
                    onChange={(e) => setRestrictionReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleApplyRestriction} 
                  disabled={applying}
                  variant={restrictionType === "banned" ? "destructive" : "default"}
                  className="w-full"
                >
                  {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply {restrictionType.charAt(0).toUpperCase() + restrictionType.slice(1)}
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Active Restrictions List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Restrictions ({restrictions.length})</CardTitle>
          <CardDescription>
            Users currently restricted from accessing the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restrictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active restrictions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restrictions.map((restriction) => (
                  <TableRow key={restriction.id}>
                    <TableCell className="font-medium">{restriction.email}</TableCell>
                    <TableCell>{getRestrictionBadge(restriction.restriction_type)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {restriction.reason || <span className="text-muted-foreground">No reason provided</span>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(restriction.created_at)}</TableCell>
                    <TableCell className="text-sm">
                      {restriction.expires_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(restriction.expires_at)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Undo2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Restriction?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will restore access for {restriction.email}. They will be able to use the platform normally.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveRestriction(restriction.id)}>
                              Remove Restriction
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
