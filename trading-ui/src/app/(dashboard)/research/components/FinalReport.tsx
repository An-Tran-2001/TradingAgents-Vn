import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { 
  BarChart3, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Newspaper, 
  LineChart, 
  MessageSquare, 
  BookOpen, 
  ShieldAlert, 
  Gavel,
  Cpu,
  BrainCircuit,
  Zap,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

interface FinalReportProps {
  ticker: string
  finalState: any
  onReplay: (ticker: string) => void
  onViewLogs?: () => void
}

export const FinalReport: React.FC<FinalReportProps> = ({ ticker, finalState, onReplay, onViewLogs }) => {
  // Extract final trade decision and determine color
  const decision = finalState.final_trade_decision || ""
  const isBullish = decision.toLowerCase().includes("buy") || decision.toLowerCase().includes("bullish")
  const isBearish = decision.toLowerCase().includes("sell") || decision.toLowerCase().includes("bearish")
  
  let DecisionIcon = Minus
  let decisionColor = "text-muted-foreground"
  let decisionBg = "bg-muted/10 border-muted/20"
  
  if (isBullish) {
    DecisionIcon = TrendingUp
    decisionColor = "text-emerald-500"
    decisionBg = "bg-emerald-500/10 border-emerald-500/20"
  } else if (isBearish) {
    DecisionIcon = TrendingDown
    decisionColor = "text-destructive"
    decisionBg = "bg-destructive/10 border-destructive/20"
  }

  const renderText = (text: string) => {
    if (!text) return "No data available."
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header & Main Decision */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border border-primary/10 bg-card/40 backdrop-blur-sm shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none">
          <DecisionIcon className={`w-full h-full ${decisionColor}`} />
        </div>
        
        <div className="z-10 space-y-1">
          <h3 className="text-xl font-bold tracking-tight">Research Complete</h3>
          <p className="text-sm text-muted-foreground">
            Pipeline synthesis for <strong className="text-foreground">{ticker || "Asset"}</strong> has concluded.
          </p>
          
          {finalState.used_models && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex gap-1.5 py-0.5">
                <Cpu className="h-3 w-3" />
                {finalState.used_models.provider.charAt(0).toUpperCase() + finalState.used_models.provider.slice(1)}
              </Badge>
              {finalState.used_models.model ? (
                <Badge variant="outline" className="bg-primary/5 text-muted-foreground border-primary/20 flex gap-1.5 py-0.5">
                  <Cpu className="h-3 w-3" />
                  {finalState.used_models.model.split(" - ")[0]}
                </Badge>
              ) : (
                <>
                  {finalState.used_models.quick_think_model && (
                    <Badge variant="outline" className="bg-yellow-500/5 text-yellow-500 border-yellow-500/20 flex gap-1.5 py-0.5">
                      <Zap className="h-3 w-3" />
                      {finalState.used_models.quick_think_model.split(" - ")[0]}
                    </Badge>
                  )}
                  {finalState.used_models.deep_think_model && (
                    <Badge variant="outline" className="bg-purple-500/5 text-purple-400 border-purple-500/20 flex gap-1.5 py-0.5">
                      <BrainCircuit className="h-3 w-3" />
                      {finalState.used_models.deep_think_model.split(" - ")[0]}
                    </Badge>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className={`z-10 flex items-center gap-3 px-4 py-3 rounded-xl border ${decisionBg} backdrop-blur-md`}>
          <div className={`p-2 rounded-lg bg-background/50 ${decisionColor}`}>
            <DecisionIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Final Recommendation</span>
            <span className={`text-lg font-black tracking-tight uppercase ${decisionColor}`}>
              {decision.split('\n')[0].substring(0, 50) || "HOLD"}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="plan" className="w-full">
        <TabsList className="w-full justify-start border-b border-primary/10 rounded-none bg-transparent p-0 h-auto space-x-6 overflow-x-auto">
          <TabsTrigger value="plan" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs uppercase tracking-wider font-semibold">
            Investment Plan
          </TabsTrigger>
          <TabsTrigger value="reports" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs uppercase tracking-wider font-semibold">
            Analyst Reports
          </TabsTrigger>
          <TabsTrigger value="debates" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-3 text-xs uppercase tracking-wider font-semibold">
            Committee Debates
          </TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Investment Plan */}
        <TabsContent value="plan" className="pt-4">
          <div className="rounded-xl bg-card/30 p-5 border border-primary/5 shadow-sm">
            <h4 className="font-semibold mb-4 flex items-center gap-2 text-primary">
              <BarChart3 className="h-4 w-4" /> Comprehensive Strategy
            </h4>
            {renderText(finalState.investment_plan || finalState.trader_investment_plan)}
          </div>
        </TabsContent>

        {/* Tab 2: Analyst Reports */}
        <TabsContent value="reports" className="pt-4">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {finalState.fundamentals_report && (
              <AccordionItem value="fundamentals" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500"><BookOpen className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Fundamentals Report</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.fundamentals_report)}
                </AccordionContent>
              </AccordionItem>
            )}
            
            {finalState.market_report && (
              <AccordionItem value="market" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500"><LineChart className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Market & Technical Report</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.market_report)}
                </AccordionContent>
              </AccordionItem>
            )}

            {finalState.sentiment_report && (
              <AccordionItem value="sentiment" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-pink-500/10 text-pink-500"><MessageSquare className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Social Sentiment Report</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.sentiment_report)}
                </AccordionContent>
              </AccordionItem>
            )}

            {finalState.news_report && (
              <AccordionItem value="news" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-orange-500/10 text-orange-500"><Newspaper className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">News & Catalyst Report</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.news_report)}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </TabsContent>

        {/* Tab 3: Debates */}
        <TabsContent value="debates" className="pt-4">
          <Accordion type="multiple" className="w-full space-y-2">
            {finalState.investment_debate_state?.judge_decision && (
              <AccordionItem value="invest_debate" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-yellow-500/10 text-yellow-500"><Gavel className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Investment Committee Decision</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.investment_debate_state.judge_decision)}
                </AccordionContent>
              </AccordionItem>
            )}

            {finalState.risk_debate_state?.judge_decision && (
              <AccordionItem value="risk_debate" className="border border-primary/10 rounded-xl px-4 bg-card/30">
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-red-500/10 text-red-500"><ShieldAlert className="h-4 w-4" /></div>
                    <span className="font-semibold text-sm">Risk Committee Decision</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-muted-foreground text-sm">
                  {renderText(finalState.risk_debate_state.judge_decision)}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="pt-4 flex justify-end gap-3">
        {onViewLogs && (
          <Button 
            variant="outline" 
            onClick={onViewLogs}
            className="text-sm h-9 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-2 bg-background/50 backdrop-blur-sm"
          >
            <Activity className="h-4 w-4" /> View Execution Logs
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={() => onReplay(ticker)}
          className="text-sm h-9 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-2 bg-background/50 backdrop-blur-sm"
        >
          <RotateCcw className="h-4 w-4" /> Replay Complete Workflow
        </Button>
      </div>
    </div>
  )
}
