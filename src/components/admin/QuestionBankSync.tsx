import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Database, Loader2, CheckCircle, XCircle, Zap, AlertTriangle, Upload, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PastQuestionUpload } from "./PastQuestionUpload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CacheStats {
  exam_level: string;
  subject: string;
  question_count: number;
}

interface FetchResult {
  subject: string;
  fetched: number;
  newStored: number;
  totalCached: number;
  error?: string;
}

const ALL_SUBJECTS = [
  "Use of English", "Mathematics", "Physics", "Chemistry", "Biology",
  "Agricultural Science", "Economics", "Commerce", "Accounting",
  "Government", "Literature in English", "Christian Religious Knowledge",
  "Islamic Religious Knowledge", "History", "Geography", "Civic Education",
  "Computer Studies", "Igbo Language", "Yoruba Language", "Hausa Language",
  "French", "Arabic", "Fine Arts", "Technical Drawing"
];

const LEVELS = ["JAMB / UTME", "WAEC / SSCE", "NECO / SSCE", "NABTEB / SSCE"];
const TARGET_MIN_QUESTIONS = 2000;

export const QuestionBankSync = () => {
  const { toast } = useToast();
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0, subject: "" });
  const [fetchResults, setFetchResults] = useState<FetchResult[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("JAMB / UTME");
  const [totalQuestions, setTotalQuestions] = useState(0);

  const fetchCacheStats = useCallback(async () => {
    setLoading(true);
    try {
      // Use individual count queries per subject to avoid 1000 row limit
      const statsPromises = ALL_SUBJECTS.map(async (subject) => {
        const results: CacheStats[] = [];
        for (const level of LEVELS) {
          const { count } = await supabase
            .from("cached_api_questions")
            .select("*", { count: "exact", head: true })
            .eq("exam_level", level)
            .eq("subject", subject);
          if (count && count > 0) {
            results.push({ exam_level: level, subject, question_count: count });
          }
        }
        return results;
      });

      const allResults = await Promise.all(statsPromises);
      const stats = allResults.flat();
      stats.sort((a, b) => a.exam_level.localeCompare(b.exam_level) || a.question_count - b.question_count);
      setCacheStats(stats);
      setTotalQuestions(stats.reduce((sum, s) => sum + s.question_count, 0));
    } catch (error: any) {
      console.error("Error fetching cache stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheStats();
  }, [fetchCacheStats]);

  // Fetch one subject at a time
  const fetchSubject = async (subject: string, level: string, useBulk: boolean): Promise<FetchResult> => {
    try {
      const fnName = useBulk ? "bulk-fetch-questions" : "sync-questions";
      const body: any = { subject, level, targetMin: TARGET_MIN_QUESTIONS };
      if (useBulk) {
        body.startYear = 2001;
        body.endYear = 2025;
      }
      
      const { data, error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      return {
        subject: data?.subject || subject,
        fetched: data?.fetched || 0,
        newStored: data?.newStored || 0,
        totalCached: data?.totalCached || 0,
      };
    } catch (err: any) {
      return { subject, fetched: 0, newStored: 0, totalCached: 0, error: err.message };
    }
  };

  // Fetch priority subjects (those below threshold)
  const fetchPrioritySubjects = async () => {
    const level = selectedLevel === "all" ? "JAMB / UTME" : selectedLevel;
    const threshold = TARGET_MIN_QUESTIONS;
    
    // Find subjects below threshold (start from lowest)
    const lowSubjects = ALL_SUBJECTS
      .map(subject => {
        const stat = cacheStats.find(s => s.exam_level === level && s.subject === subject);
        return { subject, count: stat?.question_count || 0 };
      })
      .filter(item => item.count < threshold)
      .sort((a, b) => a.count - b.count)
      .map(item => item.subject);

    if (lowSubjects.length === 0) {
      toast({ title: "All Good", description: `All subjects have ${TARGET_MIN_QUESTIONS.toLocaleString()}+ questions.` });
      return;
    }

    setFetching(true);
    setFetchResults([]);
    setFetchProgress({ current: 0, total: lowSubjects.length, subject: "" });

    const results: FetchResult[] = [];
    for (let i = 0; i < lowSubjects.length; i++) {
      const subj = lowSubjects[i];
      setFetchProgress({ current: i + 1, total: lowSubjects.length, subject: subj });
      
      const result = await fetchSubject(subj, level, true);
      results.push(result);
      setFetchResults([...results]);
    }

    toast({
      title: "Priority Fetch Complete",
      description: `Processed ${lowSubjects.length} subjects. ${results.reduce((s, r) => s + r.newStored, 0)} new questions added.`,
    });

    await fetchCacheStats();
    setFetching(false);
  };

  // Fetch ALL subjects (starting from lowest count)
  const fetchAllSubjects = async () => {
    const level = selectedLevel === "all" ? "JAMB / UTME" : selectedLevel;
    const subjectsByCount = [...ALL_SUBJECTS].sort((a, b) => {
      const aCount = cacheStats.find(s => s.exam_level === level && s.subject === a)?.question_count || 0;
      const bCount = cacheStats.find(s => s.exam_level === level && s.subject === b)?.question_count || 0;
      return aCount - bCount;
    });
    
    setFetching(true);
    setFetchResults([]);
    setFetchProgress({ current: 0, total: subjectsByCount.length, subject: "" });

    const results: FetchResult[] = [];
    for (let i = 0; i < subjectsByCount.length; i++) {
      const subj = subjectsByCount[i];
      setFetchProgress({ current: i + 1, total: subjectsByCount.length, subject: subj });
      
      const result = await fetchSubject(subj, level, true);
      results.push(result);
      setFetchResults([...results]);
    }

    toast({
      title: "Bulk Fetch Complete!",
      description: `Processed all ${subjectsByCount.length} subjects (low to high). ${results.reduce((s, r) => s + r.newStored, 0)} new questions added.`,
    });

    await fetchCacheStats();
    setFetching(false);
  };

  // Sync single subject (quick refresh)
  const syncSingleSubject = async (subject: string) => {
    const level = selectedLevel === "all" ? "JAMB / UTME" : selectedLevel;
    setFetching(true);
    setFetchProgress({ current: 1, total: 1, subject });
    
    const result = await fetchSubject(subject, level, true);
    setFetchResults([result]);
    
    toast({
      title: result.error ? "Fetch Failed" : "Fetch Complete",
      description: result.error || `${subject}: +${result.newStored} new (total: ${result.totalCached})`,
      variant: result.error ? "destructive" : "default",
    });

    await fetchCacheStats();
    setFetching(false);
  };

  const filteredStats = selectedLevel === "all"
    ? cacheStats
    : cacheStats.filter(s => s.exam_level === selectedLevel);

  const getStatusColor = (count: number) => {
    if (count >= TARGET_MIN_QUESTIONS) return "bg-green-500";
    if (count >= 500) return "bg-yellow-500";
    return "bg-red-500";
  };

  const lowCountSubjects = ALL_SUBJECTS
    .map(subject => {
      const level = selectedLevel === "all" ? "JAMB / UTME" : selectedLevel;
      const stat = cacheStats.find(s => s.exam_level === level && s.subject === subject);
      return { subject, count: stat?.question_count || 0 };
    })
    .filter(item => item.count < TARGET_MIN_QUESTIONS)
    .sort((a, b) => a.count - b.count)
    .map(item => item.subject);

  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="space-y-6">
      {/* Upload Past Questions Section */}
      <Collapsible open={showUpload} onOpenChange={setShowUpload}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Upload Past Questions (JAMB / WAEC / NECO / NABTEB)</CardTitle>
                    <CardDescription className="mt-1">
                      Upload PDFs, images, or paste text — AI extracts & solves questions automatically
                    </CardDescription>
                  </div>
                </div>
                {showUpload ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <PastQuestionUpload />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Question Bank Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Question Bank
              </CardTitle>
              <CardDescription>
                {totalQuestions.toLocaleString()} total questions cached across all exam levels
              </CardDescription>
            </div>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVELS.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {lowCountSubjects.length > 0 && !fetching && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{lowCountSubjects.length} subjects have fewer than {TARGET_MIN_QUESTIONS.toLocaleString()} questions</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-6">
            {lowCountSubjects.length > 0 && (
              <Button onClick={fetchPrioritySubjects} disabled={fetching} variant="destructive" className="gap-2">
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Fetch Priority ({lowCountSubjects.length} subjects)
              </Button>
            )}
            <Button onClick={fetchAllSubjects} disabled={fetching} className="gap-2 bg-green-600 hover:bg-green-700">
              {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Bulk Fetch All Subjects
            </Button>
            <Button onClick={fetchCacheStats} disabled={loading || fetching} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>

          {fetching && fetchProgress.total > 0 && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Fetching: <strong>{fetchProgress.subject}</strong></span>
                <span>{fetchProgress.current}/{fetchProgress.total}</span>
              </div>
              <Progress value={(fetchProgress.current / fetchProgress.total) * 100} />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredStats.length === 0 && !fetching ? (
            <p className="text-center text-muted-foreground py-8">
              No cached questions yet. Click "Bulk Fetch All Subjects" to start filling toward {TARGET_MIN_QUESTIONS.toLocaleString()}+ per subject.
            </p>
          ) : (
            <div className="space-y-4">
              {LEVELS.filter(l => selectedLevel === "all" || l === selectedLevel).map(level => {
                const levelStats = filteredStats.filter(s => s.exam_level === level);
                if (levelStats.length === 0 && selectedLevel !== "all" && selectedLevel !== level) return null;
                const levelTotal = levelStats.reduce((sum, s) => sum + s.question_count, 0);

                // Show all subjects for this level, even those with 0
                const allSubjectsForLevel = ALL_SUBJECTS.map(subj => {
                  const stat = levelStats.find(s => s.subject === subj);
                  return { exam_level: level, subject: subj, question_count: stat?.question_count || 0 };
                });

                if (selectedLevel !== "all" && selectedLevel !== level) return null;

                return (
                  <div key={level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{level}</h3>
                      <Badge variant="secondary">{levelTotal.toLocaleString()} questions</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {allSubjectsForLevel.map(stat => (
                        <div
                          key={`${stat.exam_level}-${stat.subject}`}
                          className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => !fetching && syncSingleSubject(stat.subject)}
                          title={`Click to fetch ${stat.subject}`}
                        >
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(stat.question_count)}`} />
                          <span className="truncate flex-1">{stat.subject}</span>
                          <span className={`font-mono text-xs font-semibold ${stat.question_count < TARGET_MIN_QUESTIONS ? 'text-destructive' : ''}`}>
                            {stat.question_count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {fetchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fetch Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {fetchResults.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                  {result.error ? (
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">{result.subject}</span>
                  {result.error ? (
                    <span className="text-xs text-destructive truncate max-w-[200px]">{result.error}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      +{result.newStored} new (total: {result.totalCached})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
