"use client"
import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  TrendingUp, TrendingDown, Minus, RotateCcw, Activity,
  ChevronDown, ChevronUp, Target, AlertTriangle, CheckCircle2,
  XCircle, ShieldAlert, Gavel, BookOpen, LineChart, Newspaper,
  MessageSquare, BrainCircuit, Zap, Cpu, ArrowRight, Quote
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface FinalReportProps {
  ticker: string
  finalState: any
  onReplay: (ticker: string) => void
  onViewLogs?: () => void
}

const Md = ({ children, compact }: { children: string; compact?: boolean }) => (
  <div className={`prose dark:prose-invert max-w-none ${compact ? "prose-xs" : "prose-sm"}
    [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0
    [&_h1]:text-sm [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-3 [&_h1]:mb-1
    [&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-2 [&_h2]:mb-1
    [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:text-foreground/80 [&_h3]:mt-2 [&_h3]:mb-0.5
    [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:space-y-0.5 [&_ul]:text-muted-foreground [&_ul]:text-sm
    [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:space-y-0.5 [&_ol]:text-muted-foreground [&_ol]:text-sm
    [&_li]:leading-relaxed
    [&_strong]:text-foreground [&_strong]:font-semibold
    [&_em]:text-muted-foreground/80
    [&_code]:bg-muted/50 [&_code]:text-primary [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono
    [&_pre]:bg-muted/30 [&_pre]:rounded-lg [&_pre]:p-2.5 [&_pre]:overflow-x-auto [&_pre]:mb-2 [&_pre]:text-xs
    [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-2
    [&_table]:w-full [&_table]:text-xs [&_table]:mb-2
    [&_th]:border [&_th]:border-primary/10 [&_th]:p-1.5 [&_th]:bg-primary/5 [&_th]:font-semibold [&_th]:text-foreground
    [&_td]:border [&_td]:border-primary/10 [&_td]:p-1.5 [&_td]:text-muted-foreground
    [&_hr]:border-primary/10 [&_hr]:my-2
    [&_a]:text-primary [&_a]:no-underline [&_a]:hover:underline`}>
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
  </div>
)

const Collapse = ({ label, icon: Icon, iconColor, children, defaultOpen = false, badge }: {
  label: string; icon: any; iconColor: string; children: React.ReactNode; defaultOpen?: boolean; badge?: string
}) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-primary/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-primary/5 transition-colors text-left bg-card/10">
        <div className="flex items-center gap-2">
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
          <span className="text-xs font-semibold text-foreground">{label}</span>
          {badge && <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 pt-2 border-t border-primary/5 bg-card/5">{children}</div>}
    </div>
  )
}

