import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Database, Loader2, CheckCircle, XCircle, Zap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CacheStats {
  exam_level: string;
  subject: string;
  question_count: number;
}

interface SyncResult {
  level?: string;
  subject: string;
  fetched: number;
  newStored: number;
  totalCached: number;
  error?: string;
}

const LEVELS = ["JAMB / UTME", "WAEC / SSCE", "NECO / SSCE", "NABTEB / SSCE"];

export const QuestionBankSync = () => {
  const { toast } = useToast();
  const [cacheStats, setCacheStats] = useState<CacheStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [bulkFetching, setBulkFetching] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    fetchCacheStats();
  }, []);

  const fetchCacheStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cached_api_questions")
        .select("exam_level, subject");

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((row: any) => {
        const key = `${row.exam_level}|||${row.subject}`;
        counts[key] = (counts[key] || 0) + 1;
      });

      const stats = Object.entries(counts).map(([key, count]) => {
        const [exam_level, subject] = key.split("|||");
        return { exam_level, subject, question_count: count };
      });

      stats.sort((a, b) => a.exam_level.localeCompare(b.exam_level) || a.subject.localeCompare(b.subject));
      setCacheStats(stats);
      setTotalQuestions(stats.reduce((sum, s) => sum + s.question_count, 0));
    } catch (error: any) {
      console.error("Error fetching cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerSync = async (level?: string) => {
    setSyncing(true);
    setSyncResults([]);
    try {
      const body: any = {};
      if (level && level !== "all") body.level = level;

      const { data, error } = await supabase.functions.invoke("sync-questions", { body });
      if (error) throw error;

      if (data?.results) {
        setSyncResults(data.results);
        const totalNew = data.results.reduce((sum: number, r: SyncResult) => sum + (r.newStored || 0), 0);
        toast({
          title: "Sync Complete",
          description: `${totalNew} new questions stored.`,
        });
      }
      await fetchCacheStats();
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const triggerBulkFetch = async () => {
    setBulkFetching(true);
    setSyncResults([]);
    toast({
      title: "Bulk Fetch Started",
      description: "Fetching from ALOC API (15 years × 24 subjects). This may take several minutes...",
    });
    try {
      const { data, error } = await supabase.functions.invoke("bulk-fetch-questions", {
        body: { level: selectedLevel === "all" ? "JAMB / UTME" : selectedLevel },
      });
      if (error) throw error;

      if (data?.results) {
        setSyncResults(data.results);
        toast({
          title: "Bulk Fetch Complete!",
          description: `${data.totalNew || 0} new questions added. Grand total: ${data.grandTotal || 0}`,
        });
      }
      await fetchCacheStats();
    } catch (error: any) {
      toast({ title: "Bulk Fetch Failed", description: error.message, variant: "destructive" });
    } finally {
      setBulkFetching(false);
    }
  };

  const filteredStats = selectedLevel === "all"
    ? cacheStats
    : cacheStats.filter(s => s.exam_level === selectedLevel);

  const getStatusColor = (count: number) => {
    if (count >= 100) return "bg-green-500";
    if (count >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
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
          <div className="flex flex-wrap gap-3 mb-6">
            <Button onClick={() => triggerSync(selectedLevel)} disabled={syncing || bulkFetching} className="gap-2">
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              {syncing ? "Syncing..." : "Sync (ALOC + Veezee)"}
            </Button>
            <Button onClick={triggerBulkFetch} disabled={syncing || bulkFetching} variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
              {bulkFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {bulkFetching ? "Bulk Fetching... (may take minutes)" : "Bulk Fetch All (15 years)"}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredStats.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No cached questions yet. Click "Bulk Fetch All" to populate the question bank.
            </p>
          ) : (
            <div className="space-y-4">
              {LEVELS.filter(l => selectedLevel === "all" || l === selectedLevel).map(level => {
                const levelStats = filteredStats.filter(s => s.exam_level === level);
                if (levelStats.length === 0) return null;
                const levelTotal = levelStats.reduce((sum, s) => sum + s.question_count, 0);

                return (
                  <div key={level} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-sm">{level}</h3>
                      <Badge variant="secondary">{levelTotal.toLocaleString()} questions</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {levelStats.map(stat => (
                        <div key={`${stat.exam_level}-${stat.subject}`} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(stat.question_count)}`} />
                          <span className="truncate flex-1">{stat.subject}</span>
                          <span className="font-mono text-xs font-semibold">{stat.question_count}</span>
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

      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last Fetch Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {syncResults.map((result, i) => (
                <div key={i} className="flex items-center gap-2 text-sm py-1 border-b last:border-0">
                  {result.error ? (
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                  <span className="truncate flex-1">{result.level ? `${result.level} — ` : ""}{result.subject}</span>
                  {result.error ? (
                    <span className="text-xs text-destructive">{result.error}</span>
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
