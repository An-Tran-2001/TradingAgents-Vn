"use client"

import React, { useState, useEffect, useRef } from "react"
import { 
  CalendarClock, Play, Pause, Trash2, Edit, Plus, BrainCircuit, 
  Activity, AlertTriangle, Layers, TerminalSquare, CheckCircle2,
  Network, Scale, ShieldCheck, XCircle, Search, Clock,
  Newspaper, MessageSquare, FileText, TrendingUp, TrendingDown, 
  ShieldAlert, Briefcase
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useLanguage } from "@/contexts/language-context"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

type JobStatus = "active" | "paused"

interface TradingJob {
  id: string
  ticker: string
  frequency: string
  depth: string
  reasoning: string
  agents: string[]
  startDate: string
  endDate: string
  status: JobStatus
  lastRun: string
  nextRun: string
  history: ("success" | "warning" | "failed" | "none")[]
}

const initialJobs: TradingJob[] = [
  {
    id: "job-1",
    ticker: "BTC-USD",
    frequency: "Daily (00:00 UTC)",
    depth: "Deep",
    reasoning: "High",
    agents: ["Market Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Trader"],
    startDate: "2026-06-01",
    endDate: "",
    status: "active",
    lastRun: "2 hours ago",
    nextRun: "in 22 hours",
    history: ["success", "success", "warning", "success", "success", "success", "success"]
  },
  {
    id: "job-2",
    ticker: "AAPL",
    frequency: "Weekly (Mon 09:30 EST)",
    depth: "Medium",
    reasoning: "Medium",
    agents: ["Market Analyst"],
    startDate: "2026-05-15",
    endDate: "2026-12-31",
    status: "paused",
    lastRun: "3 days ago",
    nextRun: "-",
    history: ["success", "success", "failed", "success", "success", "none", "none"]
  },
  {
    id: "job-3",
    ticker: "ETH-USD",
    frequency: "Every 4 Hours",
    depth: "Shallow",
    reasoning: "Low",
    agents: ["Market Analyst", "Trader"],
    startDate: "2026-06-01",
    endDate: "",
    status: "active",
    lastRun: "10 mins ago",
    nextRun: "in 3h 50m",
    history: ["warning", "success", "success", "success", "success", "success", "success"]
  }
]

const durationChartData = [
  { name: 'Mon', duration: 120 },
  { name: 'Tue', duration: 150 },
  { name: 'Wed', duration: 180 },
  { name: 'Thu', duration: 140 },
  { name: 'Fri', duration: 210 },
  { name: 'Sat', duration: 90 },
  { name: 'Sun', duration: 110 },
]

// Mock Log Data with precise animation steps
const cliLogsData = [
  { step: 1, time: "16:45:01", agent: "Fundamentals Analyst", type: "Agent", content: "**Action**: Evaluating company financials and SEC filings. PE ratio indicates slight overvaluation." },
  { step: 2, time: "16:45:03", agent: "Sentiment Analyst", type: "Agent", content: "**Action**: Scanning Reddit and StockTwits. Social sentiment is highly bullish." },
  { step: 3, time: "16:45:05", agent: "News Analyst", type: "Agent", content: "**Action**: Monitoring macroeconomic indicators. Fed rate decision pending, market cautious." },
  { step: 4, time: "16:45:07", agent: "Technical Analyst", type: "Agent", content: "**Action**: MACD crossing signal line. RSI at 65. Short-term bullish momentum detected." },
  
  { step: 5, time: "16:45:10", agent: "Bull Researcher", type: "Agent", content: "**Reasoning**: Technical breakout aligns with strong social sentiment. Accumulation phase verified." },
  { step: 6, time: "16:45:12", agent: "Bear Researcher", type: "Agent", content: "**Reasoning**: Macro headwinds and overvaluation present high risk. Suggest waiting for pullback." },
  { step: 7, time: "16:45:15", agent: "Research Manager", type: "Agent", content: "**Synthesis**: Bullish thesis accepted due to technical momentum, but scaling in recommended due to macro risks." },
  
  { step: 8, time: "16:45:18", agent: "Risk Management", type: "Agent", content: "**Action**: Assessing portfolio exposure. Volatility is within acceptable ATR boundaries. Approving risk." },
  { step: 9, time: "16:45:20", agent: "Portfolio Manager", type: "Agent", content: "**Synthesis**: Finalizing allocation. Approving 1.5% position sizing." },
  { step: 10, time: "16:45:22", agent: "Trader", type: "Agent", content: "**Action**: Executing TWAP buy order on simulated exchange." },
  { step: 11, time: "16:45:25", agent: "System", type: "System", content: "Pipeline Execution Complete. Generating Reports." },
]

