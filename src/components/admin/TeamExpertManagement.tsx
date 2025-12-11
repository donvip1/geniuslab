import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, X, Check, Users, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeamExpert {
  id: string;
  name: string;
  alias: string | null;
  title: string;
  description: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

export const TeamExpertManagement = () => {
  const { toast } = useToast();
  const [experts, setExperts] = useState<TeamExpert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New expert form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpert, setNewExpert] = useState({
    name: "",
    alias: "",
    title: "",
    description: "",
    image_url: "",
    display_order: 0,
  });
  
  // Edit state
  const [editingExpert, setEditingExpert] = useState<TeamExpert | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    alias: "",
    title: "",
    description: "",
    image_url: "",
    display_order: 0,
  });

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      const { data, error } = await supabase
        .from("team_experts")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      setExperts(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpert = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { error } = await supabase.from("team_experts").insert({
        name: newExpert.name,
        alias: newExpert.alias || null,
        title: newExpert.title,
        description: newExpert.description,
        image_url: newExpert.image_url || null,
        display_order: newExpert.display_order || experts.length + 1,
      });
      
      if (error) throw error;
      
      toast({ title: "Team expert added successfully" });
      setNewExpert({ name: "", alias: "", title: "", description: "", image_url: "", display_order: 0 });
      setShowAddForm(false);
      fetchExperts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExpert = async (id: string) => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("team_experts")
        .update({
          name: editData.name,
          alias: editData.alias || null,
          title: editData.title,
          description: editData.description,
          image_url: editData.image_url || null,
          display_order: editData.display_order,
        })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Team expert updated successfully" });
      setEditingExpert(null);
      fetchExperts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpert = async (id: string) => {
    try {
      const { error } = await supabase
        .from("team_experts")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Team expert deleted successfully" });
      fetchExperts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (expert: TeamExpert) => {
    try {
      const { error } = await supabase
        .from("team_experts")
        .update({ is_active: !expert.is_active })
        .eq("id", expert.id);
      
      if (error) throw error;
      
      toast({ title: `Expert ${expert.is_active ? 'hidden' : 'shown'}` });
      fetchExperts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditing = (expert: TeamExpert) => {
    setEditingExpert(expert);
    setEditData({
      name: expert.name,
      alias: expert.alias || "",
      title: expert.title,
      description: expert.description,
      image_url: expert.image_url || "",
      display_order: expert.display_order,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team of Experts
          </h2>
          <p className="text-muted-foreground">Manage team members displayed on the About page</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expert
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Team Expert</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddExpert} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={newExpert.name}
                    onChange={(e) => setNewExpert({ ...newExpert, name: e.target.value })}
                    placeholder="e.g., Adeyeye Kehinde David"
                    required
                  />
                </div>
                <div>
                  <Label>Alias (Nickname)</Label>
                  <Input
                    value={newExpert.alias}
                    onChange={(e) => setNewExpert({ ...newExpert, alias: e.target.value })}
                    placeholder="e.g., Son of God"
                  />
                </div>
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={newExpert.title}
                    onChange={(e) => setNewExpert({ ...newExpert, title: e.target.value })}
                    placeholder="e.g., Biology Expert & Academic Tutor"
                    required
                  />
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={newExpert.display_order}
                    onChange={(e) => setNewExpert({ ...newExpert, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input
                  value={newExpert.image_url}
                  onChange={(e) => setNewExpert({ ...newExpert, image_url: e.target.value })}
                  placeholder="https://example.com/profile.jpg"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={newExpert.description}
                  onChange={(e) => setNewExpert({ ...newExpert, description: e.target.value })}
                  placeholder="Brief bio about the team member..."
                  rows={4}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Expert
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {experts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No team experts yet. Add your first one!</p>
            </CardContent>
          </Card>
        ) : (
          experts.map((expert) => (
            <Card key={expert.id} className={!expert.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                {editingExpert?.id === expert.id ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Alias</Label>
                        <Input
                          value={editData.alias}
                          onChange={(e) => setEditData({ ...editData, alias: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editData.title}
                          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Display Order</Label>
                        <Input
                          type="number"
                          value={editData.display_order}
                          onChange={(e) => setEditData({ ...editData, display_order: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={editData.image_url}
                        onChange={(e) => setEditData({ ...editData, image_url: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateExpert(expert.id)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingExpert(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {expert.image_url && (
                      <img
                        src={expert.image_url}
                        alt={expert.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{expert.name}</h3>
                        {expert.alias && (
                          <span className="text-sm text-muted-foreground">({expert.alias})</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${expert.is_active ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {expert.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-sm text-primary font-medium">{expert.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{expert.description}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleToggleActive(expert)}>
                        {expert.is_active ? 'Hide' : 'Show'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEditing(expert)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Team Expert?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {expert.name} from the team. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteExpert(expert.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
