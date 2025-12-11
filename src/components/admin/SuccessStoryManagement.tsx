import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, X, Check, Star, Plus } from "lucide-react";
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

interface SuccessStory {
  id: string;
  student_name: string;
  program: string;
  image_url: string | null;
  quote: string;
  quote_author: string | null;
  review: string;
  color_theme: string;
  display_order: number;
  is_active: boolean;
}

const MAX_STORIES = 5;

export const SuccessStoryManagement = () => {
  const { toast } = useToast();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // New story form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStory, setNewStory] = useState({
    student_name: "",
    program: "",
    image_url: "",
    quote: "",
    quote_author: "",
    review: "",
    color_theme: "emerald",
    display_order: 0,
  });
  
  // Edit state
  const [editingStory, setEditingStory] = useState<SuccessStory | null>(null);
  const [editData, setEditData] = useState({
    student_name: "",
    program: "",
    image_url: "",
    quote: "",
    quote_author: "",
    review: "",
    color_theme: "emerald",
    display_order: 0,
  });

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const { data, error } = await supabase
        .from("success_stories")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      setStories(data || []);
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

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (stories.length >= MAX_STORIES) {
      toast({
        title: "Limit Reached",
        description: `Maximum ${MAX_STORIES} success stories allowed. Please delete one to add a new one.`,
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase.from("success_stories").insert({
        student_name: newStory.student_name,
        program: newStory.program,
        image_url: newStory.image_url || null,
        quote: newStory.quote,
        quote_author: newStory.quote_author || null,
        review: newStory.review,
        color_theme: newStory.color_theme,
        display_order: newStory.display_order || stories.length + 1,
      });
      
      if (error) throw error;
      
      toast({ title: "Success story added" });
      setNewStory({
        student_name: "",
        program: "",
        image_url: "",
        quote: "",
        quote_author: "",
        review: "",
        color_theme: "emerald",
        display_order: 0,
      });
      setShowAddForm(false);
      fetchStories();
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

  const handleUpdateStory = async (id: string) => {
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("success_stories")
        .update({
          student_name: editData.student_name,
          program: editData.program,
          image_url: editData.image_url || null,
          quote: editData.quote,
          quote_author: editData.quote_author || null,
          review: editData.review,
          color_theme: editData.color_theme,
          display_order: editData.display_order,
        })
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Success story updated" });
      setEditingStory(null);
      fetchStories();
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

  const handleDeleteStory = async (id: string) => {
    try {
      const { error } = await supabase
        .from("success_stories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      toast({ title: "Success story deleted" });
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (story: SuccessStory) => {
    try {
      const { error } = await supabase
        .from("success_stories")
        .update({ is_active: !story.is_active })
        .eq("id", story.id);
      
      if (error) throw error;
      
      toast({ title: `Story ${story.is_active ? 'hidden' : 'shown'}` });
      fetchStories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const startEditing = (story: SuccessStory) => {
    setEditingStory(story);
    setEditData({
      student_name: story.student_name,
      program: story.program,
      image_url: story.image_url || "",
      quote: story.quote,
      quote_author: story.quote_author || "",
      review: story.review,
      color_theme: story.color_theme,
      display_order: story.display_order,
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
            <Star className="h-6 w-6" />
            Success Stories
          </h2>
          <p className="text-muted-foreground">
            Manage student testimonials ({stories.length}/{MAX_STORIES} max)
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          disabled={stories.length >= MAX_STORIES}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Story
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Success Story</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStory} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Student Name *</Label>
                  <Input
                    value={newStory.student_name}
                    onChange={(e) => setNewStory({ ...newStory, student_name: e.target.value })}
                    placeholder="e.g., Emmanuel Okunlola"
                    required
                  />
                </div>
                <div>
                  <Label>Program *</Label>
                  <Input
                    value={newStory.program}
                    onChange={(e) => setNewStory({ ...newStory, program: e.target.value })}
                    placeholder="e.g., Nursing Department, FUOYE"
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Image URL (Optional)</Label>
                <Input
                  value={newStory.image_url}
                  onChange={(e) => setNewStory({ ...newStory, image_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Quote *</Label>
                  <Input
                    value={newStory.quote}
                    onChange={(e) => setNewStory({ ...newStory, quote: e.target.value })}
                    placeholder="A short inspirational quote..."
                    required
                  />
                </div>
                <div>
                  <Label>Quote Author</Label>
                  <Input
                    value={newStory.quote_author}
                    onChange={(e) => setNewStory({ ...newStory, quote_author: e.target.value })}
                    placeholder="e.g., Malcolm X"
                  />
                </div>
              </div>
              <div>
                <Label>Full Review/Testimonial *</Label>
                <Textarea
                  value={newStory.review}
                  onChange={(e) => setNewStory({ ...newStory, review: e.target.value })}
                  placeholder="The student's full testimonial..."
                  rows={6}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Color Theme</Label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={newStory.color_theme}
                    onChange={(e) => setNewStory({ ...newStory, color_theme: e.target.value })}
                  >
                    <option value="emerald">Emerald (Green)</option>
                    <option value="blue">Blue</option>
                    <option value="purple">Purple</option>
                    <option value="primary">Primary</option>
                  </select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={newStory.display_order}
                    onChange={(e) => setNewStory({ ...newStory, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Story
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
        {stories.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No success stories yet. Add your first one!</p>
            </CardContent>
          </Card>
        ) : (
          stories.map((story) => (
            <Card key={story.id} className={!story.is_active ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                {editingStory?.id === story.id ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Student Name</Label>
                        <Input
                          value={editData.student_name}
                          onChange={(e) => setEditData({ ...editData, student_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Program</Label>
                        <Input
                          value={editData.program}
                          onChange={(e) => setEditData({ ...editData, program: e.target.value })}
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
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Quote</Label>
                        <Input
                          value={editData.quote}
                          onChange={(e) => setEditData({ ...editData, quote: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Quote Author</Label>
                        <Input
                          value={editData.quote_author}
                          onChange={(e) => setEditData({ ...editData, quote_author: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Review</Label>
                      <Textarea
                        value={editData.review}
                        onChange={(e) => setEditData({ ...editData, review: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Color Theme</Label>
                        <select
                          className="w-full p-2 border rounded-md bg-background"
                          value={editData.color_theme}
                          onChange={(e) => setEditData({ ...editData, color_theme: e.target.value })}
                        >
                          <option value="emerald">Emerald</option>
                          <option value="blue">Blue</option>
                          <option value="purple">Purple</option>
                          <option value="primary">Primary</option>
                        </select>
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
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdateStory(story.id)} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingStory(null)}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    {story.image_url && (
                      <img
                        src={story.image_url}
                        alt={story.student_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{story.student_name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${story.is_active ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                          {story.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <p className="text-sm text-primary font-medium">{story.program}</p>
                      <p className="text-sm text-muted-foreground mt-1 italic">"{story.quote}"</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{story.review}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => handleToggleActive(story)}>
                        {story.is_active ? 'Hide' : 'Show'}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEditing(story)}>
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
                            <AlertDialogTitle>Delete Success Story?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove {story.student_name}'s testimonial. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStory(story.id)}
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