export default function JobsPage() {
  const { t } = useLanguage()
  const [jobs, setJobs] = useState<TradingJob[]>(initialJobs)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<TradingJob | null>(null)
  
  // Log Viewer State
  const [isLogOpen, setIsLogOpen] = useState(false)
  const [selectedLogJob, setSelectedLogJob] = useState<TradingJob | null>(null)
  const [activeLogTab, setActiveLogTab] = useState("All")
  const [logAnimationStep, setLogAnimationStep] = useState(0)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLogOpen) {
      setLogAnimationStep(0)
      const timer = setInterval(() => {
        setLogAnimationStep(prev => {
          if (prev < 12) return prev + 1
          clearInterval(timer)
          return prev
        })
      }, 1000) // 1 second per step
      return () => clearInterval(timer)
    }
  }, [isLogOpen])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logAnimationStep, activeLogTab])

  // Form State
  const [formData, setFormData] = useState({
    ticker: "",
    frequency: "Daily",
    depth: "Medium",
    reasoning: "Medium",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    agents: ["Market Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Trader"] as string[]
  })

  const openCreateSheet = () => {
    setEditingJob(null)
    setFormData({ 
      ticker: "", frequency: "Daily", depth: "Medium", reasoning: "Medium", 
      startDate: new Date().toISOString().split('T')[0], endDate: "", 
      agents: ["Market Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Trader"] 
    })
    setIsSheetOpen(true)
  }

  const openEditSheet = (job: TradingJob) => {
    setEditingJob(job)
    setFormData({ 
      ticker: job.ticker, frequency: job.frequency, depth: job.depth, reasoning: job.reasoning,
      startDate: job.startDate, endDate: job.endDate, agents: job.agents
    })
    setIsSheetOpen(true)
  }

  const handleAgentToggle = (agentName: string) => {
    setFormData(prev => {
      const isSelected = prev.agents.includes(agentName)
      if (isSelected) {
        return { ...prev, agents: prev.agents.filter(a => a !== agentName) }
      } else {
        return { ...prev, agents: [...prev.agents, agentName] }
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this scheduled job?")) {
      setJobs(jobs.filter(j => j.id !== id))
    }
  }

  const handleToggleStatus = (id: string) => {
    setJobs(jobs.map(j => {
      if (j.id === id) {
        return {
          ...j,
          status: j.status === "active" ? "paused" : "active",
          nextRun: j.status === "active" ? "-" : "Pending schedule"
        }
      }
      return j
    }))
  }

  const handleSave = () => {
    if (!formData.ticker) return

    if (editingJob) {
      setJobs(jobs.map(j => j.id === editingJob.id ? {
        ...j,
        ...formData
      } : j))
    } else {
      const newJob: TradingJob = {
        id: `job-${Date.now()}`,
        ...formData,
        ticker: formData.ticker.toUpperCase(),
        status: "active",
        lastRun: "Never",
        nextRun: "Pending schedule",
        history: ["none", "none", "none", "none", "none", "none", "none"]
      }
      setJobs([...jobs, newJob])
    }
    
    setIsSheetOpen(false)
  }

  const viewLogs = (job: TradingJob) => {
    setSelectedLogJob(job)
    setActiveLogTab("All")
    setIsLogOpen(true)
  }

  // Filter logs up to current animation step
  const visibleLogs = cliLogsData.filter(log => log.step <= logAnimationStep)
  const filteredLogs = activeLogTab === "All" ? visibleLogs : visibleLogs.filter(l => l.agent === activeLogTab)

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-1.5rem)] w-full flex-col overflow-hidden rounded-xl border border-border/50 bg-background/50 relative z-0">
      <div className="cyber-grid pointer-events-none"></div>
      
      <div className="flex flex-1 flex-col overflow-y-auto relative z-10 p-4 lg:p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" />
              {t("jobs.title")}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("jobs.subtitle")}
            </p>
          </div>
          <Button onClick={openCreateSheet} className="gap-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Plus className="h-4 w-4" />
            {t("jobs.create")}
          </Button>
        </div>

        {/* Top Metrics & Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          
          {/* Left: 4 Metrics Cards */}
          <div className="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-card/40 backdrop-blur-md border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Token Usage (24h)</CardTitle>
                <Activity className="h-4 w-4 text-cyan-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">142,500</div>
                <p className="text-xs text-muted-foreground mt-1">~ $0.42 spent today</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-md border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.activeJobs")}</CardTitle>
                <Layers className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.filter(j => j.status === "active").length} Active</div>
                <p className="text-xs text-muted-foreground mt-1">System capacity: 85% free</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-md border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Warnings & Errors</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-500">2 Warnings</div>
                <p className="text-xs text-muted-foreground mt-1 text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 0 Critical Errors</p>
              </CardContent>
            </Card>
            <Card className="bg-card/40 backdrop-blur-md border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t("jobs.completedJobs")}</CardTitle>
                <CalendarClock className="h-4 w-4 text-pink-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{jobs.length} Jobs</div>
                <p className="text-xs text-muted-foreground mt-1">Across 3 different tickers</p>
              </CardContent>
            </Card>
          </div>

          {/* Right: Duration Chart */}
          <div className="col-span-1">
            <Card className="bg-card/40 backdrop-blur-md border-primary/20 h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> {t("jobs.runDuration")} (7D)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 pb-4 px-2 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={durationChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}m`} width={35} />
                    <Tooltip cursor={{fill: 'rgba(0,240,255,0.05)'}} contentStyle={{backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: '8px'}} />
                    <Bar dataKey="duration" fill="#00f0ff" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border border-border/40 bg-card/40 backdrop-blur-sm flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 whitespace-nowrap">
                <TableRow>
                  <TableHead className="w-[120px]">{t("jobs.tableTicker")}</TableHead>
                  <TableHead>{t("research.settings")}</TableHead>
                  <TableHead>{t("jobs.tableStatus")}</TableHead>
                  <TableHead>{t("jobs.tableSchedule")}</TableHead>
                  <TableHead>{t("jobs.tableHistory")}</TableHead>
                  <TableHead className="text-right">{t("jobs.tableActions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No scheduled jobs found. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  jobs.map((job) => (
                    <TableRow key={job.id} className="hover:bg-muted/30 group whitespace-nowrap">
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                        {job.ticker}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground">{t("research.depth")}: <span className="text-foreground">{job.depth}</span></span>
                          <span className="text-xs text-muted-foreground">Agents: <span className="text-foreground">{job.agents.length}</span></span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === "active" ? "default" : "secondary"} className={job.status === "active" ? "bg-primary/20 text-primary border-primary/30" : ""}>
                          {job.status === "active" ? (t("jobs.activeJobs").split(" ")[0]) : "Paused"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm">{job.frequency}</span>
                          <span className="text-xs text-muted-foreground">{t("jobs.tableNextRun")}: {job.nextRun}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {job.history.map((status, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm border border-black/20 dark:border-white/10 ${
                                status === "success" ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.4)]" :
                                status === "warning" ? "bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.4)]" :
                                status === "failed" ? "bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]" :
                                "bg-muted/50"
                              }`}
                              title={status}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2 text-xs border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary mr-2"
                            onClick={() => viewLogs(job)}
                          >
                            <TerminalSquare className="h-3.5 w-3.5 mr-1" /> {t("jobs.viewLogs")}
                          </Button>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleToggleStatus(job.id)}
                            title={job.status === "active" ? "Pause Job" : "Resume Job"}
                          >
                            {job.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openEditSheet(job)}
                            title="Edit Job"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(job.id)}
                            title="Delete Job"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="border-l-border/40 bg-background/95 backdrop-blur-xl flex flex-col w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              {editingJob ? (t("jobs.create").includes("Tạo") ? "Cập Nhật Lịch Trình" : "Edit Scheduled Job") : t("jobs.create")}
            </SheetTitle>
            <SheetDescription>
              {t("jobs.create").includes("Tạo") 
                ? "Cấu hình các tham số lập lịch nâng cao cho luồng xử lý tự động của agent AI." 
                : "Configure advanced scheduling parameters for your automated trading agent pipeline."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 py-6 space-y-6">
            <div className="space-y-4 border border-border/50 rounded-lg p-4 bg-card/30">
              <h3 className="font-semibold text-sm text-primary flex items-center gap-2"><Activity className="w-4 h-4"/> {t("jobs.create").includes("Tạo") ? "Mục Tiêu & Lịch Trình" : "Target & Schedule"}</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ticker">{t("research.ticker")}</Label>
                  <Input 
                    id="ticker" 
                    placeholder="e.g. BTC-USD, AAPL" 
                    value={formData.ticker}
                    onChange={(e) => setFormData({...formData, ticker: e.target.value})}
                    className="bg-background/50 border-border/50 focus-visible:ring-primary/50 font-mono"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t("jobs.tableSchedule")}</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(val) => setFormData({...formData, frequency: val})}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Every Hour">Every Hour</SelectItem>
                      <SelectItem value="Every 4 Hours">Every 4 Hours</SelectItem>
                      <SelectItem value="Daily (00:00 UTC)">Daily (00:00 UTC)</SelectItem>
                      <SelectItem value="Weekly (Mon 09:30 EST)">Weekly (Mon 09:30 EST)</SelectItem>
                      <SelectItem value="Custom Cron">Custom Cron...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">{t("jobs.create").includes("Tạo") ? "Ngày Bắt Đầu" : "Start Date"}</Label>
                    <Input 
                      id="start-date" 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">{t("jobs.create").includes("Tạo") ? "Ngày Kết Thúc (Tùy chọn)" : "End Date (Optional)"}</Label>
                    <Input 
                      id="end-date" 
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="bg-background/50 border-border/50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 border border-border/50 rounded-lg p-4 bg-card/30">
              <h3 className="font-semibold text-sm text-primary flex items-center gap-2"><Network className="w-4 h-4"/> {t("jobs.create").includes("Tạo") ? "Cấu Hình Đội Ngũ Agent" : "Agent Configuration"}</h3>
              
              <div className="space-y-3">
                <Label>{t("jobs.create").includes("Tạo") ? "Nhóm Tham Gia" : "Participating Teams"}</Label>
                <div className="flex flex-col gap-3 p-3 border border-border/40 rounded-md bg-background/30">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="agent-analyst" checked={true} disabled />
                    <label htmlFor="agent-analyst" className="text-sm font-medium leading-none cursor-pointer">{t("reports.analystTeam")} (Full Suite)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="agent-research" checked={true} disabled />
                    <label htmlFor="agent-research" className="text-sm font-medium leading-none cursor-pointer">{t("reports.researchTeam")} (Debate)</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="agent-trader" checked={true} disabled />
                    <label htmlFor="agent-trader" className="text-sm font-medium leading-none cursor-pointer">{t("reports.executionTeam")}</label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("research.depth")}</Label>
                  <Select 
                    value={formData.depth} 
                    onValueChange={(val) => setFormData({...formData, depth: val})}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Shallow">{t("research.depthShallow").split(" ")[0]}</SelectItem>
                      <SelectItem value="Medium">{t("research.depthMedium").split(" ")[0]}</SelectItem>
                      <SelectItem value="Deep">{t("research.depthDeepOption").split(" ")[0]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{t("research.reasoningEffort")}</Label>
                  <Select 
                    value={formData.reasoning} 
                    onValueChange={(val) => setFormData({...formData, reasoning: val})}
                  >
                    <SelectTrigger className="bg-background/50 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">{t("research.effortLow").split(" ")[0]}</SelectItem>
                      <SelectItem value="Medium">{t("research.effortMedium").split(" ")[0]}</SelectItem>
                      <SelectItem value="High">{t("research.effortHigh").split(" ")[0]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </div>

          <SheetFooter className="pt-4 border-t border-border/50">
            <Button variant="outline" onClick={() => setIsSheetOpen(false)}>{t("jobs.create").includes("Tạo") ? "Hủy" : "Cancel"}</Button>
            <Button onClick={handleSave} disabled={!formData.ticker} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              {editingJob ? (t("jobs.create").includes("Tạo") ? "Lưu Thay Đổi" : "Save Changes") : t("jobs.create")}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* CLI-STYLE HOLOGRAPHIC LOG VIEWER DIALOG */}
      <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 border border-primary/30 bg-[#0a0a0f] text-green-500 overflow-hidden font-mono text-sm shadow-[0_0_50px_rgba(0,240,255,0.15)] rounded-lg">
          
          {/* Top Bar (Header) */}
          <div className="flex items-center justify-between p-2 px-4 border-b border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase">
              <TerminalSquare className="w-4 h-4" /> 
              Pipeline_Execution_Log 
              <span className="text-muted-foreground ml-2">:: {selectedLogJob?.ticker}</span>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={() => setIsLogOpen(false)}></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
            </div>
          </div>

          {/* Main Content Area (2 Columns) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Column: Progress Tree */}
            <div className="w-[30%] lg:w-[25%] border-r border-primary/20 flex flex-col bg-background/50">
              <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
                {t("jobs.create").includes("Tạo") ? "TIẾN TRÌNH" : "PROGRESS"}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs custom-scrollbar">
                
                {/* Team 1: Analyst */}
                <div>
                  <div className="text-muted-foreground uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> {t("reports.analystTeam")}</div>
                  <div className="pl-4 border-l border-primary/20 space-y-3">
                    
                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 0 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.fundamentals")}</span>
                      {logAnimationStep >= 2 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 1 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 1 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.sentiment")}</span>
                      {logAnimationStep >= 3 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 2 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 2 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.newsAnalyst").split(" ")[0]}</span>
                      {logAnimationStep >= 4 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 3 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 3 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.technicals")}</span>
                      {logAnimationStep >= 5 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 4 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                  </div>
                </div>

                {/* Team 2: Research */}
                <div>
                  <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2"><Network className="w-3 h-3"/> {t("reports.researchTeam")}</div>
                  <div className="pl-4 border-l border-primary/20 space-y-3">
                    
                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 4 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-pink-500"/> {t("reports.bullResearcher").split(" ")[0]}</span>
                      {logAnimationStep >= 6 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 5 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 5 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-pink-500"/> {t("reports.bearResearcher").split(" ")[0]}</span>
                      {logAnimationStep >= 7 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 6 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 6 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5 text-purple-500"/> {t("reports.researchManager").split(" ")[0]}</span>
                      {logAnimationStep >= 8 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 7 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                  </div>
                </div>

                {/* Team 3: Execution */}
                <div>
                  <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2"><Scale className="w-3 h-3"/> {t("reports.executionTeam")}</div>
                  <div className="pl-4 border-l border-primary/20 space-y-3">
                    
                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 7 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-yellow-500"/> {t("reports.riskManagement").split(" ")[0]}</span>
                      {logAnimationStep >= 9 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 8 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 8 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-yellow-500"/> {t("reports.portfolioManager").split(" ")[0]}</span>
                      {logAnimationStep >= 10 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 9 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                    <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 9 ? "opacity-100" : "opacity-40"}`}>
                      <span className="text-foreground flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-green-500"/> {t("reports.trader")}</span>
                      {logAnimationStep >= 11 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> : logAnimationStep >= 10 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Right Column: Messages & Tools */}
            <div className="flex-1 flex flex-col">
              <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
                {t("jobs.create").includes("Tạo") ? "TIN NHẮN & CÔNG CỤ" : "MESSAGES & TOOLS"}
              </div>
              
              {/* Sub-Tabs for Agents */}
              <div className="flex border-b border-primary/20 overflow-x-auto custom-scrollbar">
                {["All", "Fundamentals Analyst", "Sentiment Analyst", "News Analyst", "Technical Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Risk Management", "Portfolio Manager", "Trader"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveLogTab(tab)}
                    className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-colors border-r border-primary/20 whitespace-nowrap ${
                      activeLogTab === tab 
                      ? "bg-primary/20 text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(0,240,255,1)]" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    }`}
                  >
                    {tab === "All" ? (t("jobs.create").includes("Tạo") ? "Tất cả" : "All") : tab.replace(" Analyst", "").replace(" Researcher", "").replace(" Management", "").replace(" Manager", "")}
                  </button>
                ))}
              </div>

              {/* Log Table Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-black/60 relative custom-scrollbar">
                <table className="w-full text-xs text-left table-fixed">
                  <thead className="text-muted-foreground sticky top-0 bg-[#0a0a0f] z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                    <tr>
                      <th className="pb-3 w-[80px] font-normal">Time</th>
                      <th className="pb-3 w-[160px] font-normal">Agent</th>
                      <th className="pb-3 w-[80px] font-normal">Type</th>
                      <th className="font-normal">Content</th>
                    </tr>
                  </thead>
                  <tbody className="align-top">
                    {filteredLogs.map((log, i) => (
                      <tr key={i} className="border-t border-primary/10 hover:bg-primary/5 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <td className="py-3 text-muted-foreground truncate">{log.time}</td>
                        <td className="py-3 text-foreground font-semibold truncate">{log.agent}</td>
                        <td className="py-3 truncate"><span className="text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded">{log.type}</span></td>
                        <td className="py-3 text-green-400 break-words whitespace-normal pr-2">
                          {log.content.includes("**Reasoning**") ? (
                            <span><span className="text-yellow-400 font-bold">Reasoning:</span> {log.content.replace("**Reasoning**: ", "")}</span>
                          ) : log.content.includes("**Action**") ? (
                            <span><span className="text-primary font-bold">Action:</span> {log.content.replace("**Action**: ", "")}</span>
                          ) : log.content.includes("**Synthesis**") ? (
                            <span><span className="text-purple-400 font-bold">Synthesis:</span> {log.content.replace("**Synthesis**: ", "")}</span>
                          ) : (
                            log.content
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          {logAnimationStep === 0 
                            ? (t("jobs.create").includes("Tạo") ? "Đang khởi tạo luồng..." : "Initializing pipeline...") 
                            : `${t("jobs.create").includes("Tạo") ? "Không tìm thấy log cho" : "No logs found for"} ${activeLogTab}.`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div ref={logEndRef} className="h-4 w-full"></div>
              </div>
            </div>

          </div>

          {/* Bottom Panel: Current Report */}
          <div className="h-[35%] lg:h-[30%] border-t border-primary/30 flex flex-col bg-[#050508] relative">
            <div className="py-2 px-4 border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5 flex items-center justify-between">
              <span>{t("jobs.create").includes("Tạo") ? "BÁO CÁO HIỆN TẠI" : "CURRENT REPORT"}</span>
              <span className="text-muted-foreground text-[10px] font-normal">{t("jobs.create").includes("Tạo") ? "Xuất PDF / Markdown" : "Export to PDF / Markdown"}</span>
            </div>
            
            {logAnimationStep < 12 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
                <p className="animate-pulse font-mono text-xs tracking-widest uppercase">
                  {t("jobs.create").includes("Tạo") ? "Đang tổng hợp báo cáo từ các Agent..." : "Waiting for Pipeline Synthesis..."}
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 text-sm leading-relaxed text-muted-foreground custom-scrollbar animate-in fade-in zoom-in-95 duration-700">
                <h3 className="text-foreground font-bold mb-4 text-lg border-b border-border/40 pb-2">
                  {t("jobs.create").includes("Tạo") ? "Quyết Định Quản Trị Danh Mục" : "Portfolio Management Decision"}
                </h3>
                
                <h4 className="text-primary mt-4 mb-2">
                  {t("jobs.create").includes("Tạo") ? "Phân Tích Của Chuyên Viên Độc Lập" : "Neutral Analyst Analysis"}
                </h4>
                <p className="mb-4">
                  {t("jobs.create").includes("Tạo") 
                    ? `Tôi đã lắng nghe ý kiến từ cả hai phía, và thực tế, cả hai chuyên viên đang đưa ra các quan điểm thái cực mà bỏ qua lộ trình thực tế, được tính toán kỹ lưỡng hơn cho ${selectedLogJob?.ticker}. Cả hai đều bị mắc kẹt trong tư duy nhị phân giữa việc mạo hiểm không kiểm soát hoặc tê liệt hoàn toàn, và không có cách tiếp cận nào là tối ưu cho nguồn vốn chúng ta đang quản lý.`
                    : `I’ve listened to both sides of this debate, and frankly, both of you are presenting extremes that overlook a more pragmatic, calculated path forward for ${selectedLogJob?.ticker}. You’re both trapped in a binary mindset of either reckless abandonment or total paralysis, and neither approach is optimal for the capital we’re managing.`}
                </p>
                
                <p className="mb-4">
                  {t("jobs.create").includes("Tạo")
                    ? `Đối với Chuyên viên Tấn công, bạn đúng khi xác định khả năng đảo chiều trung bình, nhưng bạn đang nhắm mắt trước thực tế biến động. Việc đặt lệnh dừng lỗ ở mức $69,500 với ATR gần $1,800 là một công thức dẫn đến thất bại. Đó không phải là quản lý rủi ro; đó là điểm dừng lỗ quá sát.`
                    : `To the Aggressive Analyst, you are right to identify the potential for a mean reversion, but you’re blinding yourself to the reality of the volatility. Setting a stop-loss at $69,500 with an ATR of nearly $1,800 is a recipe for disaster. That isn’t risk management; it’s a "stop-out magnet." You’re giving the market barely 1.5 ATRs of room to breathe.`}
                </p>

                <p className="mb-4">
                  {t("jobs.create").includes("Tạo")
                    ? `Mặt khác, Chuyên viên Thận trọng lại đang nghiêng quá nhiều về nỗi sợ hãi cấu trúc. Đúng là các đường trung bình động của ${selectedLogJob?.ticker} đang giảm, và xu hướng hiện tại đang đi xuống. Nhưng việc chờ đợi sự xác nhận xu hướng hoàn toàn—như chờ giá vượt qua đường SMA 200 ngày—có nghĩa là chúng ta sẽ bỏ lỡ toàn bộ giai đoạn phục hồi của thị trường.`
                    : `On the other hand, the Conservative Analyst is leaning too heavily on structural fear. Yes, the moving averages for ${selectedLogJob?.ticker} are bearish, and yes, the trend is currently pointing down. But waiting for a total trend confirmation—like waiting for the price to reclaim the 200-day SMA—effectively means we miss the entire recovery phase of the move.`}
                </p>

                <div className="p-4 border-l-2 border-primary bg-primary/5 mt-6 text-foreground shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]">
                  <strong>{t("jobs.create").includes("Tạo") ? "Đề Xuất Chiến Lược Cân Bằng:" : "Balanced Strategy Proposed:"}</strong>{" "}
                  {t("jobs.create").includes("Tạo")
                    ? "Chúng tôi thực hiện vị thế khởi đầu nhỏ—khoảng 1.5%—ở mức hiện tại để tôn trọng dải Bollinger Band dưới dưới dạng hỗ trợ tiềm năng. Điều này giúp chúng ta tham gia giao dịch và tuân theo logic \"mua khi điều chỉnh\" trong khi giảm thiểu rủi ro tối đa."
                    : "We take a small starter position—say 1.5%—at the current level to respect the lower Bollinger Band as a potential support. This gets us into the trade and honors the \"buy the dip\" logic while minimizing exposure. Volatility is within acceptable ATR boundaries."}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar: System Stats */}
          <div className="p-2 border-t border-primary/30 bg-primary/10 flex flex-wrap justify-between items-center text-[11px] text-primary/80 font-mono">
            <div className="flex items-center gap-4 divide-x divide-primary/30">
              <span className="pl-2">{t("jobs.create").includes("Tạo") ? "Agents:" : "Agents:"} {Math.min(logAnimationStep, 10)}/10</span>
              <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Lượt gọi LLM:" : "LLM Calls:"} {logAnimationStep * 2}</span>
              <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Công cụ:" : "Tools Used:"} {Math.floor(logAnimationStep * 1.5)}</span>
              <span className="pl-4 flex items-center gap-1">Tokens: {(38.0 * (logAnimationStep/12)).toFixed(1)}k<Activity className="w-3 h-3 text-red-400" /> {(15.8 * (logAnimationStep/12)).toFixed(1)}k<Activity className="w-3 h-3 text-green-400" /></span>
              <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Báo cáo:" : "Reports Generated:"} {logAnimationStep >= 12 ? "4/4" : `${Math.floor(logAnimationStep/3)}/4`}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground font-bold pr-2">
              <Clock className="w-3 h-3 text-primary" />
              01:45
            </div>
          </div>

        </DialogContent>
      </Dialog>
    </div>
  )
}
