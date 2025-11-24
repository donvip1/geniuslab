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
import { Upload, FileText, BookOpen, Users, Loader2 } from "lucide-react";

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Subject Management State
  const [subjectName, setSubjectName] = useState("");
  const [subjectDescription, setSubjectDescription] = useState("");
  const [subjects, setSubjects] = useState<any[]>([]);

  // Document Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

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
      fetchSubjects();
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
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="subjects">
                <BookOpen className="h-4 w-4 mr-2" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="questions">
                <FileText className="h-4 w-4 mr-2" />
                Questions
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
                          placeholder="e.g., Mathematics"
                          required
                        />
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
                      <Button type="submit" className="w-full">
                        Create Subject
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Existing Subjects</CardTitle>
                    <CardDescription>All subjects in the system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {subjects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No subjects yet</p>
                      ) : (
                        subjects.map((subject) => (
                          <div
                            key={subject.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                          >
                            <h3 className="font-medium">{subject.name}</h3>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {subject.description}
                              </p>
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
                        className="w-full mt-1 p-2 border rounded-md"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        required
                      >
                        <option value="">Choose a subject...</option>
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="file-upload">Upload Document</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Supported formats: PDF, Word (.doc, .docx), Images (.jpg, .png) for handwritten notes
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
              <Card>
                <CardHeader>
                  <CardTitle>Question Bank</CardTitle>
                  <CardDescription>View and manage all generated questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Question management interface coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Admin;
