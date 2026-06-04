"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  Bot, 
  Activity, 
  FileText, 
  Calendar, 
  Target,
  Loader2,
  TrendingUp,
  Cpu,
  DollarSign,
  Clock,
  PieChart as PieChartIcon,
  Send
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchDashboardMetrics, DashboardMetrics } from "./api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const COLORS = ['#00f0ff', '#8b5cf6', '#ec4899', '#3b82f6', '#f97316'];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load metrics:", error);
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };
    loadMetrics();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-full items-center justify-center bg-background/30 p-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Connecting to Financial Data Core...</p>
        </div>
      </div>
    );
  }

  // Formatting utils
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  };

  // Chart Data
  const modelData = Object.entries(metrics.tokens_per_model).map(([name, value]) => ({ name, value }));
  const statusData = [
    { name: 'Completed', value: metrics.reports_by_status.completed, color: '#10b981' },
    { name: 'Running', value: metrics.reports_by_status.running, color: '#f59e0b' },
    { name: 'Failed', value: metrics.reports_by_status.failed, color: '#ef4444' },
    { name: 'Pending', value: metrics.reports_by_status.pending, color: '#6b7280' },
  ].filter(d => d.value > 0);

  const sentimentData = [
    { name: 'BUY', value: metrics.sentiment_distribution.BUY, color: '#10b981' }, // Green
    { name: 'HOLD', value: metrics.sentiment_distribution.HOLD, color: '#f59e0b' }, // Amber
    { name: 'SELL', value: metrics.sentiment_distribution.SELL, color: '#ef4444' } // Red
  ].filter(d => d.value > 0);

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-background/30 relative">
      <div className="cyber-grid pointer-events-none absolute inset-0 z-0 opacity-30" />
      
      <div className="relative z-10 space-y-6 max-w-7xl mx-auto w-full pb-12">
        {/* Header */}
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-mono">
                <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> LIVE TERMINAL
              </Badge>
              <Badge variant="outline" className="border-border/50 text-muted-foreground bg-card/20 font-mono">
                <Cpu className="w-3.5 h-3.5 mr-1.5" /> Core Connected
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground uppercase">
              Financial Economics
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              System performance, operational costs, and AI-driven market sentiment.
            </p>
          </div>
        </div>

        {/* Top Economic KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-black/40 border-border/50 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total AI Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(metrics.total_cost_usd)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-primary" /> {metrics.total_tokens_used.toLocaleString()} tokens
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-border/50 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-amber-500/20 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expected ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                +{metrics.avg_roi_percentage}%
              </div>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <Target className="w-3 h-3" /> Alpha Generated
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-border/50 backdrop-blur-md relative overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-blue-500/20 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Signal Win Rate</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {metrics.win_rate_percentage}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hit Target before Stop Loss
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-border/50 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-purple-500/20 transition-all" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time to Insight</CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-foreground">
                {formatTime(metrics.avg_report_duration_seconds)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average generation latency</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI Market Sentiment (Donut) */}
          <Card className="bg-card/10 border-border/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-primary" /> AI Market Sentiment
              </CardTitle>
              <CardDescription>Macro overview of AI recommendations</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {sentimentData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-6 flex justify-center gap-6">
                    {sentimentData.map((entry) => (
                      <div key={entry.name} className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs font-bold text-muted-foreground uppercase">{entry.name}</span>
                        </div>
                        <span className="text-xl font-black" style={{ color: entry.color }}>
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No recommendations generated yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portfolio Performance (Area Chart) */}
          <Card className="bg-card/10 border-border/50 backdrop-blur-sm h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Hypothetical Portfolio
              </CardTitle>
              <CardDescription>Performance vs Benchmark ($10k Initial)</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px]">
              {metrics.portfolio_history.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={metrics.portfolio_history} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      domain={['auto', 'auto']}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="benchmark" stroke="#6b7280" fillOpacity={1} fill="url(#colorBenchmark)" name="Benchmark" />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" name="AI Portfolio" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Third Row: Operational Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Top Performing Tickers */}
          <Card className="bg-card/10 border-border/50 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" /> Top Performing AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.top_performing_tickers.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 text-xs font-bold text-muted-foreground uppercase pb-2 border-b border-border/30">
                    <div>Asset</div>
                    <div className="text-right">Win Rate</div>
                    <div className="text-right">Return</div>
                  </div>
                  {metrics.top_performing_tickers.map((entry, index) => (
                    <div key={entry.ticker} className="grid grid-cols-3 items-center text-sm py-1">
                      <div className="font-bold text-foreground flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                         {entry.ticker}
                      </div>
                      <div className="font-mono text-muted-foreground text-right">
                        {entry.win_rate}%
                      </div>
                      <div className="font-mono text-emerald-400 font-bold text-right">
                        +{entry.return_percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm py-4">
                  No performance data recorded
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job & Execution Status */}
          <div className="space-y-6">
            <Card className="bg-card/10 border-border/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Report Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusData.map((status) => {
                    return (
                      <div key={status.name} className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-border/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                          <span className="text-xs font-bold text-muted-foreground uppercase">{status.name}</span>
                        </div>
                        <span className="font-mono text-sm font-medium" style={{ color: status.color }}>
                          {status.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/10 border-border/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Scheduling Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-border/30 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Active Jobs</span>
                  <span className="font-mono text-lg font-black text-foreground">{metrics.total_jobs_created}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-border/30">
                  <span className="text-xs font-bold text-muted-foreground uppercase">Auto-Generated</span>
                  <span className="font-mono text-lg font-black text-primary">{metrics.total_jobs_run}</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Fourth Row: Token Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Daily Token Usage Chart (Col Span 2) */}
          <Card className="bg-card/10 border-border/50 backdrop-blur-sm lg:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Daily Token Consumption
              </CardTitle>
              <CardDescription>System-wide API usage over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px]">
              {metrics.token_usage_history && metrics.token_usage_history.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={metrics.token_usage_history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.5)" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `${val/1000}k`}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,240,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      formatter={(val: number) => [val.toLocaleString(), 'Tokens']}
                    />
                    <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  No data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Token Usage Breakdown */}
          <Card className="bg-card/10 border-border/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Model Breakdown
              </CardTitle>
              <CardDescription>Total tokens used per AI model</CardDescription>
            </CardHeader>
            <CardContent>
              {modelData.length > 0 ? (
                <div className="space-y-4">
                  {modelData.sort((a,b) => b.value - a.value).map((entry, index) => {
                    const percentage = Math.round((entry.value / metrics.total_tokens_used) * 100) || 0;
                    return (
                      <div key={entry.name} className="space-y-1.5">
                        <div className="flex justify-between text-sm items-center">
                          <span className="font-medium text-foreground flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                             {entry.name}
                          </span>
                          <span className="font-mono text-muted-foreground text-xs">
                            {percentage}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm py-4">
                  No model usage recorded
                </div>
              )}
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}
