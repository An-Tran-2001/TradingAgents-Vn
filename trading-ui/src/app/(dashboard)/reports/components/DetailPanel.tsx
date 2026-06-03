import React, { useState } from "react"
import { 
  Clock, X, ArrowUpRight, ArrowDownRight, BrainCircuit, TrendingUp, 
  AlertTriangle, Cpu, Minus, Target 
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { TickerInfo, DayReport } from "../types"
import { REC } from "./TickerList"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const TEAM_COLOR: Record<string, string> = {
  Analyst: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  Research: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  Execution: "text-green-400 bg-green-400/10 border-green-400/20",
}

const ForecastTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div className="bg-[#0d0d12] border border-primary/30 rounded-xl p-3 text-xs shadow-xl font-mono text-green-500">
      <div className="text-muted-foreground mb-1 font-mono">{label}</div>
      <div className="text-primary font-bold text-sm">{d?.price?.toLocaleString()}</div>
      <div className="text-muted-foreground/60 mt-1">↓ {d?.low?.toLocaleString()} &nbsp; ↑ {d?.high?.toLocaleString()}</div>
    </div>
  )
}

interface DetailPanelProps {
  ticker: TickerInfo
  report: DayReport
  onClose: () => void
  onViewLogs: () => void
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  ticker,
  report,
  onClose,
  onViewLogs,
}) => {
  const { t } = useLanguage()
  const [tab, setTab] = useState<"overview" | "agents" | "forecast">("overview")
  const cfg = REC[report.recommendation]

  return (
    <div className="flex flex-col h-full border-l border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shrink-0 animate-in slide-in-from-right-4 duration-300 z-40 max-w-[500px]" style={{ minWidth: '500px' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs shrink-0">
            {ticker.ticker.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm truncate">
              {ticker.ticker} <span className="text-muted-foreground font-normal text-xs">— {ticker.name}</span>
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-2.5 h-2.5"/> {report.date}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {cfg.icon} {report.recommendation}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onClose}>
            <X className="w-4 h-4"/>
          </Button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-border/50 shrink-0">
        {([
          { id: "overview", label: t("reports.overview") },
          { id: "agents", label: t("reports.agents") },
          { id: "forecast", label: t("reports.forecast") }
        ] as const).map(tabItem => (
          <button 
            key={tabItem.id} 
            onClick={() => setTab(tabItem.id)} 
            className={`flex-1 py-2.5 text-xs font-medium transition-all capitalize ${
              tab === tabItem.id 
                ? "border-b-2 border-primary text-primary" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabItem.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
        {tab === "overview" && (
          <div className="p-4 space-y-4">
            {/* Price & Verdict */}
            <div className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold font-mono">{ticker.currency}{report.price?.toLocaleString() || "0"}</div>
                  <div className={`text-sm flex items-center gap-1 mt-0.5 ${report.change > 0 ? "text-green-400" : report.change < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {report.change > 0 ? <ArrowUpRight className="w-4 h-4"/> : report.change < 0 ? <ArrowDownRight className="w-4 h-4"/> : <Minus className="w-4 h-4"/>}
                    {report.change > 0 ? "+" : ""}{report.change}% {t("reports.priceOnAnalysis")}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${cfg.color}`}>{report.confidence || 0}%</div>
                  <div className="text-xs text-muted-foreground">{t("reports.confidence")}</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-black/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    (report.confidence || 0) >= 80 ? "bg-green-400" : (report.confidence || 0) >= 60 ? "bg-yellow-400" : "bg-red-400"
                  }`} 
                  style={{ width: `${report.confidence || 0}%` }}
                />
              </div>
            </div>
            
            {/* Target / Stop */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("reports.targetPrice")}</div>
                <div className="text-sm font-bold text-green-400 font-mono">{ticker.currency}{report.targetPrice?.toLocaleString() || "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("reports.stopLoss")}</div>
                <div className="text-sm font-bold text-red-400 font-mono">{ticker.currency}{report.stopLoss?.toLocaleString() || "N/A"}</div>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-center">
                <div className="text-xs text-muted-foreground mb-1">{t("reports.riskReward")}</div>
                <div className="text-sm font-bold text-primary">{report.riskReward || 0}x</div>
              </div>
            </div>
            
            {/* Summary */}
            <div className="p-4 rounded-xl bg-card/50 border border-border/30">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5 text-primary"/> 
                {t("reports.aiSummary")}
              </div>
              <div className="text-sm text-foreground/80 leading-relaxed markdown-terminal [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_strong]:text-primary [&_strong]:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {report.summary || "No summary available. Report might still be generating."}
                </ReactMarkdown>
              </div>
            </div>
            
            {/* Bull & Bear */}
            {(report.bullPoints?.length > 0 || report.bearPoints?.length > 0) && (
              <div className="grid grid-cols-1 gap-2">
                {report.bullPoints?.length > 0 && (
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                    <div className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5"/> {t("reports.bullCase")}
                    </div>
                    <ul className="space-y-1">
                      {report.bullPoints.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-green-400 shrink-0">+</span><span className="flex-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.bearPoints?.length > 0 && (
                  <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                    <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5"/> {t("reports.bearCase")}
                    </div>
                    <ul className="space-y-1">
                      {report.bearPoints.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-2">
                          <span className="text-red-400 shrink-0">−</span><span className="flex-1">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Meta */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground p-3 rounded-xl bg-muted/10 border border-border/20">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-primary"/> {report.agents} {t("reports.agents")}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {report.duration}</span>
              <Badge variant="outline" className="text-[9px] border-border/30">{ticker.type}</Badge>
            </div>
          </div>
        )}
        
        {tab === "agents" && (
          <div className="p-4 space-y-2">
            {(["Analyst", "Research", "Execution"] as const).map(team => {
              const teamLabel = team === "Analyst" 
                ? t("reports.analystTeam") 
                : team === "Research" 
                  ? t("reports.researchTeam") 
                  : t("reports.executionTeam")
              
              return (
                <div key={team}>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 mt-2 px-1 ${
                    team === "Analyst" ? "text-cyan-400" : team === "Research" ? "text-pink-400" : "text-green-400"
                  }`}>
                    {teamLabel}
                  </div>
                  {report.agentOutputs.filter(a => a.team === team).map((a, i) => (
                    <div key={i} className={`mb-2 p-3 rounded-xl border ${TEAM_COLOR[team]} bg-opacity-5`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">{a.agent}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          REC[a.recommendation].bg
                        } ${REC[a.recommendation].color} border ${REC[a.recommendation].border}`}>
                          {REC[a.recommendation].icon} {a.recommendation} {a.confidence}%
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed markdown-terminal [&_p]:mb-1 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.summary}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
        
        {tab === "forecast" && (
          <div className="p-4 space-y-4">
            {report.forecast && report.forecast.length > 0 ? (
              <>
                <div className="text-xs text-muted-foreground">
                  {t("reports.forecastTitle")} <span className="text-primary font-mono">{report.date}</span>
                </div>
                
                {/* Chart */}
                <div className="h-44 rounded-xl bg-black/30 border border-primary/20 p-2 pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={report.forecast} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.3}/>
                          <stop offset="100%" stopColor="#00f0ff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="day" tick={{ fontSize: 9, fill: "#64748b" }} tickLine={false} axisLine={false}/>
                      <YAxis hide domain={["auto", "auto"]}/>
                      <Tooltip content={<ForecastTooltip/>}/>
                      <ReferenceLine y={report.price} stroke="#64748b" strokeDasharray="3 3" strokeWidth={1}/>
                      <Area 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#00f0ff" 
                        strokeWidth={2} 
                        fill="url(#fg)" 
                        dot={{ fill: "#00f0ff", r: 3, strokeWidth: 0 }} 
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Reference line label */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-6 border-t border-dashed border-muted-foreground/50"/>
                  {t("reports.entryPrice")}: <span className="font-mono text-foreground">{ticker.currency}{report.price.toLocaleString()}</span>
                </div>
                
                {/* Table */}
                <div className="space-y-1.5">
                  {report.forecast.map((f, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        f.signal === "UP" 
                          ? "bg-green-500/5 border-green-500/20" 
                          : f.signal === "DOWN" 
                            ? "bg-red-500/5 border-red-500/20" 
                            : "bg-muted/5 border-border/20"
                      }`}
                    >
                      <div className="w-12 text-xs font-mono text-muted-foreground">{f.day}</div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        f.signal === "UP" ? "bg-green-400/20" : f.signal === "DOWN" ? "bg-red-400/20" : "bg-muted/20"
                      }`}>
                        {f.signal === "UP" 
                          ? <ArrowUpRight className="w-3 h-3 text-green-400"/> 
                          : f.signal === "DOWN" 
                            ? <ArrowDownRight className="w-3 h-3 text-red-400"/> 
                            : <Minus className="w-3 h-3 text-muted-foreground"/>}
                      </div>
                      <div className="flex-1 text-[10px] text-muted-foreground/60">
                        {ticker.currency}{f.low.toLocaleString()} – {ticker.currency}{f.high.toLocaleString()}
                      </div>
                      <div className={`text-xs font-bold font-mono ${
                        f.signal === "UP" ? "text-green-400" : f.signal === "DOWN" ? "text-red-400" : "text-foreground"
                      }`}>
                        {ticker.currency}{f.price.toLocaleString()}
                      </div>
                      <div className={`text-[10px] font-semibold w-12 text-right ${
                        f.price > report.price ? "text-green-400" : f.price < report.price ? "text-red-400" : "text-muted-foreground"
                      }`}>
                        {f.price > report.price ? "+" : ""}{(((f.price - report.price) / report.price) * 100).toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Forecast Summary */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="text-xs text-muted-foreground mb-1">{t("reports.projectedReturn")}</div>
                  <div className={`text-xl font-bold ${report.forecast[report.forecast.length - 1].price > report.price ? "text-green-400" : "text-red-400"}`}>
                    {report.forecast[report.forecast.length - 1].price > report.price ? "+" : ""}{(((report.forecast[report.forecast.length - 1].price - report.price) / report.price) * 100).toFixed(2)}%
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({ticker.currency}{Math.abs(report.forecast[report.forecast.length - 1].price - report.price).toLocaleString()})
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground gap-3">
                <Target className="w-8 h-8 opacity-20" />
                <div className="text-sm">No forecast data available</div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-border/30 flex gap-2 shrink-0">
        <Button 
          size="sm" 
          className="flex-1 h-8 text-xs rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30" 
          variant="ghost"
          onClick={onViewLogs}
        >
          <Cpu className="w-3.5 h-3.5 mr-1.5"/> View AI Logs
        </Button>
        <Button 
          size="sm" 
          className="flex-1 h-8 text-xs rounded-xl bg-muted/10 hover:bg-muted/20 text-muted-foreground border border-border/30" 
          variant="ghost"
        >
          <BrainCircuit className="w-3.5 h-3.5 mr-1.5"/> {t("reports.reAnalyze")}
        </Button>
      </div>
    </div>
  )
}
