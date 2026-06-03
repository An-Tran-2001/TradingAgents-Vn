import React, { useEffect, useRef } from "react"
import { useLanguage } from "@/contexts/language-context"
import { 
  Activity, 
  FileText, 
  MessageSquare, 
  Newspaper, 
  TrendingUp, 
  Network, 
  TrendingDown, 
  BrainCircuit, 
  Scale, 
  ShieldAlert, 
  Briefcase, 
  Clock,
  Maximize2,
  Minimize2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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

interface CliLogViewerProps {
  logs: import('./types').AgentLog[]
  logAnimationStep: number
  activeLogTab: "All" | "Fundamentals Analyst" | "Sentiment Analyst" | "News Analyst" | "Technical Analyst" | "Bull Researcher" | "Bear Researcher" | "Research Manager" | "Risk Management" | "Portfolio Manager" | "Trader" | string
  setActiveLogTab: (tab: "All" | "Fundamentals Analyst" | "Sentiment Analyst" | "News Analyst" | "Technical Analyst" | "Bull Researcher" | "Bear Researcher" | "Research Manager" | "Risk Management" | "Portfolio Manager" | "Trader" | string) => void
  isTyping: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export const CliLogViewer: React.FC<CliLogViewerProps> = ({
  logs,
  logAnimationStep,
  activeLogTab,
  setActiveLogTab,
  isTyping,
  isExpanded = false,
  onToggleExpand,
}) => {
  const { t } = useLanguage()
  const logScrollRef = useRef<HTMLDivElement>(null)

  // Use real logs
  const filteredLogs = activeLogTab === "All" ? logs : logs.filter(l => l.agent === activeLogTab)

  // Auto-scroll logs
  useEffect(() => {
    if (logScrollRef.current && isTyping) {
      logScrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [logAnimationStep, activeLogTab, isTyping])

  return (
    <div className={`flex flex-col rounded-2xl border border-primary/30 bg-[#0a0a0f] text-green-500 overflow-hidden font-mono text-sm shadow-[0_0_50px_rgba(0,240,255,0.15)] transition-all duration-500 ease-in-out ${isExpanded ? 'h-full absolute inset-0 z-50 m-4' : 'flex-1'}`}>
      
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
              <div className="text-muted-foreground uppercase mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3"/> {t("reports.analystTeam")}
              </div>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 0 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-cyan-500"/> Fundamentals</span>
                  {logAnimationStep >= 2 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 1 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 1 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-cyan-500"/> Sentiment</span>
                  {logAnimationStep >= 3 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 2 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 2 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5 text-cyan-500"/> News</span>
                  {logAnimationStep >= 4 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 3 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 3 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-cyan-500"/> Technicals</span>
                  {logAnimationStep >= 5 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 4 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Team 2: Research */}
            <div>
              <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2">
                <Network className="w-3 h-3"/> {t("reports.researchTeam")}
              </div>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 4 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-pink-500"/> Bull</span>
                  {logAnimationStep >= 6 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 5 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 5 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-pink-500"/> Bear</span>
                  {logAnimationStep >= 7 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 6 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 6 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><BrainCircuit className="w-3.5 h-3.5 text-purple-500"/> Manager</span>
                  {logAnimationStep >= 8 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 7 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Team 3: Execution */}
            <div>
              <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2">
                <Scale className="w-3 h-3"/> {t("reports.executionTeam")}
              </div>
              <div className="pl-4 border-l border-primary/20 space-y-3">
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 7 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-yellow-500"/> Risk Mgmt</span>
                  {logAnimationStep >= 9 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 8 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 8 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-yellow-500"/> Port. Mgr</span>
                  {logAnimationStep >= 10 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 9 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 9 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><Scale className="w-3.5 h-3.5 text-green-500"/> Trader</span>
                  {logAnimationStep >= 11 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 10 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
                <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 10 ? "opacity-100" : "opacity-40"}`}>
                  <span className="text-foreground flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-primary"/> Synthesis</span>
                  {logAnimationStep >= 12 ? (
                    <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">done</Badge>
                  ) : logAnimationStep >= 11 ? (
                    <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">active</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">wait</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Messages & Tools */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="py-2 px-4 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="text-xs font-bold tracking-widest text-primary flex-1 text-center">
              {t("research.cli").toUpperCase()}
            </div>
            {onToggleExpand && (
              <button 
                onClick={onToggleExpand}
                className="text-primary hover:text-cyan-300 transition-colors rounded cursor-pointer"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            )}
          </div>
          
          {/* Sub-Tabs for Agents */}
          <div className="flex border-b border-primary/20 overflow-x-auto custom-scrollbar flex-shrink-0">
            {(["All", "Fundamentals Analyst", "Sentiment Analyst", "News Analyst", "Technical Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Risk Management", "Portfolio Manager", "Trader", "System"] as const).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveLogTab(tab)}
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
          <div className="flex-1 overflow-y-auto px-2 bg-black/60 relative custom-scrollbar">
            <table className="w-full text-xs text-left table-fixed">
              <thead className="text-muted-foreground sticky top-0 bg-[#0a0a0f] z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                <tr>
                  <th className="py-2 w-[80px] font-normal hidden sm:table-cell">Time</th>
                  <th className="py-2 w-[120px] font-normal">Agent</th>
                  <th className="py-2 w-[70px] font-normal hidden md:table-cell">Type</th>
                  <th className="py-2 font-normal">Content</th>
                </tr>
              </thead>
              <tbody className="align-top">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="border-t border-primary/10 hover:bg-primary/5 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <td className="py-3 text-muted-foreground hidden sm:table-cell truncate">{log.time}</td>
                    <td className="py-3 text-foreground font-semibold truncate">{log.agent}</td>
                    <td className="py-3 hidden md:table-cell truncate">
                      <span className="text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded">{log.type}</span>
                    </td>
                    <td className="py-3 text-green-400 break-words whitespace-normal pr-2">
                      <div className="markdown-terminal text-green-400 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_code]:bg-black/50 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-black/50 [&_pre]:p-2 [&_pre]:rounded [&_pre]:mb-2 [&_a]:text-cyan-400 [&_blockquote]:border-l-2 [&_blockquote]:border-green-600 [&_blockquote]:pl-2 [&_blockquote]:text-green-500 [&_table]:w-full [&_table]:my-2 [&_th]:border [&_th]:border-primary/20 [&_th]:p-1 [&_th]:bg-primary/10 [&_td]:border [&_td]:border-primary/20 [&_td]:p-1">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            strong: ({node, ...props}) => {
                              // We stringify the children to check content, but render the original children
                              let textContent = "";
                              if (Array.isArray(props.children)) {
                                textContent = props.children.map(c => c?.toString() || "").join("");
                              } else if (typeof props.children === 'string') {
                                textContent = props.children;
                              }
                              
                              if (textContent.includes("Reasoning")) return <strong className="text-yellow-400 font-bold">{props.children}</strong>
                              if (textContent.includes("Action")) return <strong className="text-primary font-bold">{props.children}</strong>
                              if (textContent.includes("Synthesis")) return <strong className="text-purple-400 font-bold">{props.children}</strong>
                              return <strong className="text-green-300 font-bold">{props.children}</strong>
                            }
                          }}
                        >
                          {log.content}
                        </ReactMarkdown>
                      </div>
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
  )
}
