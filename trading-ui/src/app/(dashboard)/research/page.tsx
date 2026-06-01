"use client"

import React, { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/contexts/language-context"
import {
  Send,
  Bot,
  User,
  BrainCircuit,
  TrendingUp,
  BarChart3,
  Newspaper,
  LineChart,
  Calendar,
  Search,
  Settings2,
  Sparkles,
  ArrowRight,
  Cloud,
  Cpu,
  Layers,
  Gauge,
  Activity,
  ShieldCheck,
  Scale,
  CheckCircle2,
  TerminalSquare,
  Network,
  RotateCcw,
  FileText,
  MessageSquare,
  TrendingDown,
  ShieldAlert,
  Briefcase,
  Clock
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Message = {
  id: string
  role: "user" | "agent" | "system"
  agentRole?: string
  content: string | React.ReactNode
  timestamp: string
}

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

export default function AgentsResearchPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [ticker, setTicker] = useState("")
  
  // Cyberpunk Workflow State
  const [isTyping, setIsTyping] = useState(false)
  const [logAnimationStep, setLogAnimationStep] = useState(0)
  const [activeLogTab, setActiveLogTab] = useState<"All" | "Fundamentals Analyst" | "Sentiment Analyst" | "News Analyst" | "Technical Analyst" | "Bull Researcher" | "Bear Researcher" | "Research Manager" | "Risk Management" | "Portfolio Manager" | "Trader">("All")
  
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const logScrollRef = useRef<HTMLDivElement>(null)

  // Derived states for the 3 main Pipeline Nodes from animation step
  const isAnalystActive = logAnimationStep >= 1 && logAnimationStep < 5
  const isAnalystComplete = logAnimationStep >= 5
  
  const isResearchActive = logAnimationStep >= 5 && logAnimationStep < 8
  const isResearchComplete = logAnimationStep >= 8
  
  const isTradingActive = logAnimationStep >= 8 && logAnimationStep < 11
  const isTradingComplete = logAnimationStep >= 11

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current && !isTyping) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Timer for log animation
  useEffect(() => {
    if (isTyping) {
      setLogAnimationStep(0)
      const timer = setInterval(() => {
        setLogAnimationStep(prev => {
          if (prev < 12) return prev + 1
          clearInterval(timer)
          
          // Complete the pipeline and show report
          setTimeout(() => {
            setIsTyping(false)
            setActiveLogTab("All")
            
            setMessages((msgs) => {
              // Prevent duplicate report on replay
              const targetTicker = ticker || "the requested market"
              const lastMsg = msgs[msgs.length - 1]
              if (lastMsg && lastMsg.role === "agent" && lastMsg.content && (lastMsg.content as any)?.props?.children?.[0]?.props?.children?.[2]?.props?.children === targetTicker) {
                return msgs
              }
              
              return [
                ...msgs,
                {
                  id: (Date.now() + 1).toString(),
                  role: "agent",
                  agentRole: "Tauric Nexus",
                  content: (
                    <div className="space-y-4">
                      <p>Pipeline synthesis complete for <strong>{targetTicker}</strong>.</p>
                      <div className="rounded-lg bg-card/50 p-4 border border-primary/10 shadow-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-500"/> Market Analysis</h4>
                        <p className="text-sm text-muted-foreground">Analyst Team reported strong consolidation. Technicals suggest a potential breakout despite short-term neutral action.</p>
                      </div>
                      <div className="rounded-lg bg-card/50 p-4 border border-primary/10 shadow-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Scale className="h-4 w-4 text-pink-500"/> Debate Conclusion</h4>
                        <p className="text-sm text-muted-foreground">Bearish debaters noted macroeconomic headwinds, but the Bullish consensus prevailed due to institutional buying pressure and accumulation patterns. Research Manager approved Bullish thesis.</p>
                      </div>
                      <div className="rounded-lg bg-card/50 p-4 border border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-500"><ShieldCheck className="h-4 w-4"/> Execution Order</h4>
                        <p className="text-sm font-medium text-green-400">RECOMMENDATION: ACCUMULATE (Target Allocation 1.5%)</p>
                      </div>
                      <div className="pt-2 border-t border-primary/10 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => replayWorkflow(targetTicker)}
                          className="text-xs h-8 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Replay Workflow
                        </Button>
                      </div>
                    </div>
                  ),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]
            })
          }, 1000)
          return prev
        })
      }, 1000) // 1 step per second
      return () => clearInterval(timer)
    }
  }, [isTyping, ticker])

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current && isTyping) {
      logScrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [logAnimationStep, activeLogTab, isTyping])

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, newMsg])
    setInputValue("")
    
    // Start Simulation Sequence
    setIsTyping(true)
  }

  const replayWorkflow = (targetTicker: string) => {
    setIsTyping(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSuggestion = (text: string, suggestedTicker: string) => {
    setTicker(suggestedTicker)
    handleSend(text)
  }

  // Filter logs up to current animation step
  const visibleLogs = cliLogsData.filter(log => log.step <= logAnimationStep)
  const filteredLogs = activeLogTab === "All" ? visibleLogs : visibleLogs.filter(l => l.agent === activeLogTab)

  return (
    <div className="flex h-full w-full flex-col lg:flex-row overflow-hidden bg-background/50 relative z-0">
      
      {/* Sci-Fi Background Grid */}
      <div className="cyber-grid pointer-events-none"></div>
      
      {/* Main Chat Area (Left/Center) */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        
        {/* If Workflow is active, hide chat and show FANTASY PIPELINE Dashboard */}
        {isTyping ? (
          <div className="flex h-full w-full flex-col p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-700">
            
            {/* TOP HALF: Fantasy Pipeline Visualization */}
            <div className="flex flex-col items-center justify-center h-[28%] min-h-[180px] relative w-full mb-4 rounded-2xl border border-border/40 bg-background/30 backdrop-blur-sm overflow-hidden">
              
              <div className="absolute top-4 left-6 text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                {t("research.pipeline")}
              </div>

              {/* Pipeline Track */}
              <div className="relative flex items-center justify-between w-full max-w-4xl px-12 z-10 scale-90 sm:scale-100">
                
                {/* Node 1: Analyst */}
                <div className="flex flex-col items-center relative z-20">
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl border rotate-45 transition-all duration-500 ${isAnalystActive ? 'border-cyan-500/50 bg-cyan-950/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-110' : isAnalystComplete ? 'border-cyan-900/50 bg-cyan-950/10' : 'border-border/50 bg-background'}`}>
                    <div className="-rotate-45">
                      {isAnalystComplete ? <CheckCircle2 className="h-5 w-5 text-cyan-600/70" /> : <Network className={`h-5 w-5 ${isAnalystActive ? 'text-cyan-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
                    </div>
                  </div>
                  <div className="absolute -bottom-10 text-center w-32">
                    <span className={`block text-xs font-bold font-mono tracking-widest ${isAnalystActive ? 'text-cyan-400' : isAnalystComplete ? 'text-cyan-700' : 'text-muted-foreground'}`}>{t("research.analysts").toUpperCase()}</span>
                    <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">{isAnalystActive ? (t("research.running").includes("...") ? t("research.running") : t("research.running") + "...") : isAnalystComplete ? 'Done' : 'Standby'}</span>
                  </div>
                </div>

                {/* Line 1 -> 2 */}
                <div className="flex-1 h-[2px] bg-border/40 relative overflow-hidden mx-6 rounded-full">
                  <div className={`absolute inset-0 bg-gradient-to-r from-cyan-500/50 to-pink-500/50 transition-transform duration-[2000ms] ease-in-out ${isAnalystComplete ? 'translate-x-0' : '-translate-x-full'}`}></div>
                </div>

                {/* Node 2: Research */}
                <div className="flex flex-col items-center relative z-20">
                  <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border transition-all duration-500 ${isResearchActive ? 'border-pink-500/50 bg-pink-950/30 shadow-[0_0_20px_rgba(236,72,153,0.2)] scale-110' : isResearchComplete ? 'border-pink-900/50 bg-pink-950/10' : 'border-border/50 bg-background'}`}>
                    {isResearchComplete ? <CheckCircle2 className="h-6 w-6 text-pink-600/70" /> : <BrainCircuit className={`h-6 w-6 ${isResearchActive ? 'text-pink-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
                    {isResearchActive && (
                      <div className="absolute inset-0 rounded-full border border-pink-400/30 animate-ping opacity-50"></div>
                    )}
                  </div>
                  <div className="absolute -bottom-10 text-center w-32">
                    <span className={`block text-xs font-bold font-mono tracking-widest ${isResearchActive ? 'text-pink-400' : isResearchComplete ? 'text-pink-700' : 'text-muted-foreground'}`}>{t("research.researchers").toUpperCase()}</span>
                    <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">{isResearchActive ? 'Debating...' : isResearchComplete ? 'Done' : 'Standby'}</span>
                  </div>
                </div>

                {/* Line 2 -> 3 */}
                <div className="flex-1 h-[2px] bg-border/40 relative overflow-hidden mx-6 rounded-full">
                  <div className={`absolute inset-0 bg-gradient-to-r from-pink-500/50 to-green-500/50 transition-transform duration-[2000ms] ease-in-out ${isResearchComplete ? 'translate-x-0' : '-translate-x-full'}`}></div>
                </div>

                {/* Node 3: Trading */}
                <div className="flex flex-col items-center relative z-20">
                  <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl border transition-all duration-500 ${isTradingActive ? 'border-green-500/50 bg-green-950/30 shadow-[0_0_20px_rgba(34,197,94,0.2)] scale-110' : isTradingComplete ? 'border-green-900/50 bg-green-950/10' : 'border-border/50 bg-background'}`}>
                    {isTradingComplete ? <CheckCircle2 className="h-5 w-5 text-green-600/70" /> : <ShieldCheck className={`h-5 w-5 ${isTradingActive ? 'text-green-400 animate-pulse' : 'text-muted-foreground/50'}`} />}
                  </div>
                  <div className="absolute -bottom-10 text-center w-32">
                    <span className={`block text-xs font-bold font-mono tracking-widest ${isTradingActive ? 'text-green-400' : isTradingComplete ? 'text-green-650' : 'text-muted-foreground'}`}>{t("research.trader").toUpperCase()}</span>
                    <span className="block text-[9px] font-mono text-muted-foreground/70 uppercase">{isTradingActive ? 'Executing...' : isTradingComplete ? 'Done' : 'Standby'}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* BOTTOM HALF: CLI-STYLE LOG VIEWER (From Jobs) */}
            <div className="flex-1 flex flex-col rounded-2xl border border-primary/30 bg-[#0a0a0f] text-green-500 overflow-hidden font-mono text-sm shadow-[0_0_50px_rgba(0,240,255,0.15)]">
              
              {/* 2 Columns: Progress Tree & Logs */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* Left Column: Progress Tree */}
                <div className="hidden sm:flex w-[200px] lg:w-[250px] border-r border-primary/20 flex-col bg-background/50">
                  <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
                    {t("research.pipeline").toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs custom-scrollbar">
                    
                    {/* Team 1: Analyst */}
                    <div>
                      <div className="text-muted-foreground uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> {t("reports.analystTeam")}</div>
                      <div className="pl-4 border-l border-primary/20 space-y-3">
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 0 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-cyan-500"/> Fundamentals</span>
                          {logAnimationStep >= 2 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 1 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 1 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-cyan-500"/> Sentiment</span>
                          {logAnimationStep >= 3 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 2 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 2 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5 text-cyan-500"/> News</span>
                          {logAnimationStep >= 4 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 3 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 3 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-500"/> Technicals</span>
                          {logAnimationStep >= 5 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 4 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Team 2: Research */}
                    <div>
                      <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2"><Network className="w-3 h-3"/> {t("reports.researchTeam")}</div>
                      <div className="pl-4 border-l border-primary/20 space-y-3">
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 4 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-pink-500"/> Bull</span>
                          {logAnimationStep >= 6 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 5 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 5 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-pink-500"/> Bear</span>
                          {logAnimationStep >= 7 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 6 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 6 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5 text-purple-500"/> Manager</span>
                          {logAnimationStep >= 8 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 7 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Team 3: Execution */}
                    <div>
                      <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2"><Scale className="w-3 h-3"/> {t("reports.executionTeam")}</div>
                      <div className="pl-4 border-l border-primary/20 space-y-3">
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 7 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-yellow-500"/> Risk Mgmt</span>
                          {logAnimationStep >= 9 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 8 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 8 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-yellow-500"/> Port. Mgr</span>
                          {logAnimationStep >= 10 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 9 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                        <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 9 ? "opacity-100" : "opacity-40"}`}>
                          <span className="text-foreground flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-green-500"/> Trader</span>
                          {logAnimationStep >= 11 ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge> : logAnimationStep >= 10 ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge> : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Messages & Tools */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
                    {t("research.cli").toUpperCase()}
                  </div>
                  
                  {/* Sub-Tabs for Agents */}
                  <div className="flex border-b border-primary/20 overflow-x-auto custom-scrollbar flex-shrink-0">
                    {["All", "Fundamentals Analyst", "Sentiment Analyst", "News Analyst", "Technical Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Risk Management", "Portfolio Manager", "Trader"].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveLogTab(tab as any)}
                        className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-colors border-r border-primary/20 whitespace-nowrap ${
                          activeLogTab === tab 
                          ? "bg-primary/20 text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(0,240,255,1)]" 
                          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                        }`}
                      >
                        {tab === "All" ? t("research.allLogs") : tab.replace(" Analyst", "").replace(" Researcher", "").replace(" Management", "").replace(" Manager", "")}
                      </button>
                    ))}
                  </div>

                  {/* Log Table Area */}
                  <div className="flex-1 overflow-y-auto p-4 bg-black/60 relative custom-scrollbar">
                    <table className="w-full text-xs text-left table-fixed">
                      <thead className="text-muted-foreground sticky top-0 bg-[#0a0a0f] z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                        <tr>
                          <th className="pb-3 w-[80px] font-normal hidden sm:table-cell">Time</th>
                          <th className="pb-3 w-[120px] font-normal">Agent</th>
                          <th className="pb-3 w-[70px] font-normal hidden md:table-cell">Type</th>
                          <th className="font-normal">Content</th>
                        </tr>
                      </thead>
                      <tbody className="align-top">
                        {filteredLogs.map((log, i) => (
                          <tr key={i} className="border-t border-primary/10 hover:bg-primary/5 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <td className="py-3 text-muted-foreground hidden sm:table-cell truncate">{log.time}</td>
                            <td className="py-3 text-foreground font-semibold truncate">{log.agent}</td>
                            <td className="py-3 hidden md:table-cell truncate"><span className="text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded">{log.type}</span></td>
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
                              {logAnimationStep === 0 ? "Initializing pipeline..." : `No logs found for ${activeLogTab}.`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div ref={logScrollRef} className="h-4 w-full"></div>
                  </div>
                </div>

              </div>

              {/* Footer Bar: System Stats */}
              <div className="p-2 border-t border-primary/30 bg-primary/10 flex flex-wrap justify-between items-center text-[11px] text-primary/80">
                <div className="flex items-center gap-4 divide-x divide-primary/30">
                  <span className="pl-2">Agents: {Math.min(logAnimationStep, 10)}/10</span>
                  <span className="pl-4">LLM Calls: {logAnimationStep * 2}</span>
                  <span className="pl-4">Tools Used: {Math.floor(logAnimationStep * 1.5)}</span>
                  <span className="pl-4 flex items-center gap-1">Tokens: {(38.0 * (logAnimationStep/12)).toFixed(1)}k<Activity className="w-3 h-3 text-red-400" /></span>
                </div>
                <div className="flex items-center gap-2 text-foreground font-bold pr-2">
                  <Clock className="w-3 h-3 text-primary" />
                  01:45
                </div>
              </div>

            </div>
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div 
              ref={chatScrollRef}
              className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar"
            >
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-32">
                
                {messages.length === 0 ? (
                  <div className="flex h-full min-h-[50vh] flex-col items-center justify-center text-center mt-12 animate-in fade-in zoom-in duration-500">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30 shadow-[0_0_40px_rgba(var(--primary),0.25)] relative overflow-hidden group">
                      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-20"></div>
                      <BrainCircuit className="h-10 w-10 relative z-10 group-hover:scale-110 transition-transform" />
                    </div>
                    <h1 className="mb-2 text-4xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
                      {t("research.welcomeTitle")}
                    </h1>
                    <p className="mb-8 text-muted-foreground max-w-md text-[15px]">
                      {t("research.welcomeDesc")}
                    </p>
                    
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                      <button 
                        onClick={() => handleSuggestion("Perform a comprehensive technical analysis on AAPL", "AAPL")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                      >
                        <span className="font-medium flex items-center gap-2"><LineChart className="h-4 w-4 text-primary" /> Technical Analysis</span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Analyze MACD, RSI, and trends for AAPL</span>
                      </button>
                      <button 
                        onClick={() => handleSuggestion("Check the recent market sentiment and news for TSLA", "TSLA")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                      >
                        <span className="font-medium flex items-center gap-2"><Newspaper className="h-4 w-4 text-primary" /> Market Sentiment</span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Scan news and social media for TSLA</span>
                      </button>
                      <button 
                        onClick={() => handleSuggestion("Give me a fundamental breakdown of NVDA's last earnings", "NVDA")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                      >
                        <span className="font-medium flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Fundamentals</span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Review earnings & valuation for NVDA</span>
                      </button>
                      <button 
                        onClick={() => handleSuggestion("Run a full multi-agent debate on the crypto market", "BTC-USD")}
                        className="flex flex-col items-start gap-1 rounded-xl border border-primary/10 bg-card/40 backdrop-blur-md p-4 text-left transition-all hover:bg-card/80 hover:shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:border-primary/40 hover:-translate-y-1 group"
                      >
                        <span className="font-medium flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Full Team Debate</span>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors">Bull vs Bear analysis on BTC-USD</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-2`}>
                      
                      {/* Avatar */}
                      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        msg.role === "user" 
                          ? "bg-muted text-muted-foreground" 
                          : "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.4)]"
                      }`}>
                        {msg.role === "user" ? <User className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </div>

                      {/* Message Bubble */}
                      <div className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"} w-full max-w-[85%]`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-sm font-semibold">
                            {msg.role === "user" ? "You" : msg.agentRole}
                          </span>
                        </div>
                        <div className={`text-[15px] leading-relaxed w-full ${
                          msg.role === "user"
                            ? "bg-muted/50 px-5 py-3.5 rounded-2xl rounded-tr-sm inline-block w-auto"
                            : "bg-card/40 backdrop-blur-sm border border-border/50 px-6 py-5 rounded-2xl rounded-tl-sm shadow-sm"
                        }`}>
                          {msg.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="relative z-20 mx-auto w-full max-w-3xl p-4 sm:p-6 pb-6 pt-0">
              <div className="relative flex items-center rounded-2xl border border-primary/20 bg-background/80 shadow-[0_0_30px_rgba(var(--primary),0.05)] backdrop-blur-xl focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
                <Button variant="ghost" size="icon" className="ml-2 h-10 w-10 shrink-0 text-muted-foreground hover:text-primary rounded-xl">
                  <Search className="h-5 w-5" />
                </Button>
                <input
                  type="text"
                  placeholder={t("research.welcomePromptPlaceholder")}
                  className="flex h-14 w-full bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button 
                  onClick={() => handleSend()} 
                  size="icon" 
                  disabled={!inputValue.trim() || isTyping}
                  className="mr-2 h-10 w-10 shrink-0 rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.5)] transition-all disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-center">
                <span className="text-xs text-muted-foreground">
                  {t("research.disclaimer")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Settings Panel (Right side) */}
      <div className="w-full lg:w-80 border-l border-border/50 bg-background/60 backdrop-blur-md flex flex-col h-[40vh] lg:h-full shrink-0 z-20">
        <div className="p-4 border-b border-border/50 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
          <Settings2 className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-sm">{t("research.settings")}</h2>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-8">
            
            {/* Global Settings */}
            <div className="space-y-5">
              <div className="space-y-3">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="h-3 w-3" /> {t("research.provider")}
                </Label>
                <Select defaultValue="openai">
                  <SelectTrigger className="bg-background/60 h-10 border-primary/20 hover:border-primary/40 focus:ring-primary/30 transition-all rounded-xl shadow-sm">
                    <SelectValue placeholder="Select Provider" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/20">
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek AI</SelectItem>
                    <SelectItem value="google">Google (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="h-3 w-3" /> {t("research.model")}
                </Label>
                <Select defaultValue="gpt-4o">
                  <SelectTrigger className="bg-background/60 h-10 border-primary/20 hover:border-primary/40 focus:ring-primary/30 transition-all rounded-xl shadow-sm">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-primary/20">
                    <SelectItem value="gpt-4o">GPT-4 Omni</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4 Omni Mini</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="deepseek-coder">DeepSeek V3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Analyst Teams Multi-select */}
            <div className="space-y-3">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <BrainCircuit className="h-3 w-3" /> {t("research.activeTeams")}
              </Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">Fundamentals</span>
                  </div>
                  <Checkbox id="team-fundamentals" defaultChecked className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                </label>
                
                <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">Sentiment</span>
                  </div>
                  <Checkbox id="team-sentiment" defaultChecked className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                </label>
                
                <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Newspaper className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">News</span>
                  </div>
                  <Checkbox id="team-news" defaultChecked className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                </label>
                
                <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <LineChart className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm font-medium">Technical</span>
                  </div>
                  <Checkbox id="team-technical" defaultChecked className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                </label>
              </div>
            </div>

            {/* Research & Reasoning */}
            <div className="space-y-5 rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-primary">
                <Sparkles className="h-16 w-16" />
              </div>
              
              <div className="space-y-3 relative z-10">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3 w-3" /> {t("research.depth")}
                </Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="bg-background/80 h-9 border-primary/30 hover:border-primary/50 focus:ring-primary/40 transition-all rounded-lg shadow-sm">
                    <SelectValue placeholder="Select Depth" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-primary/30">
                    <SelectItem value="shallow">{t("research.depthShallow")}</SelectItem>
                    <SelectItem value="medium">{t("research.depthMedium")}</SelectItem>
                    <SelectItem value="deep">{t("research.depthDeepOption")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 relative z-10">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="h-3 w-3" /> {t("research.reasoningEffort")}
                </Label>
                <Select defaultValue="high">
                  <SelectTrigger className="bg-background/80 h-9 border-primary/30 hover:border-primary/50 focus:ring-primary/40 transition-all rounded-lg shadow-sm">
                    <SelectValue placeholder="Select Effort" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-primary/30">
                    <SelectItem value="low">{t("research.effortLow")}</SelectItem>
                    <SelectItem value="medium">{t("research.effortMedium")}</SelectItem>
                    <SelectItem value="high">{t("research.effortHigh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
