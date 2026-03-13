import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText, Image, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EXAM_LEVELS = [
  { value: "JAMB / UTME", label: "JAMB / UTME" },
  { value: "WAEC / SSCE", label: "WAEC / SSCE" },
  { value: "NECO / SSCE", label: "NECO / SSCE" },
  { value: "NABTEB / SSCE", label: "NABTEB / SSCE" },
];

const ALL_SUBJECTS = [
  "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
  "Agricultural Science", "Economics", "Commerce", "Accounting",
  "Government", "Literature in English", "Christian Religious Knowledge",
  "Islamic Religious Knowledge", "History", "Geography", "Civic Education",
  "Computer Studies", "Igbo Language", "Yoruba Language", "Hausa Language",
  "French", "Arabic", "Fine Arts", "Technical Drawing"
];

const YEARS = Array.from({ length: 30 }, (_, i) => String(2025 - i));

interface UploadResult {
  questionsExtracted: number;
  preAnswered?: number;
  aiSolved?: number;
  error?: string;
}

export const PastQuestionUpload = () => {
  const { toast } = useToast();
  const [examLevel, setExamLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });
  const [result, setResult] = useState<UploadResult | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (selected.size > maxSize) {
        toast({ title: "File too large", description: "Maximum file size is 20MB", variant: "destructive" });
        return;
      }
      setFile(selected);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!examLevel || !subject || !year) {
      toast({ title: "Missing fields", description: "Please select exam type, subject, and year", variant: "destructive" });
      return;
    }

    if (mode === "file" && !file) {
      toast({ title: "No file", description: "Please select a file to upload", variant: "destructive" });
      return;
    }

    if (mode === "text" && !pastedText.trim()) {
      toast({ title: "No text", description: "Please paste your question text", variant: "destructive" });
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      let fileContent: string | null = null;
      let fileBase64: string | null = null;
      let fileType = "text";

      if (mode === "text") {
        fileContent = pastedText;
        setProgress({ stage: "Sending text to AI for extraction...", percent: 30 });
      } else if (file) {
        fileType = file.type || file.name.split(".").pop()?.toLowerCase() || "unknown";
        setProgress({ stage: "Reading file...", percent: 10 });

        if (fileType.includes("text") || file.name.endsWith(".txt")) {
          fileContent = await file.text();
          setProgress({ stage: "Sending text to AI for extraction...", percent: 30 });
        } else {
          // For PDF, images - convert to base64
          const buffer = await file.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          const chunkSize = 8192;
          for (let i = 0; i < bytes.length; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
            binary += String.fromCharCode(...chunk);
          }
          fileBase64 = btoa(binary);
          setProgress({ stage: "Sending file to AI for extraction...", percent: 30 });
        }
      }

      setProgress({ stage: "Extracting questions with AI...", percent: 50 });

      const { data, error } = await supabase.functions.invoke("extract-past-questions", {
        body: {
          examLevel,
          subject,
          year,
          textContent: fileContent,
          fileBase64,
          fileType: file?.type || "text/plain",
          fileName: file?.name || "pasted-text.txt",
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress({ stage: "Done!", percent: 100 });
      setResult({ questionsExtracted: data?.questionsExtracted || 0 });

      toast({
        title: "Upload Successful!",
        description: `${data?.questionsExtracted || 0} questions extracted and saved to the question bank.`,
      });

      // Reset form
      setFile(null);
      setPastedText("");
      // Reset file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setResult({ questionsExtracted: 0, error: err.message });
      toast({
        title: "Upload Failed",
        description: err.message || "Failed to process the file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({ stage: "", percent: 0 }), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Past Questions
          </CardTitle>
          <CardDescription>
            Upload JAMB, WAEC, NECO, or NABTEB past questions. Supports text files, PDFs, and images. 
            The AI will extract and convert them into structured questions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Exam Type *</Label>
              <Select value={examLevel} onValueChange={setExamLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_LEVELS.map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map(subj => (
                    <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "file" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("file")}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Upload File
            </Button>
            <Button
              type="button"
              variant={mode === "text" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("text")}
              className="gap-2"
            >
              <Image className="h-4 w-4" />
              Paste Text
            </Button>
          </div>

          {/* File Upload */}
          {mode === "file" && (
            <div className="space-y-2">
              <Label>Select File (PDF, Image, or Text)</Label>
              <Input
                type="file"
                accept=".txt,.text,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.gif,.docx,.doc,.rtf"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Paste Text */}
          {mode === "text" && (
            <div className="space-y-2">
              <Label>Paste Questions Text</Label>
              <Textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your past questions here... Include question numbers, options (A, B, C, D), and answers if available."
                rows={10}
                disabled={uploading}
              />
              {pastedText && (
                <p className="text-sm text-muted-foreground">
                  {pastedText.length} characters
                </p>
              )}
            </div>
          )}

          {/* Progress */}
          {uploading && progress.stage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {progress.stage}
                </span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} />
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`flex items-center gap-3 p-4 rounded-lg ${result.error ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-700'}`}>
              {result.error ? (
                <>
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Extraction Failed</p>
                    <p className="text-sm">{result.error}</p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{result.questionsExtracted} Questions Extracted & Saved!</p>
                    <p className="text-sm">Questions have been added to the {subject} ({examLevel}) question bank for {year}.</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading || (!file && !pastedText.trim()) || !examLevel || !subject || !year}
            className="w-full gap-2"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                Extract & Save Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
