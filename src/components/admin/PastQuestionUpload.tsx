import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, FileText, Image, CheckCircle, AlertCircle, X, File } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

interface FileUploadItem {
  file: File;
  subject: string;
  year: string; // empty = auto-detect
  status: "pending" | "processing" | "done" | "error";
  result?: {
    questionsExtracted: number;
    preAnswered?: number;
    aiSolved?: number;
    detectedYear?: string;
    error?: string;
  };
}

export const PastQuestionUpload = () => {
  const { toast } = useToast();
  const [examLevel, setExamLevel] = useState("");
  const [mode, setMode] = useState<"file" | "text" | "bulk">("file");

  // Single file mode
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ stage: "", percent: 0 });
  const [singleResult, setSingleResult] = useState<{ questionsExtracted: number; preAnswered?: number; aiSolved?: number; error?: string } | null>(null);

  // Bulk mode
  const [bulkFiles, setBulkFiles] = useState<FileUploadItem[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const maxSize = 20 * 1024 * 1024;
      if (selected.size > maxSize) {
        toast({ title: "File too large", description: "Maximum file size is 20MB", variant: "destructive" });
        return;
      }
      setFile(selected);
      setSingleResult(null);
    }
  };

  const handleBulkFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const maxSize = 20 * 1024 * 1024;
    const newItems: FileUploadItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.size > maxSize) {
        toast({ title: `${f.name} too large`, description: "Skipped — max 20MB", variant: "destructive" });
        continue;
      }
      // Try to guess subject from filename
      const guessedSubject = ALL_SUBJECTS.find(s =>
        f.name.toLowerCase().includes(s.toLowerCase().replace(/ /g, "")) ||
        f.name.toLowerCase().includes(s.toLowerCase())
      ) || "";

      newItems.push({
        file: f,
        subject: guessedSubject,
        year: "", // auto-detect
        status: "pending",
      });
    }

    setBulkFiles(prev => [...prev, ...newItems]);
    // Reset input
    e.target.value = "";
  };

  const removeBulkFile = (index: number) => {
    setBulkFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkFile = (index: number, updates: Partial<FileUploadItem>) => {
    setBulkFiles(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const processFile = async (fileItem: FileUploadItem): Promise<FileUploadItem["result"]> => {
    const f = fileItem.file;
    const fileTypeStr = f.type || f.name.split(".").pop()?.toLowerCase() || "unknown";

    let fileContent: string | null = null;

    if (fileTypeStr.includes("text") || f.name.endsWith(".txt")) {
      fileContent = await f.text();
    } else {
      // Upload file to storage first, then pass storage path to edge function
      const storagePath = `past-questions/${Date.now()}-${f.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, f, { contentType: f.type || "application/octet-stream" });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      // Call edge function with storage path instead of base64
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/extract-past-questions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
            "apikey": supabaseKey,
          },
          body: JSON.stringify({
            examLevel,
            subject: fileItem.subject,
            year: fileItem.year || undefined,
            storagePath,
            fileName: f.name,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `HTTP ${response.status}`);
        }

        var data = await response.json();
        if (data?.error) throw new Error(data.error);
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === "AbortError") {
          throw new Error("Request timed out. The file may be too large. Try splitting it into smaller files.");
        }
        throw fetchErr;
      }

      return {
        questionsExtracted: data?.questionsExtracted || 0,
        preAnswered: data?.preAnswered,
        aiSolved: data?.aiSolved,
        detectedYear: data?.detectedYear,
      };
    }

    // Text content path - use supabase.functions.invoke (small payload)
    const { data, error } = await supabase.functions.invoke("extract-past-questions", {
      body: { examLevel, subject: fileItem.subject, year: fileItem.year || undefined, textContent: fileContent, fileName: f.name },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return {
      questionsExtracted: data?.questionsExtracted || 0,
      preAnswered: data?.preAnswered,
      aiSolved: data?.aiSolved,
      detectedYear: data?.detectedYear,
    };
  };

  // Single file upload
  const handleSingleUpload = async () => {
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
    setSingleResult(null);

    try {
      setProgress({ stage: "Preparing content...", percent: 20 });

      if (mode === "text") {
        const { data, error } = await supabase.functions.invoke("extract-past-questions", {
          body: { examLevel, subject, year, textContent: pastedText },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setProgress({ stage: "Done!", percent: 100 });
        setSingleResult({ questionsExtracted: data?.questionsExtracted || 0, preAnswered: data?.preAnswered, aiSolved: data?.aiSolved });
        toast({ title: "Upload Successful!", description: `${data?.questionsExtracted || 0} questions extracted and saved.` });
        setPastedText("");
        setUploading(false);
        setTimeout(() => setProgress({ stage: "", percent: 0 }), 3000);
        return;
      }

      const result = await processFile({
        file: file!,
        subject,
        year,
        status: "pending",
      });

      setProgress({ stage: "Done!", percent: 100 });
      setSingleResult(result!);
      toast({ title: "Upload Successful!", description: `${result?.questionsExtracted || 0} questions extracted and saved.` });
      setFile(null);
      setPastedText("");
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error("Upload error:", err);
      setSingleResult({ questionsExtracted: 0, error: err.message });
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress({ stage: "", percent: 0 }), 3000);
    }
  };

  // Bulk upload
  const handleBulkUpload = async () => {
    if (!examLevel) {
      toast({ title: "Missing exam type", description: "Please select an exam type first", variant: "destructive" });
      return;
    }
    const pendingFiles = bulkFiles.filter(f => f.status === "pending" && f.subject);
    if (pendingFiles.length === 0) {
      toast({ title: "No files ready", description: "Add files and assign subjects to each one", variant: "destructive" });
      return;
    }

    setBulkProcessing(true);
    setBulkProgress({ current: 0, total: pendingFiles.length });

    let totalExtracted = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const item = bulkFiles[i];
      if (item.status !== "pending" || !item.subject) continue;

      updateBulkFile(i, { status: "processing" });
      setBulkProgress(prev => ({ ...prev, current: prev.current + 1 }));

      try {
        const result = await processFile(item);
        updateBulkFile(i, { status: "done", result });
        totalExtracted += result?.questionsExtracted || 0;
      } catch (err: any) {
        updateBulkFile(i, { status: "error", result: { questionsExtracted: 0, error: err.message } });
      }
    }

    setBulkProcessing(false);
    toast({
      title: "Bulk Upload Complete",
      description: `Processed ${pendingFiles.length} files. ${totalExtracted} total questions extracted.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Exam Type (shared) */}
      <div className="space-y-2">
        <Label>Exam Type *</Label>
        <Select value={examLevel} onValueChange={setExamLevel}>
          <SelectTrigger>
            <SelectValue placeholder="Select exam type" />
          </SelectTrigger>
          <SelectContent>
            {EXAM_LEVELS.map(level => (
              <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button type="button" variant={mode === "file" ? "default" : "outline"} size="sm" onClick={() => setMode("file")} className="gap-2">
          <FileText className="h-4 w-4" /> Single File
        </Button>
        <Button type="button" variant={mode === "text" ? "default" : "outline"} size="sm" onClick={() => setMode("text")} className="gap-2">
          <Image className="h-4 w-4" /> Paste Text
        </Button>
        <Button type="button" variant={mode === "bulk" ? "default" : "outline"} size="sm" onClick={() => setMode("bulk")} className="gap-2">
          <Upload className="h-4 w-4" /> Bulk Upload
        </Button>
      </div>

      {/* ===== SINGLE FILE MODE ===== */}
      {mode === "file" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map(subj => (<SelectItem key={subj} value={subj}>{subj}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Select File (PDF, Image, or Text)</Label>
            <Input type="file" accept=".txt,.text,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.gif,.docx,.doc,.rtf" onChange={handleFileChange} disabled={uploading} />
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          </div>
          <ResultDisplay result={singleResult} subject={subject} examLevel={examLevel} year={year} />
          {uploading && progress.stage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{progress.stage}</span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} />
            </div>
          )}
          <Button onClick={handleSingleUpload} disabled={uploading || !file || !examLevel || !subject || !year} className="w-full gap-2" size="lg">
            {uploading ? <><Loader2 className="h-5 w-5 animate-spin" />Processing...</> : <><Upload className="h-5 w-5" />Extract & Save Questions</>}
          </Button>
        </div>
      )}

      {/* ===== PASTE TEXT MODE ===== */}
      {mode === "text" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {ALL_SUBJECTS.map(subj => (<SelectItem key={subj} value={subj}>{subj}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEARS.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Paste Questions Text</Label>
            <Textarea value={pastedText} onChange={(e) => setPastedText(e.target.value)} placeholder="Paste your past questions here..." rows={10} disabled={uploading} />
            {pastedText && <p className="text-sm text-muted-foreground">{pastedText.length} characters</p>}
          </div>
          <ResultDisplay result={singleResult} subject={subject} examLevel={examLevel} year={year} />
          {uploading && progress.stage && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{progress.stage}</span>
                <span>{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} />
            </div>
          )}
          <Button onClick={handleSingleUpload} disabled={uploading || !pastedText.trim() || !examLevel || !subject || !year} className="w-full gap-2" size="lg">
            {uploading ? <><Loader2 className="h-5 w-5 animate-spin" />Processing...</> : <><Upload className="h-5 w-5" />Extract & Save Questions</>}
          </Button>
        </div>
      )}

      {/* ===== BULK UPLOAD MODE ===== */}
      {mode === "bulk" && (
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">📚 Bulk Upload Mode</p>
            <p>Upload multiple PDFs at once. Assign a subject per file — the AI will auto-detect the year from the document content and filename. You can also manually set the year.</p>
          </div>

          <div className="space-y-2">
            <Label>Add Files (PDF, Images, Text)</Label>
            <Input type="file" accept=".txt,.text,.pdf,.jpg,.jpeg,.png,.webp,.bmp,.gif" multiple onChange={handleBulkFileChange} disabled={bulkProcessing} />
          </div>

          {bulkFiles.length > 0 && (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {bulkFiles.map((item, idx) => (
                <div key={idx} className={`p-3 rounded-lg border space-y-2 ${
                  item.status === "done" ? "border-green-500/30 bg-green-500/5" :
                  item.status === "error" ? "border-destructive/30 bg-destructive/5" :
                  item.status === "processing" ? "border-primary/30 bg-primary/5" :
                  "border-border"
                }`}>
                  <div className="flex items-center gap-2">
                    {item.status === "processing" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    ) : item.status === "done" ? (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    ) : item.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    ) : (
                      <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium truncate flex-1">{item.file.name}</span>
                    <span className="text-xs text-muted-foreground">{(item.file.size / 1024).toFixed(0)} KB</span>
                    {item.status === "pending" && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeBulkFile(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {item.status === "pending" && (
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={item.subject} onValueChange={(v) => updateBulkFile(idx, { subject: v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Subject *" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_SUBJECTS.map(subj => (<SelectItem key={subj} value={subj}>{subj}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <Select value={item.year} onValueChange={(v) => updateBulkFile(idx, { year: v === "auto" ? "" : v })}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Auto-detect year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🤖 Auto-detect year</SelectItem>
                          {YEARS.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {item.result && !item.result.error && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700">{item.result.questionsExtracted} questions</Badge>
                      {item.result.detectedYear && <Badge variant="outline">Year: {item.result.detectedYear}</Badge>}
                      {item.result.preAnswered ? <Badge variant="outline">{item.result.preAnswered} pre-answered</Badge> : null}
                      {item.result.aiSolved ? <Badge variant="outline">{item.result.aiSolved} AI-solved</Badge> : null}
                    </div>
                  )}
                  {item.result?.error && (
                    <p className="text-xs text-destructive">{item.result.error}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {bulkProcessing && bulkProgress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing files...</span>
                <span>{bulkProgress.current}/{bulkProgress.total}</span>
              </div>
              <Progress value={(bulkProgress.current / bulkProgress.total) * 100} />
            </div>
          )}

          <Button
            onClick={handleBulkUpload}
            disabled={bulkProcessing || !examLevel || bulkFiles.filter(f => f.status === "pending" && f.subject).length === 0}
            className="w-full gap-2"
            size="lg"
          >
            {bulkProcessing ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Processing {bulkProgress.current}/{bulkProgress.total}...</>
            ) : (
              <><Upload className="h-5 w-5" />Extract All ({bulkFiles.filter(f => f.status === "pending" && f.subject).length} files)</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Sub-component for result display
const ResultDisplay = ({ result, subject, examLevel, year }: { result: any; subject: string; examLevel: string; year: string }) => {
  if (!result) return null;
  return (
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
            <p className="text-sm">Added to {subject} ({examLevel}) bank for {year}.</p>
            {(result.preAnswered !== undefined || result.aiSolved !== undefined) && (
              <p className="text-xs mt-1 text-muted-foreground">
                {result.preAnswered ? `${result.preAnswered} pre-answered` : ""}
                {result.preAnswered && result.aiSolved ? " • " : ""}
                {result.aiSolved ? `${result.aiSolved} solved by AI` : ""}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
