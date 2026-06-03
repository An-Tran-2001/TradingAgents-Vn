import React from "react"
import { 
  Activity, Cpu, ArrowUpRight, ArrowDownRight, Clock, Target, ChevronRight 
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TickerInfo, DayReport } from "../types"
import { REC } from "./TickerList"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ReportsListProps {
  selectedTicker: TickerInfo
  reports: DayReport[]
  selectedReport: DayReport | null
  onSelectReport: (report: DayReport | null) => void
}

export const ReportsList: React.FC<ReportsListProps> = ({
  selectedTicker,
  reports,
  selectedReport,
  onSelectReport,
}) => {
  const { t } = useLanguage()
  const lastReport = reports.length > 0 ? reports[0] : null

  return (
    <div className="flex-1 flex flex-col overflow-hidden z-10">
      {/* Header */}
      <div className="p-4 border-b border-border/50 bg-background/80 backdrop-blur shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{selectedTicker.ticker}</span>
              <span className="text-muted-foreground text-sm">{selectedTicker.name}</span>
              <Badge variant="outline" className="text-[10px] border-primary/20 text-muted-foreground">
                {selectedTicker.type}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-primary"/> 
                {reports.length} {t("reports.analyses")}
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3"/> 10 {t("reports.agentsPerRun")}
              </span>
            </div>
          </div>
          <div className="text-right">
            {lastReport ? (
              <>
                <div className="text-2xl font-bold font-mono">
                  {selectedTicker.currency}{lastReport.price.toLocaleString()}
                </div>
                <div className={`text-sm flex items-center justify-end gap-1 ${
                  lastReport.change > 0 ? "text-green-400" : "text-red-400"
                }`}>
                  {lastReport.change > 0 ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                  {lastReport.change > 0 ? "+" : ""}{lastReport.change}%
                </div>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No reports available</div>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-4 space-y-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            {t("reports.listTitle")}
          </div>
          {reports.map((r, i) => {
            const cfg = REC[r.recommendation]
            const isSelected = selectedReport?.id === r.id
            const hasForecast = r.forecast && r.forecast.length > 0;
            const lastForecastIndex = hasForecast ? r.forecast.length - 1 : 0;
            const targetForecast = hasForecast ? r.forecast[lastForecastIndex] : null;
            
            const forecastReturn = targetForecast && r.price 
              ? (((targetForecast.price - r.price) / r.price) * 100).toFixed(1) 
              : "0.0";
            const forecastPositive = targetForecast ? targetForecast.price > r.price : false;
            
            return (
              <div 
                key={r.id} 
                onClick={() => onSelectReport(isSelected ? null : r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 ${
                  isSelected
                    ? `${cfg.bg} ${cfg.border} shadow-[0_0_20px_rgba(0,0,0,0.3)]`
                    : "bg-card/30 border-border/30 hover:border-primary/30 hover:bg-card/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3"/> {r.date}
                    </span>
                    {i === 0 && (
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                        {t("reports.latest")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {selectedTicker.currency}{r.price.toLocaleString()}
                    </span>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {cfg.icon} {r.recommendation}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-3 markdown-terminal [&_p]:my-0 [&_ul]:my-0 [&_li]:my-0 [&_strong]:text-primary [&_strong]:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.summary}</ReactMarkdown>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Confidence */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          r.confidence >= 80 ? "bg-green-400" : r.confidence >= 60 ? "bg-yellow-400" : "bg-red-400"
                        }`} 
                        style={{ width: `${r.confidence}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${cfg.color}`}>{r.confidence}%</span>
                  </div>
                  
                  {/* Forecast preview */}
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    forecastPositive ? "text-green-400" : "text-red-400"
                  }`}>
                    {forecastPositive ? <ArrowUpRight className="w-3.5 h-3.5"/> : <ArrowDownRight className="w-3.5 h-3.5"/>}
                    {hasForecast ? r.forecast.length : 0}d: {forecastPositive ? "+" : ""}{forecastReturn}%
                  </div>
                  
                  {/* Target */}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3 text-green-400/60"/> 
                    <span className="font-mono">{selectedTicker.currency}{r.targetPrice.toLocaleString()}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isSelected ? "rotate-90" : ""
                  }`}/>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