export const FinalReport: React.FC<FinalReportProps> = ({ ticker, finalState, onReplay, onViewLogs }) => {
  const structured = finalState?.structured_report || {};
  const rec = structured?.recommendation?.toUpperCase() || "";
  const rawDecision = finalState?.final_trade_decision || "";

  const isBullish = rec === "BUY" || (!rec && rawDecision.toLowerCase().includes("buy"));
  const isBearish = rec === "SELL" || (!rec && rawDecision.toLowerCase().includes("sell"));

  const decisionLabel = rec || (isBullish ? "BUY" : isBearish ? "SELL" : "HOLD");
  const confidence = structured?.confidence ?? null;

  const color = isBullish ? "emerald" : isBearish ? "red" : "amber";
  const colorMap = {
    emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25", icon: TrendingUp },
    red:     { text: "text-red-400",     bg: "bg-red-400/10",     border: "border-red-400/25",     icon: TrendingDown },
    amber:   { text: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25",   icon: Minus },
  };
  const c = colorMap[color];
  const DecisionIcon = c.icon;

  const currentPrice  = structured?.current_price ?? null;
  const targetPrice   = structured?.target_price  ?? null;
  const stopLoss      = structured?.stop_loss      ?? null;
  const riskReward    = structured?.risk_reward    ?? null;
  const execSummary   = structured?.summary        || "";
  const bullPoints: string[] = structured?.bull_points  ?? [];
  const bearPoints: string[] = structured?.bear_points  ?? [];
  const forecasts: any[]     = structured?.forecasts    ?? [];
  const agentOutputs: any[]  = structured?.agent_outputs ?? [];

  const researchVerdict = finalState?.investment_debate_state?.judge_decision || "";
  const traderPlan      = finalState?.trader_investment_plan || finalState?.investment_plan || "";
  const pmDecision      = finalState?.risk_debate_state?.judge_decision || "";

  const analystReports = [
    { key: "fundamentals_report", label: "Fundamentals", icon: BookOpen,     color: "text-blue-400" },
    { key: "market_report",       label: "Technical",    icon: LineChart,     color: "text-purple-400" },
    { key: "sentiment_report",    label: "Sentiment",    icon: MessageSquare, color: "text-pink-400" },
    { key: "news_report",         label: "News",         icon: Newspaper,     color: "text-orange-400" },
  ].filter(r => finalState?.[r.key]);

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
      <div className={`flex flex-wrap items-center gap-3 p-4 rounded-2xl border ${c.border} ${c.bg}`}>
        <div className={`flex items-center gap-2 ${c.text} flex-shrink-0`}>
          <DecisionIcon className="w-6 h-6" />
          <span className="text-2xl font-black tracking-tight">{decisionLabel}</span>
        </div>

        {confidence !== null && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-muted/30 overflow-hidden">
              <div className={`h-full rounded-full ${isBullish ? "bg-emerald-400" : isBearish ? "bg-red-400" : "bg-amber-400"}`}
                   style={{ width: `${confidence}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{confidence}%</span>
          </div>
        )}

        <div className="h-5 w-px bg-primary/15 hidden sm:block" />
        <span className="text-sm font-bold text-foreground">{ticker}</span>

        {(currentPrice || targetPrice || stopLoss) && (
          <>
            <div className="h-5 w-px bg-primary/15 hidden sm:block" />
            <div className="flex items-center gap-3 text-xs flex-wrap">
              {currentPrice && (
                <span className="text-muted-foreground">Now <strong className="text-foreground">${currentPrice.toLocaleString()}</strong></span>
              )}
              {targetPrice && (
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-400" />
                  <strong className="text-emerald-400">${targetPrice.toLocaleString()}</strong>
                </span>
              )}
              {stopLoss && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-400" />
                  <strong className="text-red-400">${stopLoss.toLocaleString()}</strong>
                </span>
              )}
              {riskReward && (
                <span className="text-muted-foreground">R/R <strong className="text-foreground">{riskReward}x</strong></span>
              )}
            </div>
          </>
        )}

        {finalState?.used_models && (
          <div className="ml-auto flex gap-1.5 flex-wrap">
            {(finalState.used_models.deep_think_model || finalState.used_models.model) && (
              <Badge variant="outline" className="text-[10px] bg-purple-500/5 text-purple-400 border-purple-400/20 gap-1 py-0.5">
                <BrainCircuit className="w-2.5 h-2.5" />
                {(finalState.used_models.deep_think_model || finalState.used_models.model || "").split("/").pop()?.split(" - ")[0]}
              </Badge>
            )}
            {finalState.used_models.quick_think_model && (
              <Badge variant="outline" className="text-[10px] bg-yellow-500/5 text-yellow-500 border-yellow-400/20 gap-1 py-0.5">
                <Zap className="w-2.5 h-2.5" />
                {finalState.used_models.quick_think_model.split("/").pop()?.split(" - ")[0]}
              </Badge>
            )}
          </div>
        )}
      </div>

      {execSummary && (
        <div className="rounded-xl border border-primary/15 bg-card/30 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Why this decision</span>
          </div>
          <Md>{execSummary}</Md>
        </div>
      )}

      {(bullPoints.length > 0 || bearPoints.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {bullPoints.length > 0 && (
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Bull Case</span>
              </div>
              <div className="space-y-1.5">
                {bullPoints.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bearPoints.length > 0 && (
            <div className="rounded-xl border border-red-400/15 bg-red-400/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-xs font-semibold text-red-400">Bear Case</span>
              </div>
              <div className="space-y-1.5">
                {bearPoints.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {forecasts.length > 0 && (
        <div className="rounded-xl border border-primary/10 bg-card/20 overflow-hidden">
          <div className="px-3 py-2 border-b border-primary/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">5-Day Forecast</span>
          </div>
          <div className="flex divide-x divide-primary/10">
            {forecasts.slice(0, 5).map((f: any, i: number) => {
              const up = f.signal === "UP";
              const dn = f.signal === "DOWN";
              return (
                <div key={i} className="flex-1 px-2 py-2.5 text-center min-w-0">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{f.day}</div>
                  <div className={`text-sm font-bold ${up ? "text-emerald-400" : dn ? "text-red-400" : "text-amber-400"}`}>
                    {up ? "▲" : dn ? "▼" : "—"}
                  </div>
                  <div className="text-[10px] font-semibold text-foreground truncate">${f.price?.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {agentOutputs.length > 0 && (
          <Collapse label="Agent Opinions" icon={BrainCircuit} iconColor="text-primary" badge={`${agentOutputs.length} agents`}>
            <div className="space-y-2">
              {agentOutputs.map((ao: any, i: number) => {
                const buy = ao.recommendation === "BUY";
                const sell = ao.recommendation === "SELL";
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <Badge variant="outline" className={`text-[9px] flex-shrink-0 mt-0.5 px-1.5 py-0 ${buy ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20" : sell ? "bg-red-400/10 text-red-400 border-red-400/20" : "bg-amber-400/10 text-amber-400 border-amber-400/20"}`}>
                      {ao.recommendation}
                    </Badge>
                    <span className="font-semibold text-foreground flex-shrink-0 min-w-[90px]">{ao.agent}</span>
                    <span className="text-muted-foreground line-clamp-2">{ao.summary}</span>
                  </div>
                );
              })}
            </div>
          </Collapse>
        )}

        {(researchVerdict || traderPlan || pmDecision) && (
          <Collapse label="Decision Chain" icon={Gavel} iconColor="text-yellow-400">
            <div className="space-y-4">
              {researchVerdict && (
                <div>
                  <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-1.5">
                    📋 Research Manager — Bull/Bear Verdict
                  </div>
                  <Md compact>{researchVerdict.substring(0, 800) + (researchVerdict.length > 800 ? "\n\n…" : "")}</Md>
                </div>
              )}
              {traderPlan && (
                <div>
                  <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
                    📈 Trader — Execution Plan
                  </div>
                  <Md compact>{traderPlan.substring(0, 800) + (traderPlan.length > 800 ? "\n\n…" : "")}</Md>
                </div>
              )}
              {pmDecision && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      🏦 Portfolio Manager — Final Decision
                    </span>
                    <Badge variant="outline" className="text-[8px] bg-emerald-400/10 text-emerald-400 border-emerald-400/20 py-0 px-1.5">Authoritative</Badge>
                  </div>
                  <Md compact>{pmDecision.substring(0, 800) + (pmDecision.length > 800 ? "\n\n…" : "")}</Md>
                </div>
              )}
            </div>
          </Collapse>
        )}

        {analystReports.length > 0 && (
          <Collapse label="Analyst Reports" icon={BookOpen} iconColor="text-blue-400" badge={`${analystReports.length} reports`}>
            <div className="space-y-4">
              {analystReports.map(({ key, label, icon: Icon, color: ic }) => (
                <div key={key}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${ic}`}>
                    <Icon className="w-3 h-3" /> {label}
                  </div>
                  <Md compact>{(finalState[key] || "").substring(0, 1000) + ((finalState[key] || "").length > 1000 ? "\n\n…" : "")}</Md>
                </div>
              ))}
            </div>
          </Collapse>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted-foreground">
          Analysis complete · {new Date().toLocaleDateString()}
        </span>
        <div className="flex gap-2">
          {onViewLogs && (
            <Button variant="outline" size="sm" onClick={onViewLogs}
              className="h-8 text-xs border-primary/15 hover:border-primary/40 text-muted-foreground hover:text-primary gap-1.5 bg-background/50">
              <Activity className="w-3.5 h-3.5" /> View Logs
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onReplay(ticker)}
            className="h-8 text-xs border-primary/15 hover:border-primary/40 text-muted-foreground hover:text-primary gap-1.5 bg-background/50">
            <RotateCcw className="w-3.5 h-3.5" /> Replay
          </Button>
        </div>
      </div>
    </div>
  )
}
