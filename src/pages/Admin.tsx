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
import { Upload, FileText, BookOpen, Loader2, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, ClipboardPaste, Megaphone, Users, Star, Clock, BarChart3, UserX, Key, Database, FileUp } from "lucide-react";
import { TeamExpertManagement } from "@/components/admin/TeamExpertManagement";
import { SuccessStoryManagement } from "@/components/admin/SuccessStoryManagement";
import { ExamModeManagement } from "@/components/admin/ExamModeManagement";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { UserManagement } from "@/components/admin/UserManagement";
import { AccessPinManagement } from "@/components/admin/AccessPinManagement";
import { QuestionBankSync } from "@/components/admin/QuestionBankSync";
import { PastQuestionUpload } from "@/components/admin/PastQuestionUpload";
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
  link_url: string | null;
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
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adUploading, setAdUploading] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [editAdTitle, setEditAdTitle] = useState("");
  const [editAdContent, setEditAdContent] = useState("");
  const [editAdImageUrl, setEditAdImageUrl] = useState("");
  const [editAdLinkUrl, setEditAdLinkUrl] = useState("");
  const [editAdImageFile, setEditAdImageFile] = useState<File | null>(null);

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
  const [bulkImportProgress, setBulkImportProgress] = useState({ stage: "", percent: 0 });

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
  const uploadAdImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("advertisements")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("advertisements")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

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

    setAdUploading(true);

    try {
      let finalImageUrl = adImageUrl || null;

      // If file is selected, upload it
      if (adImageFile) {
        const uploadedUrl = await uploadAdImage(adImageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setAdUploading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("advertisements")
        .insert([
          {
            title: adTitle,
            content: adContent || null,
            image_url: finalImageUrl,
            link_url: adLinkUrl || null,
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
        setAdLinkUrl("");
        setAdImageFile(null);
        fetchAdvertisements();
      }
    } catch (error) {
      console.error("Error creating ad:", error);
      toast({
        title: "Error",
        description: "Failed to create advertisement",
        variant: "destructive",
      });
    } finally {
      setAdUploading(false);
    }
  };

  const handleUpdateAd = async (adId: string) => {
    setAdUploading(true);

    try {
      let finalImageUrl = editAdImageUrl || null;

      // If file is selected, upload it
      if (editAdImageFile) {
        const uploadedUrl = await uploadAdImage(editAdImageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          toast({
            title: "Error",
            description: "Failed to upload image",
            variant: "destructive",
          });
          setAdUploading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("advertisements")
        .update({
          title: editAdTitle,
          content: editAdContent || null,
          image_url: finalImageUrl,
          link_url: editAdLinkUrl || null,
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
        setEditAdImageFile(null);
        fetchAdvertisements();
      }
    } catch (error) {
      console.error("Error updating ad:", error);
      toast({
        title: "Error",
        description: "Failed to update advertisement",
        variant: "destructive",
      });
    } finally {
      setAdUploading(false);
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
    setEditAdLinkUrl(ad.link_url || "");
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
    setBulkImportProgress({ stage: "Analyzing text...", percent: 10 });

    // Estimate question count from text (rough estimate: ~150 chars per question)
    const estimatedQuestions = Math.ceil(bulkImportText.length / 150);

    try {
      // Simulate progress stages
      const progressInterval = setInterval(() => {
        setBulkImportProgress(prev => {
          if (prev.percent < 30) return { stage: "Analyzing text structure...", percent: prev.percent + 5 };
          if (prev.percent < 60) return { stage: `Extracting ~${estimatedQuestions} questions...`, percent: prev.percent + 3 };
          if (prev.percent < 85) return { stage: "Processing with AI...", percent: prev.percent + 2 };
          return { stage: "Saving to database...", percent: Math.min(prev.percent + 1, 90) };
        });
      }, 800);

      // Use AI to parse the bulk text into questions
      const { data, error } = await supabase.functions.invoke("process-bulk-questions", {
        body: {
          text: bulkImportText,
          subjectId: bulkImportSubject,
          userId: user.id,
        },
      });

      clearInterval(progressInterval);
      setBulkImportProgress({ stage: "Finalizing...", percent: 95 });

      // Handle edge function errors with detailed messages
      if (error) {
        console.error("Bulk import edge function error:", error);
        // Try to extract error details from the response
        let errorMessage = "Failed to import questions. Please try again.";
        if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // Check if data contains an error (edge function returned error in body)
      if (data?.error) {
        console.error("Bulk import returned error:", data);
        throw new Error(data.error);
      }

      // Success with detailed feedback
      const skippedMsg = data.skippedInvalid > 0 
        ? ` (${data.skippedInvalid} invalid questions skipped)` 
        : "";
      
      toast({
        title: "Questions Imported Successfully",
        description: `${data.questionsCreated} questions imported${skippedMsg}`,
      });

      setBulkImportText("");
      setShowBulkImport(false);
      fetchQuestions(filterSubject || undefined);
    } catch (error: any) {
      console.error("Bulk import error:", error);
      
      // Parse error message for user-friendly display
      let title = "Import Failed";
      let description = error.message || "An unexpected error occurred while importing questions.";
      
      // Handle specific error codes from edge function
      if (description.includes("TIMEOUT") || description.includes("too long")) {
        title = "Upload Timeout";
        description = "The request took too long. Try uploading 40-50 questions at a time instead.";
      } else if (description.includes("NO_QUESTIONS_FOUND") || description.includes("No questions")) {
        title = "No Questions Found";
        description = "Could not find any questions in the text. Please ensure questions are numbered (e.g., 1. Question text) or clearly formatted.";
      } else if (description.includes("non-2xx") || description.includes("FunctionsHttpError")) {
        title = "Server Error";
        description = "The server encountered an error. Try uploading fewer questions (40-50 at a time) or check your text format.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setBulkImporting(false);
      setBulkImportProgress({ stage: "", percent: 0 });
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

      // Handle edge function errors
      if (processError) {
        console.error("Document process edge function error:", processError);
        let errorMessage = "Failed to process document. Please try again.";
        if (processError.message) {
          errorMessage = processError.message;
        }
        throw new Error(errorMessage);
      }

      // Check if data contains an error
      if (processData?.error) {
        console.error("Document process returned error:", processData);
        throw new Error(processData.error);
      }

      toast({
        title: "Document Processed Successfully",
        description: `${processData.questionsGenerated} questions created from the document.`,
      });

      setSelectedFile(null);
      setSelectedSubject("");
      setUploadProgress("");
      fetchQuestions(filterSubject || undefined);
    } catch (error: any) {
      console.error("Upload error:", error);
      
      // Parse error for user-friendly display
      let title = "Upload Failed";
      let description = error.message || "An unexpected error occurred while processing the document.";
      
      if (description.includes("non-2xx") || description.includes("FunctionsHttpError")) {
        title = "Server Error";
        description = "The server encountered an error processing your document. The file may be too large or in an unsupported format.";
      } else if (description.includes("storage") || description.includes("upload")) {
        title = "Upload Error";
        description = "Failed to upload the file. Please check your file size and try again.";
      }
      
      toast({
        title,
        description,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress("");
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
            <TabsList className="grid w-full grid-cols-12 max-w-6xl">
              <TabsTrigger value="subjects">
                <BookOpen className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Subjects</span>
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="questions" onClick={() => fetchQuestions()}>
                <FileText className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Questions</span>
              </TabsTrigger>
              <TabsTrigger value="exammode">
                <Clock className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Exam Mode</span>
              </TabsTrigger>
              <TabsTrigger value="pins">
                <Key className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">PINs</span>
              </TabsTrigger>
              <TabsTrigger value="users">
                <UserX className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="ads">
                <Megaphone className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Ads</span>
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="stories">
                <Star className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Stories</span>
              </TabsTrigger>
              <TabsTrigger value="questionbank">
                <Database className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Q-Bank</span>
              </TabsTrigger>
              <TabsTrigger value="pastquestions">
                <FileUp className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Past Q</span>
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Analytics</span>
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

                        {bulkImporting && bulkImportProgress.stage && (
                          <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{bulkImportProgress.stage}</span>
                              <span className="font-medium">{bulkImportProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-primary h-full transition-all duration-500 ease-out"
                                style={{ width: `${bulkImportProgress.percent}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <Button type="submit" disabled={bulkImporting} className="w-full">
                          {bulkImporting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              {bulkImportProgress.stage || "Importing Questions..."}
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
                          onChange={(e) => {
                            setAdImageUrl(e.target.value);
                            if (e.target.value) setAdImageFile(null);
                          }}
                          placeholder="https://example.com/image.jpg"
                          disabled={!!adImageFile}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ad-image-upload">Or Upload Image</Label>
                        <Input
                          id="ad-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setAdImageFile(file);
                            if (file) setAdImageUrl("");
                          }}
                          className="mt-1"
                        />
                        {adImageFile && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{adImageFile.name}</span>
                            <Button type="button" size="sm" variant="ghost" onClick={() => setAdImageFile(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="ad-link">Link URL (Optional)</Label>
                        <Input
                          id="ad-link"
                          value={adLinkUrl}
                          onChange={(e) => setAdLinkUrl(e.target.value)}
                          placeholder="https://example.com/learn-more"
                          type="url"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Add a link to make the ad clickable</p>
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
                      <Button type="submit" className="w-full" disabled={adUploading}>
                        {adUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Megaphone className="h-4 w-4 mr-2" />
                            Create Advertisement
                          </>
                        )}
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
                                  onChange={(e) => {
                                    setEditAdImageUrl(e.target.value);
                                    if (e.target.value) setEditAdImageFile(null);
                                  }}
                                  placeholder="Image URL"
                                  disabled={!!editAdImageFile}
                                />
                                <div>
                                  <Label className="text-xs">Or Upload New Image</Label>
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0] || null;
                                      setEditAdImageFile(file);
                                      if (file) setEditAdImageUrl("");
                                    }}
                                    className="mt-1"
                                  />
                                  {editAdImageFile && (
                                    <div className="mt-1 flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{editAdImageFile.name}</span>
                                      <Button type="button" size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditAdImageFile(null)}>
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                <Input
                                  value={editAdLinkUrl}
                                  onChange={(e) => setEditAdLinkUrl(e.target.value)}
                                  placeholder="Link URL (optional)"
                                  type="url"
                                />
                                <Textarea
                                  value={editAdContent}
                                  onChange={(e) => setEditAdContent(e.target.value)}
                                  placeholder="Ad content"
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateAd(ad.id)} disabled={adUploading}>
                                    {adUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                                    {adUploading ? "Saving..." : "Save"}
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingAd(null); setEditAdImageFile(null); }}>
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
                                {ad.link_url && (
                                  <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                    🔗 {ad.link_url.length > 30 ? ad.link_url.substring(0, 30) + '...' : ad.link_url}
                                  </a>
                                )}
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

            {/* Exam Mode Tab */}
            <TabsContent value="exammode">
              <ExamModeManagement />
            </TabsContent>

            {/* Access PINs Tab */}
            <TabsContent value="pins">
              <AccessPinManagement />
            </TabsContent>

            {/* User Management Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            {/* Team Experts Tab */}
            <TabsContent value="team">
              <TeamExpertManagement />
            </TabsContent>

            {/* Success Stories Tab */}
            <TabsContent value="stories">
              <SuccessStoryManagement />
            </TabsContent>

            {/* Question Bank Sync Tab */}
            <TabsContent value="questionbank">
              <QuestionBankSync />
            </TabsContent>

            {/* Past Questions Upload Tab */}
            <TabsContent value="pastquestions">
              <PastQuestionUpload />
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AnalyticsDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
