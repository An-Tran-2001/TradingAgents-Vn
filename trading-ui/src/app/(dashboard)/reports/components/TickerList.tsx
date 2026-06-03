import React, { useState } from "react"
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TickerInfo } from "../types"

export const REC = {
  BUY:  { color: "text-green-400",  bg: "bg-green-400/10",  border: "border-green-400/30",  icon: <TrendingUp  className="w-3.5 h-3.5"/> },
  HOLD: { color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: <Minus       className="w-3.5 h-3.5"/> },
  SELL: { color: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: <TrendingDown className="w-3.5 h-3.5"/> },
}

interface TickerListProps {
  tickers: TickerInfo[]
  selectedTicker: TickerInfo
  onSelectTicker: (ticker: TickerInfo) => void
}

export const TickerList: React.FC<TickerListProps> = ({
  tickers,
  selectedTicker,
  onSelectTicker,
}) => {
  const { t } = useLanguage()
  const [search, setSearch] = useState("")

  const filteredTickers = tickers.filter(d =>
    !search || 
    d.ticker.toLowerCase().includes(search.toLowerCase()) || 
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalReportsCount = selectedTicker.reportCount
  // We don't have all reports here anymore, so we can't easily calculate bias unless we return it from backend.
  // For now, let's mock it based on total or just hide the breakdown, or assume it's mostly the latest.
  const bCount = selectedTicker.latestRecommendation === "BUY" ? 1 : 0
  const hCount = selectedTicker.latestRecommendation === "HOLD" ? 1 : 0
  const sCount = selectedTicker.latestRecommendation === "SELL" ? 1 : 0

  return (
    <div className="w-56 border-r border-border/50 flex flex-col bg-background/60 backdrop-blur-md shrink-0 z-10">
      <div className="p-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground"/>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder={t("reports.searchPlaceholder")} 
            className="w-full pl-8 pr-3 py-2 text-xs bg-background/60 border border-primary/20 rounded-xl outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 custom-scrollbar">
        <div className="p-2 space-y-1">
          {filteredTickers.map(tickerItem => {
            const cfg = REC[tickerItem.latestRecommendation || "HOLD"]
            const isActive = selectedTicker.ticker === tickerItem.ticker
            return (
              <button 
                key={tickerItem.ticker} 
                onClick={() => onSelectTicker(tickerItem)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all border ${
                  isActive
                    ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(0,240,255,0.08)]"
                    : "hover:bg-muted/30 border-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-bold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>
                      {tickerItem.ticker}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                      {tickerItem.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {tickerItem.reportCount} {t("reports.reportsCount")}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {tickerItem.latestRecommendation}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
      
      {/* Ticker stats */}
      <div className="p-3 border-t border-border/30 space-y-1.5">
        <div className="text-[10px] text-muted-foreground">{t("reports.overallBias")} — {selectedTicker.ticker}</div>
        <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
          <div className="bg-green-400/70 rounded-l-full" style={{ width: `${(bCount / totalReportsCount) * 100}%` }} />
          <div className="bg-yellow-400/70" style={{ width: `${(hCount / totalReportsCount) * 100}%` }} />
          {sCount > 0 && (
            <div className="bg-red-400/70 rounded-r-full" style={{ width: `${(sCount / totalReportsCount) * 100}%` }} />
          )}
        </div>
        <div className="flex justify-between text-[9px]">
          <span className="text-green-400">{bCount}B</span>
          <span className="text-yellow-400">{hCount}H</span>
          <span className="text-red-400">{sCount}S</span>
        </div>
      </div>
    </div>
  )
}
