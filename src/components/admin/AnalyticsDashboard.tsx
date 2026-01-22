import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Eye, UserPlus, Activity, MousePointerClick, RefreshCw, TrendingUp } from "lucide-react";
import { Loader2 } from "lucide-react";

interface AnalyticsData {
  totalPageViews: number;
  uniqueVisitors: number;
  registeredUsers: number;
  activeUsers: number;
  newUsersToday: number;
  topPages: { page_path: string; views: number }[];
  adClicks: { title: string; clicks: number }[];
}

export const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("7d");
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    registeredUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    topPages: [],
    adClicks: [],
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

      setAnalytics({
        totalPageViews: totalViews || 0,
        uniqueVisitors: uniqueSessions.size,
        registeredUsers: registeredUsers || 0,
        activeUsers: loggedInUsers.size,
        newUsersToday: newUsersToday || 0,
        topPages,
        adClicks: adClicks?.map(ad => ({ title: ad.title, clicks: ad.click_count })) || [],
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="h-5 w-5 text-blue-500" />
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
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
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
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-purple-500" />
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
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-orange-500" />
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
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.newUsersToday.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">New Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};
