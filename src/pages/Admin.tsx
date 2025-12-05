import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, BookOpen, Loader2, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, ClipboardPaste, Megaphone } from "lucide-react";
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

interface Subject {
  id: string;
  name: string;
  description: string | null;
  level: string | null;
  is_active: boolean;
  contributors: string | null;
}

interface Advertisement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
}

interface Question {
  id: string;
  subject_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string | null;
  is_active: boolean;
  subjects?: { name: string };
}

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Subject Management State
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjectLevel, setSubjectLevel] = useState("100L");
  const [subjectContributors, setSubjectContributors] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editContributors, setEditContributors] = useState("");

  // Advertisements State
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [adTitle, setAdTitle] = useState("");
  const [adContent, setAdContent] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editAdTitle, setEditAdTitle] = useState("");
  const [editAdContent, setEditAdContent] = useState("");
  const [editAdImageUrl, setEditAdImageUrl] = useState("");

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [filterSubject, setFilterSubject] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionData, setEditQuestionData] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "",
    explanation: "",
  });

  // Manual Question Entry State
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [newQuestionSubject, setNewQuestionSubject] = useState("");
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answer: "A",
    explanation: "",
  });

  // Bulk Import State
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState("");
  const [bulkImportSubject, setBulkImportSubject] = useState("");
  const [bulkImporting, setBulkImporting] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Check if user has admin role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/exam");
        return;
      }

      setIsAdmin(true);
      fetchSubjects();
      fetchAdvertisements();
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load subjects",
        variant: "destructive",
      });
    } else {
      setSubjects(data || []);
    }
  };

  const fetchAdvertisements = async () => {
    const { data, error } = await supabase
      .from("advertisements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load advertisements",
        variant: "destructive",
      });
    } else {
      setAdvertisements(data || []);
    }
  };

  const fetchQuestions = async (subjectId?: string) => {
    setQuestionsLoading(true);
    let query = supabase
      .from("questions")
      .select("*, subjects(name)")
      .order("created_at", { ascending: false });

    if (subjectId) {
      query = query.eq("subject_id", subjectId);
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load questions",
        variant: "destructive",
      });
    } else {
      setQuestions(data || []);
    }
    setQuestionsLoading(false);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subjectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject name",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("subjects")
      .insert([
        {
          name: subjectName,
          description: subjectDescription,
          level: subjectLevel,
          contributors: subjectContributors || null,
          created_by: user.id,
        },
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
      setSubjectName("");
      setSubjectDescription("");
      setSubjectLevel("100L");
      setSubjectContributors("");
      fetchSubjects();
    }
  };

  const handleUpdateSubject = async (subjectId: string) => {
    const { error } = await supabase
      .from("subjects")
      .update({
        name: editName,
        description: editDescription,
        level: editLevel,
        contributors: editContributors || null,
      })
      .eq("id", subjectId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update subject",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Subject updated successfully",
      });
      setEditingSubject(null);
      fetchSubjects();
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    // First delete all questions for this subject
    await supabase.from("questions").delete().eq("subject_id", subjectId);
    
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Subject and its questions deleted",
      });
      fetchSubjects();
    }
  };

  const startEditingSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setEditName(subject.name);
    setEditDescription(subject.description || "");
    setEditLevel(subject.level || "100L");
    setEditContributors(subject.contributors || "");
  };

  // Advertisement Functions
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter an ad title",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from("advertisements")
      .insert([
        {
          title: adTitle,
          content: adContent || null,
          image_url: adImageUrl || null,
          created_by: user.id,
        },
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create advertisement",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Advertisement created successfully",
      });
      setAdTitle("");
      setAdContent("");
      setAdImageUrl("");
      fetchAdvertisements();
    }
  };

  const handleUpdateAd = async (adId: string) => {
    const { error } = await supabase
      .from("advertisements")
      .update({
        title: editAdTitle,
        content: editAdContent || null,
        image_url: editAdImageUrl || null,
      })
      .eq("id", adId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update advertisement",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Advertisement updated successfully",
      });
      setEditingAd(null);
      fetchAdvertisements();
    }
  };

  const handleDeleteAd = async (adId: string) => {
    const { error } = await supabase
      .from("advertisements")
      .delete()
      .eq("id", adId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Advertisement deleted",
      });
      fetchAdvertisements();
    }
  };

  const handleToggleAdStatus = async (ad: Advertisement) => {
    const { error } = await supabase
      .from("advertisements")
      .update({ is_active: !ad.is_active })
      .eq("id", ad.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update ad status",
        variant: "destructive",
      });
    } else {
      fetchAdvertisements();
    }
  };

  const startEditingAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setEditAdTitle(ad.title);
    setEditAdContent(ad.content || "");
    setEditAdImageUrl(ad.image_url || "");
  };

  const handleUpdateQuestion = async (questionId: string) => {
    const { error } = await supabase
      .from("questions")
      .update({
        question_text: editQuestionData.question_text,
        option_a: editQuestionData.option_a,
        option_b: editQuestionData.option_b,
        option_c: editQuestionData.option_c,
        option_d: editQuestionData.option_d,
        correct_answer: editQuestionData.correct_answer,
        explanation: editQuestionData.explanation || null,
      })
      .eq("id", questionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
      setEditingQuestion(null);
      fetchQuestions(filterSubject || undefined);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Question deleted",
      });
      fetchQuestions(filterSubject || undefined);
    }
  };

  const startEditingQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditQuestionData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
      explanation: question.explanation || "",
    });
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newQuestionSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    if (!newQuestion.question_text.trim() || !newQuestion.option_a.trim() || 
        !newQuestion.option_b.trim() || !newQuestion.option_c.trim() || 
        !newQuestion.option_d.trim()) {
      toast({
        title: "Error",
        description: "Please fill in the question and all options",
        variant: "destructive",
      });
      return;
    }

    setAddingQuestion(true);

    const { error } = await supabase
      .from("questions")
      .insert([
        {
          subject_id: newQuestionSubject,
          question_text: newQuestion.question_text.trim(),
          option_a: newQuestion.option_a.trim(),
          option_b: newQuestion.option_b.trim(),
          option_c: newQuestion.option_c.trim(),
          option_d: newQuestion.option_d.trim(),
          correct_answer: newQuestion.correct_answer,
          explanation: newQuestion.explanation.trim() || null,
          is_active: true,
          created_by: user.id,
        },
      ]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add question",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Question added successfully",
      });
      setNewQuestion({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answer: "A",
        explanation: "",
      });
      setShowAddQuestion(false);
      fetchQuestions(filterSubject || undefined);
    }

    setAddingQuestion(false);
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkImportSubject) {
      toast({
        title: "Error",
        description: "Please select a subject",
        variant: "destructive",
      });
      return;
    }

    if (!bulkImportText.trim()) {
      toast({
        title: "Error",
        description: "Please paste your questions text",
        variant: "destructive",
      });
      return;
    }

    setBulkImporting(true);

    try {
      // Use AI to parse the bulk text into questions
      const { data, error } = await supabase.functions.invoke("process-bulk-questions", {
        body: {
          text: bulkImportText,
          subjectId: bulkImportSubject,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${data.questionsCreated} questions imported successfully`,
      });

      setBulkImportText("");
      setShowBulkImport(false);
      fetchQuestions(filterSubject || undefined);
    } catch (error: any) {
      console.error("Bulk import error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to import questions",
        variant: "destructive",
      });
    } finally {
      setBulkImporting(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !selectedSubject) {
      toast({
        title: "Error",
        description: "Please select a file and subject",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading file...");

    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      setUploadProgress("Processing document...");

      // Create document upload record
      const { data: docData, error: docError } = await supabase
        .from("document_uploads")
        .insert([
          {
            uploaded_by: user.id,
            subject_id: selectedSubject,
            file_name: selectedFile.name,
            file_type: selectedFile.type,
            file_size: selectedFile.size,
            storage_path: fileName,
            processing_status: "processing",
          },
        ])
        .select()
        .single();

      if (docError) throw docError;

      setUploadProgress("Extracting text and generating questions...");

      // Call edge function to process document
      const { data: processData, error: processError } = await supabase.functions.invoke(
        "process-document",
        {
          body: {
            documentId: docData.id,
            storagePath: fileName,
            subjectId: selectedSubject,
          },
        }
      );

      if (processError) throw processError;

      toast({
        title: "Success",
        description: `Document processed! ${processData.questionsGenerated} questions created.`,
      });

      setSelectedFile(null);
      setSelectedSubject("");
      setUploadProgress("");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage subjects and upload exam questions</p>
          </div>

          <Tabs defaultValue="subjects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
              <TabsTrigger value="subjects">
                <BookOpen className="h-4 w-4 mr-2" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="questions" onClick={() => fetchQuestions()}>
                <FileText className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="ads">
                <Megaphone className="h-4 w-4 mr-2" />
                Ads
              </TabsTrigger>
            </TabsList>

            {/* Subjects Tab */}
            <TabsContent value="subjects" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Subject</CardTitle>
                    <CardDescription>Add a new subject for students to practice</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateSubject} className="space-y-4">
                      <div>
                        <Label htmlFor="subject-name">Subject Name</Label>
                        <Input
                          id="subject-name"
                          value={subjectName}
                          onChange={(e) => setSubjectName(e.target.value)}
                          placeholder="e.g., Mathematics, Physics, Chemistry"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject-level">Level</Label>
                        <select
                          id="subject-level"
                          className="w-full mt-1 p-2 border rounded-md bg-background"
                          value={subjectLevel}
                          onChange={(e) => setSubjectLevel(e.target.value)}
                          required
                        >
                          <option value="100L">100 Level</option>
                          <option value="200L">200 Level</option>
                          <option value="300L">300 Level</option>
                          <option value="400L">400 Level</option>
                          <option value="500L">500 Level</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="subject-description">Description (Optional)</Label>
                        <Textarea
                          id="subject-description"
                          value={subjectDescription}
                          onChange={(e) => setSubjectDescription(e.target.value)}
                          placeholder="Brief description of the subject"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject-contributors">Contributors (Optional)</Label>
                        <Input
                          id="subject-contributors"
                          value={subjectContributors}
                          onChange={(e) => setSubjectContributors(e.target.value)}
                          placeholder="e.g., Holysinner, Colossus, Green Arrow"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Names of people who compiled the questions
                        </p>
                      </div>
                      <Button type="submit" className="w-full">
                        Create Subject
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Subjects</CardTitle>
                    <CardDescription>Manage all subjects in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects yet</p>
                      ) : (
                        subjects.map((subject) => (
                          <div
                            key={subject.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            {editingSubject?.id === subject.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Subject name"
                                />
                                <select
                                  className="w-full p-2 border rounded-md bg-background text-sm"
                                  value={editLevel}
                                  onChange={(e) => setEditLevel(e.target.value)}
                                >
                                  <option value="100L">100 Level</option>
                                  <option value="200L">200 Level</option>
                                  <option value="300L">300 Level</option>
                                  <option value="400L">400 Level</option>
                                  <option value="500L">500 Level</option>
                                </select>
                                <Textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  placeholder="Description"
                                  rows={2}
                                />
                                <Input
                                  value={editContributors}
                                  onChange={(e) => setEditContributors(e.target.value)}
                                  placeholder="Contributors (e.g., Holysinner, Colossus)"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateSubject(subject.id)}
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingSubject(null)}
                                  >
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium truncate">{subject.name}</h3>
                                  {subject.description && (
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {subject.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {subject.contributors && (
                                    <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-1 rounded">
                                      By: {subject.contributors}
                                    </span>
                                  )}
                                  {subject.level && (
                                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                      {subject.level}
                                    </span>
                                  )}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => startEditingSubject(subject)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete "{subject.name}" and all its questions. This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteSubject(subject.id)}
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
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Documents for Question Generation</CardTitle>
                  <CardDescription>
                    Upload Word documents, PDFs, or handwritten notes. Our AI will extract text and generate multiple-choice questions automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFileUpload} className="space-y-6">
                    <div>
                      <Label htmlFor="subject-select">Select Subject</Label>
                      <select
                        id="subject-select"
                        className="w-full mt-1 p-2 border rounded-md bg-background"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        required
                      >
                        <option value="">Choose a subject...</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="file-upload">Upload Document</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.txt,.text,.rtf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: PDF, Word (.doc, .docx), Images (.jpg, .png, .gif, .webp), Plain text (.txt), RTF
                      </p>
                    </div>

                    {uploadProgress && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {uploadProgress}
                        </p>
                      </div>
                    )}

                    <Button type="submit" disabled={uploading} className="w-full">
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload and Generate Questions
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Questions Tab */}
            <TabsContent value="questions">
              <div className="space-y-6">
                {/* Add Question Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Add Question Manually</CardTitle>
                        <CardDescription>Create a new question with options and correct answer</CardDescription>
                      </div>
                      <Button
                        variant={showAddQuestion ? "outline" : "default"}
                        onClick={() => setShowAddQuestion(!showAddQuestion)}
                      >
                        {showAddQuestion ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            Add New Question
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {showAddQuestion && (
                    <CardContent>
                      <form onSubmit={handleAddQuestion} className="space-y-4">
                        <div>
                          <Label htmlFor="new-question-subject">Subject *</Label>
                          <select
                            id="new-question-subject"
                            className="w-full mt-1 p-2 border rounded-md bg-background"
                            value={newQuestionSubject}
                            onChange={(e) => setNewQuestionSubject(e.target.value)}
                            required
                          >
                            <option value="">Select a subject...</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.level})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="new-question-text">Question Text *</Label>
                          <Textarea
                            id="new-question-text"
                            value={newQuestion.question_text}
                            onChange={(e) =>
                              setNewQuestion({ ...newQuestion, question_text: e.target.value })
                            }
                            placeholder="Enter your question here..."
                            rows={3}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-option-a">Option A *</Label>
                            <Input
                              id="new-option-a"
                              value={newQuestion.option_a}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, option_a: e.target.value })
                              }
                              placeholder="Enter option A"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-option-b">Option B *</Label>
                            <Input
                              id="new-option-b"
                              value={newQuestion.option_b}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, option_b: e.target.value })
                              }
                              placeholder="Enter option B"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-option-c">Option C *</Label>
                            <Input
                              id="new-option-c"
                              value={newQuestion.option_c}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, option_c: e.target.value })
                              }
                              placeholder="Enter option C"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="new-option-d">Option D *</Label>
                            <Input
                              id="new-option-d"
                              value={newQuestion.option_d}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, option_d: e.target.value })
                              }
                              placeholder="Enter option D"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="new-correct-answer">Correct Answer *</Label>
                            <select
                              id="new-correct-answer"
                              className="w-full mt-1 p-2 border rounded-md bg-background"
                              value={newQuestion.correct_answer}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, correct_answer: e.target.value })
                              }
                              required
                            >
                              <option value="A">A - {newQuestion.option_a || "Option A"}</option>
                              <option value="B">B - {newQuestion.option_b || "Option B"}</option>
                              <option value="C">C - {newQuestion.option_c || "Option C"}</option>
                              <option value="D">D - {newQuestion.option_d || "Option D"}</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="new-explanation">Explanation (Optional)</Label>
                            <Input
                              id="new-explanation"
                              value={newQuestion.explanation}
                              onChange={(e) =>
                                setNewQuestion({ ...newQuestion, explanation: e.target.value })
                              }
                              placeholder="Why this answer is correct"
                            />
                          </div>
                        </div>

                        <Button type="submit" disabled={addingQuestion} className="w-full">
                          {addingQuestion ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Adding Question...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Add Question
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  )}
                </Card>

                {/* Bulk Import Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle>Bulk Import Questions</CardTitle>
                        <CardDescription>Paste multiple questions at once to import them</CardDescription>
                      </div>
                      <Button
                        variant={showBulkImport ? "outline" : "secondary"}
                        onClick={() => setShowBulkImport(!showBulkImport)}
                      >
                        {showBulkImport ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <ClipboardPaste className="h-4 w-4 mr-2" />
                            Bulk Import
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  {showBulkImport && (
                    <CardContent>
                      <form onSubmit={handleBulkImport} className="space-y-4">
                        <div>
                          <Label htmlFor="bulk-import-subject">Subject *</Label>
                          <select
                            id="bulk-import-subject"
                            className="w-full mt-1 p-2 border rounded-md bg-background"
                            value={bulkImportSubject}
                            onChange={(e) => setBulkImportSubject(e.target.value)}
                            required
                          >
                            <option value="">Select a subject...</option>
                            {subjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.level})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="bulk-import-text">Paste Questions *</Label>
                          <Textarea
                            id="bulk-import-text"
                            value={bulkImportText}
                            onChange={(e) => setBulkImportText(e.target.value)}
                            placeholder={`Paste your questions here. Example format:

1. What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
Answer: B

2. What is the capital of Nigeria?
A. Lagos
B. Abuja
C. Kano
D. Ibadan
Answer: B

Or any other format - our AI will parse it automatically!`}
                            rows={12}
                            required
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Paste questions in any format. AI will automatically extract and format them.
                          </p>
                        </div>

                        <Button type="submit" disabled={bulkImporting} className="w-full">
                          {bulkImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Importing Questions...
                            </>
                          ) : (
                            <>
                              <ClipboardPaste className="h-4 w-4 mr-2" />
                              Import Questions
                            </>
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  )}
                </Card>

                {/* Question Bank Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Question Bank</CardTitle>
                    <CardDescription>View and manage all questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                  {/* Filter */}
                  <div className="mb-6">
                    <Label htmlFor="filter-subject">Filter by Subject</Label>
                    <select
                      id="filter-subject"
                      className="w-full mt-1 p-2 border rounded-md bg-background max-w-xs"
                      value={filterSubject}
                      onChange={(e) => {
                        setFilterSubject(e.target.value);
                        fetchQuestions(e.target.value || undefined);
                      }}
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Questions List */}
                  {questionsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : questions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No questions found. Upload documents to generate questions.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                      {questions.map((question, index) => (
                        <div
                          key={question.id}
                          className="border rounded-lg bg-card overflow-hidden"
                        >
                          {editingQuestion?.id === question.id ? (
                            <div className="p-4 space-y-4">
                              <div>
                                <Label>Question Text</Label>
                                <Textarea
                                  value={editQuestionData.question_text}
                                  onChange={(e) =>
                                    setEditQuestionData({
                                      ...editQuestionData,
                                      question_text: e.target.value,
                                    })
                                  }
                                  rows={3}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Option A</Label>
                                  <Input
                                    value={editQuestionData.option_a}
                                    onChange={(e) =>
                                      setEditQuestionData({
                                        ...editQuestionData,
                                        option_a: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Option B</Label>
                                  <Input
                                    value={editQuestionData.option_b}
                                    onChange={(e) =>
                                      setEditQuestionData({
                                        ...editQuestionData,
                                        option_b: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Option C</Label>
                                  <Input
                                    value={editQuestionData.option_c}
                                    onChange={(e) =>
                                      setEditQuestionData({
                                        ...editQuestionData,
                                        option_c: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div>
                                  <Label>Option D</Label>
                                  <Input
                                    value={editQuestionData.option_d}
                                    onChange={(e) =>
                                      setEditQuestionData({
                                        ...editQuestionData,
                                        option_d: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                              <div>
                                <Label>Correct Answer</Label>
                                <select
                                  className="w-full p-2 border rounded-md bg-background"
                                  value={editQuestionData.correct_answer}
                                  onChange={(e) =>
                                    setEditQuestionData({
                                      ...editQuestionData,
                                      correct_answer: e.target.value,
                                    })
                                  }
                                >
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                </select>
                              </div>
                              <div>
                                <Label>Explanation (Optional)</Label>
                                <Textarea
                                  value={editQuestionData.explanation}
                                  onChange={(e) =>
                                    setEditQuestionData({
                                      ...editQuestionData,
                                      explanation: e.target.value,
                                    })
                                  }
                                  rows={2}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateQuestion(question.id)}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingQuestion(null)}
                                >
                                  <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                className="p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                                onClick={() =>
                                  setExpandedQuestion(
                                    expandedQuestion === question.id ? null : question.id
                                  )
                                }
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                                        Q{index + 1}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {question.subjects?.name}
                                      </span>
                                    </div>
                                    <p className="font-medium line-clamp-2">
                                      {question.question_text}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingQuestion(question);
                                      }}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-8 w-8 text-destructive hover:text-destructive"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Question?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete this question. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                    {expandedQuestion === question.id ? (
                                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              {expandedQuestion === question.id && (
                                <div className="px-4 pb-4 border-t bg-muted/30">
                                  <div className="pt-3 space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                      <div
                                        className={`p-2 rounded ${
                                          question.correct_answer === "A"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 border"
                                            : "bg-muted"
                                        }`}
                                      >
                                        <span className="font-semibold">A:</span> {question.option_a}
                                      </div>
                                      <div
                                        className={`p-2 rounded ${
                                          question.correct_answer === "B"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 border"
                                            : "bg-muted"
                                        }`}
                                      >
                                        <span className="font-semibold">B:</span> {question.option_b}
                                      </div>
                                      <div
                                        className={`p-2 rounded ${
                                          question.correct_answer === "C"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 border"
                                            : "bg-muted"
                                        }`}
                                      >
                                        <span className="font-semibold">C:</span> {question.option_c}
                                      </div>
                                      <div
                                        className={`p-2 rounded ${
                                          question.correct_answer === "D"
                                            ? "bg-green-100 dark:bg-green-900/30 border-green-500 border"
                                            : "bg-muted"
                                        }`}
                                      >
                                        <span className="font-semibold">D:</span> {question.option_d}
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      <span className="font-semibold">Correct Answer:</span>{" "}
                                      {question.correct_answer}
                                    </p>
                                    {question.explanation && (
                                      <p className="text-sm text-muted-foreground">
                                        <span className="font-semibold">Explanation:</span>{" "}
                                        {question.explanation}
                                      </p>
                                    )}
                                  </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advertisements Tab */}
            <TabsContent value="ads" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Advertisement</CardTitle>
                    <CardDescription>Add ads that will pop up on the homepage every 60 seconds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAd} className="space-y-4">
                      <div>
                        <Label htmlFor="ad-title">Ad Title *</Label>
                        <Input
                          id="ad-title"
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          placeholder="e.g., Gift Card Sale!"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="ad-image">Image URL (Optional)</Label>
                        <Input
                          id="ad-image"
                          value={adImageUrl}
                          onChange={(e) => setAdImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ad-content">Ad Content (Optional)</Label>
                        <Textarea
                          id="ad-content"
                          value={adContent}
                          onChange={(e) => setAdContent(e.target.value)}
                          placeholder="Describe your ad here..."
                          rows={4}
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <Megaphone className="h-4 w-4 mr-2" />
                        Create Advertisement
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Advertisements</CardTitle>
                    <CardDescription>Manage all advertisements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {advertisements.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No advertisements yet</p>
                      ) : (
                        advertisements.map((ad) => (
                          <div
                            key={ad.id}
                            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            {editingAd?.id === ad.id ? (
                              <div className="space-y-3">
                                <Input
                                  value={editAdTitle}
                                  onChange={(e) => setEditAdTitle(e.target.value)}
                                  placeholder="Ad title"
                                />
                                <Input
                                  value={editAdImageUrl}
                                  onChange={(e) => setEditAdImageUrl(e.target.value)}
                                  placeholder="Image URL"
                                />
                                <Textarea
                                  value={editAdContent}
                                  onChange={(e) => setEditAdContent(e.target.value)}
                                  placeholder="Ad content"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateAd(ad.id)}>
                                    <Check className="h-4 w-4 mr-1" /> Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingAd(null)}>
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <h3 className="font-medium">{ad.title}</h3>
                                    {ad.content && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {ad.content}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className={`text-xs px-2 py-1 rounded ${ad.is_active ? 'bg-green-500/20 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                                      {ad.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                </div>
                                {ad.image_url && (
                                  <img src={ad.image_url} alt={ad.title} className="w-full h-24 object-cover rounded mt-2" />
                                )}
                                <div className="flex gap-2 pt-2">
                                  <Button size="sm" variant="outline" onClick={() => handleToggleAdStatus(ad)}>
                                    {ad.is_active ? 'Deactivate' : 'Activate'}
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEditingAd(ad)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Advertisement?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete this advertisement.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteAd(ad.id)}
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
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
