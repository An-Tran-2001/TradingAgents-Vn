import React from "react"
import { History, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

// Mock History
const MOCK_HISTORY = [
  { id: "1", ticker: "AAPL", date: "Today, 10:45 AM", title: "Technical Breakout Analysis" },
  { id: "2", ticker: "TSLA", date: "Yesterday", title: "Sentiment Scan" },
  { id: "3", ticker: "BTC-USD", date: "Jun 01", title: "Crypto Flash Crash Review" },
  { id: "4", ticker: "NVDA", date: "May 28", title: "Earnings Preview" },
]

export const HistorySidebar: React.FC<HistorySidebarProps> = ({ isOpen, onClose }) => {
  return (
    <div 
      className={`flex flex-col bg-background/80 backdrop-blur-md transition-all duration-300 z-20 overflow-hidden shrink-0 ${
        isOpen ? "w-72 border-r border-border/50" : "w-0 border-r-0"
      }`}
    >
      <div className="p-4 border-b border-border/50 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 w-72">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">Chat History</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 w-72 custom-scrollbar">
        <div className="p-3 space-y-2">
          {MOCK_HISTORY.map((hist) => (
            <div 
              key={hist.id} 
              className="p-3 rounded-xl border border-primary/10 bg-card/30 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">{hist.ticker}</span>
                <span className="text-[10px] text-muted-foreground">{hist.date}</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">{hist.title}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
