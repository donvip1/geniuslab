import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Eye, UserPlus, Activity, MousePointerClick, RefreshCw, TrendingUp, Trash2, Trophy, BarChart3, AlertTriangle } from "lucide-react";
import { Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
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

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  registeredUsers: number;
  activeUsers: number;
  newUsersToday: number;
  topPages: { page_path: string; views: number }[];
  adClicks: { title: string; clicks: number }[];
  pageViewsOverTime: { date: string; views: number; visitors: number }[];
}

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resettingLeaderboard, setResettingLeaderboard] = useState(false);
  const [resettingStats, setResettingStats] = useState(false);
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    registeredUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    topPages: [],
    adClicks: [],
    pageViewsOverTime: [],
  });

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return startDate.toISOString();
  };

  const processPageViewsOverTime = (pageViews: any[], startDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const isHourly = timeRange === "24h";
    
    const dataMap: Record<string, { views: number; sessions: Set<string> }> = {};
    
    // Initialize all time slots
    if (isHourly) {
      for (let i = 0; i < 24; i++) {
        const date = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000);
        const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
        dataMap[key] = { views: 0, sessions: new Set() };
      }
    } else {
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 30;
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - (days - 1 - i) * 24 * 60 * 60 * 1000);
        const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
        dataMap[key] = { views: 0, sessions: new Set() };
      }
    }
    
    // Fill in actual data
    pageViews?.forEach(pv => {
      const date = new Date(pv.created_at);
      const key = isHourly 
        ? date.toISOString().slice(0, 13)
        : date.toISOString().slice(0, 10);
      
      if (dataMap[key]) {
        dataMap[key].views += 1;
        dataMap[key].sessions.add(pv.session_id);
      }
    });
    
    return Object.entries(dataMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        date: isHourly 
          ? new Date(key + ":00:00Z").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date(key).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        views: value.views,
        visitors: value.sessions.size,
      }));
  };

  const fetchAnalytics = async () => {
    try {
      const startDate = getDateRange();
      
      // Fetch page views
      const { data: pageViews, count: totalViews } = await supabase
        .from("page_views")
        .select("*", { count: "exact" })
        .gte("created_at", startDate);

      // Get unique visitors (by session_id)
      const uniqueSessions = new Set(pageViews?.map(pv => pv.session_id) || []);
      
      // Get unique logged-in users from page views
      const loggedInUsers = new Set(pageViews?.filter(pv => pv.user_id).map(pv => pv.user_id) || []);

      // Get total registered users
      const { count: registeredUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get users created today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Get top pages
      const pageCountMap: Record<string, number> = {};
      pageViews?.forEach(pv => {
        pageCountMap[pv.page_path] = (pageCountMap[pv.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCountMap)
        .map(([page_path, views]) => ({ page_path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Get ad clicks with titles
      const { data: adClicks } = await supabase
        .from("advertisements")
        .select("title, click_count")
        .order("click_count", { ascending: false });

      // Process page views over time for chart
      const pageViewsOverTime = processPageViewsOverTime(pageViews || [], startDate);

      setAnalytics({
        totalPageViews: totalViews || 0,
        uniqueVisitors: uniqueSessions.size,
        registeredUsers: registeredUsers || 0,
        activeUsers: loggedInUsers.size,
        newUsersToday: newUsersToday || 0,
        topPages,
        adClicks: adClicks?.map(ad => ({ title: ad.title, clicks: ad.click_count })) || [],
        pageViewsOverTime,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleResetLeaderboard = async () => {
    setResettingLeaderboard(true);
    try {
      // Delete all exam_attempts — this resets the leaderboard
      const { error } = await supabase.from("exam_attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      toast({ title: "Leaderboard Reset", description: "All exam attempts and leaderboard data have been cleared." });
      fetchAnalytics();
    } catch (error: any) {
      console.error("Error resetting leaderboard:", error);
      toast({ title: "Error", description: error.message || "Failed to reset leaderboard.", variant: "destructive" });
    } finally {
      setResettingLeaderboard(false);
    }
  };

  const handleResetAllStats = async () => {
    setResettingStats(true);
    try {
      // Delete exam attempts
      const { error: attemptsErr } = await supabase.from("exam_attempts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (attemptsErr) throw attemptsErr;

      // Delete user trials
      const { error: trialsErr } = await supabase.from("user_trials").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (trialsErr) throw trialsErr;

      // Delete page views
      const { error: viewsErr } = await supabase.from("page_views").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (viewsErr) throw viewsErr;

      toast({ title: "All Statistics Reset", description: "Leaderboard, exam history, trial data, and page views have been cleared for all users." });
      fetchAnalytics();
    } catch (error: any) {
      console.error("Error resetting all stats:", error);
      toast({ title: "Error", description: error.message || "Failed to reset statistics.", variant: "destructive" });
    } finally {
      setResettingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const chartConfig = {
    views: {
      label: "Page Views",
      color: "hsl(var(--primary))",
    },
    visitors: {
      label: "Unique Visitors",
      color: "hsl(var(--secondary))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track visitor activity and user engagement</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalPageViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Unique Visitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.registeredUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <Activity className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.newUsersToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">New Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Page Views Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Traffic Over Time</CardTitle>
          <CardDescription>
            Page views and unique visitors {timeRange === "24h" ? "by hour" : "by day"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.pageViewsOverTime.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No traffic data yet</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.pageViewsOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorViews)" 
                    strokeWidth={2}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="hsl(var(--secondary))" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Pages</CardTitle>
            <CardDescription>Most visited pages in selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No page views yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.topPages.map((page, index) => (
                  <div key={page.page_path} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                      <span className="text-sm font-medium">{page.page_path}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{page.views} views</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ad Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" />
              Ad Click Performance
            </CardTitle>
            <CardDescription>Total clicks on each advertisement</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.adClicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ads created yet</p>
            ) : (
              <div className="space-y-3">
                {analytics.adClicks.map((ad, index) => (
                  <div key={ad.title} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">{ad.title}</span>
                    </div>
                    <span className="text-sm font-medium text-primary">{ad.clicks} clicks</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Data Reset Section */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone — Data Reset
          </CardTitle>
          <CardDescription>Permanently delete data for all users. These actions cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Reset Leaderboard */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Reset Leaderboard</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Deletes all exam attempts for every user. This clears the leaderboard rankings and exam history from all student profiles.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={resettingLeaderboard}>
                    {resettingLeaderboard ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Reset Leaderboard
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Leaderboard?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL exam attempts for every user. The leaderboard will be empty and all students' exam history will be cleared. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetLeaderboard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Reset Leaderboard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Reset All Statistics */}
            <div className="border border-destructive/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-destructive">Reset All Statistics</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Deletes ALL data: exam attempts, leaderboard, trial usage, and page view analytics for every user. Full wipe.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={resettingStats}>
                    {resettingStats ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Reset Everything
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Reset ALL Statistics?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete ALL of the following for EVERY user:
                      <br />• All exam attempts & scores
                      <br />• Leaderboard rankings
                      <br />• Trial usage data
                      <br />• Page view analytics
                      <br /><br />
                      <strong>This action is irreversible.</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetAllStats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Yes, Reset Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
