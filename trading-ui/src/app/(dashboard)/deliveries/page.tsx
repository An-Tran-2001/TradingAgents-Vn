"use client"

import React, { useState } from "react"
import { Send, Mail, MessageSquare, AlertCircle, CheckCircle, Clock, RefreshCw, Filter, Search, RotateCcw, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

// Mock data for demonstration
const MOCK_DELIVERIES = [
  { id: "DEL-1042", reportId: "REP-992", ticker: "AAPL", channel: "EMAIL", recipient: "investor@example.com", source: "AUTO_JOB", status: "SUCCESS", time: "10 mins ago", error: null, content: "AAPL (Apple Inc.) - Daily Analysis Report\n\nRecommendation: BUY\nConfidence: 85%\nTarget Price: $195.00\n\nSummary:\nApple shows strong bullish momentum following the latest WWDC announcements. The supply chain has stabilized and consumer demand for the next iPhone cycle appears extremely robust. Technicals indicate a breakout above the 50-day moving average.\n\nRisk Assessment:\nLow risk. Keep an eye on global tariff negotiations." },
  { id: "DEL-1041", reportId: "REP-991", ticker: "TSLA", channel: "TELEGRAM", recipient: "@trading_group", source: "BOT_COMMAND", status: "SUCCESS", time: "1 hour ago", error: null, content: "TSLA (Tesla Inc.) - Flash Update\n\nRecommendation: HOLD\nConfidence: 60%\n\nSummary:\nTesla deliveries met expectations but margins remain under pressure. The stock is currently trading in a tight range. Wait for clear breakout signals before committing capital." },
  { id: "DEL-1040", reportId: "REP-990", ticker: "NVDA", channel: "EMAIL", recipient: "manager@fund.com", source: "MANUAL_CLICK", status: "FAILED", time: "2 hours ago", error: "SMTP Connection Timeout", content: "NVDA (NVIDIA Corp) - Urgent Buy Signal\n\nRecommendation: BUY\nConfidence: 95%\n\nSummary:\nUnprecedented demand for H200 chips. Data center revenue projected to beat estimates by 20%. Price target upgraded." },
  { id: "DEL-1039", reportId: "REP-989", ticker: "BTC", channel: "TELEGRAM", recipient: "124958192", source: "AUTO_JOB", status: "PENDING", time: "Just now", error: null, content: "BTC (Bitcoin) - Hourly Scan\n\nRecommendation: SELL\nConfidence: 70%\n\nSummary:\nShort-term bearish divergence on the 4H chart. Expecting a pullback to the $62k support level before any continuation." },
  { id: "DEL-1038", reportId: "REP-988", ticker: "MSFT", channel: "EMAIL", recipient: "board@example.com", source: "AUTO_JOB", status: "SUCCESS", time: "1 day ago", error: null, content: "MSFT (Microsoft) - Weekly Report\n\nRecommendation: BUY\nConfidence: 90%\n\nSummary:\nCloud computing sector growth remains unmatched. Copilot integration across enterprise software is driving strong recurring revenue." },
]

export default function DeliveriesPage() {
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  
  const { t } = useLanguage()

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
      toast("Sync Complete", { description: "Delivery history is up to date." })
    }, 1000)
  }

  const handleResend = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toast.success("Delivery Queued", { description: `Report for ${id} has been queued for resending.` })
  }

  const filteredData = MOCK_DELIVERIES.filter(d => {
    if (filter !== "ALL" && d.status !== filter) return false
    if (search && !d.ticker.toLowerCase().includes(search.toLowerCase()) && !d.recipient.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t("deliveries.title" as any)}</h1>
          <p className="text-muted-foreground">
            {t("deliveries.subtitle" as any)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("deliveries.refresh" as any)}
          </Button>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            {t("deliveries.manualBroadcast" as any)}
          </Button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-4 bg-card/30 p-4 rounded-xl border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder={t("deliveries.search" as any)} 
            className="pl-9 bg-background/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px] bg-background/50">
              <SelectValue placeholder={t("deliveries.status" as any)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("deliveries.allStatuses" as any)}</SelectItem>
              <SelectItem value="SUCCESS">{t("deliveries.success" as any)}</SelectItem>
              <SelectItem value="FAILED">{t("deliveries.failed" as any)}</SelectItem>
              <SelectItem value="PENDING">{t("deliveries.pending" as any)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="w-[120px]">{t("deliveries.table.id" as any)}</TableHead>
              <TableHead>{t("deliveries.table.target" as any)}</TableHead>
              <TableHead>{t("deliveries.table.channel" as any)}</TableHead>
              <TableHead>{t("deliveries.table.source" as any)}</TableHead>
              <TableHead>{t("deliveries.table.status" as any)}</TableHead>
              <TableHead>{t("deliveries.table.time" as any)}</TableHead>
              <TableHead className="text-right">{t("deliveries.table.actions" as any)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("deliveries.table.noLogs" as any)}
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {row.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        {row.ticker}
                        <Badge variant="outline" className="text-[10px] py-0">{row.reportId}</Badge>
                      </span>
                      <span className="text-xs text-muted-foreground">{row.recipient}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.channel === "EMAIL" ? (
                      <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                        <Mail className="h-3 w-3" /> Email
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">
                        <MessageSquare className="h-3 w-3" /> Telegram
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted/50 px-2 py-1 rounded-md">
                      {row.source}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {row.status === "SUCCESS" && <CheckCircle className="h-4 w-4 text-green-400" />}
                      {row.status === "FAILED" && <AlertCircle className="h-4 w-4 text-red-400" />}
                      {row.status === "PENDING" && <Clock className="h-4 w-4 text-yellow-400" />}
                      <span className={`text-xs font-bold ${
                        row.status === "SUCCESS" ? "text-green-400" :
                        row.status === "FAILED" ? "text-red-400" : "text-yellow-400"
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    {row.error && (
                      <div className="text-[10px] text-red-400 mt-1 line-clamp-1 max-w-[150px]" title={row.error}>
                        {row.error}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.time}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1 text-xs"
                        onClick={() => setSelectedReport(row)}
                      >
                        <Eye className="h-3 w-3" />
                        {t("deliveries.action.view" as any)}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-1 text-xs"
                        onClick={(e) => handleResend(row.id, e)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t("deliveries.action.resend" as any)}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* REPORT VIEWER DIALOG */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-2xl bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Mail className="h-5 w-5 text-primary" />
              {t("deliveries.dialog.title" as any)} {selectedReport?.ticker}
              <Badge variant="outline" className="text-xs">{selectedReport?.reportId}</Badge>
            </DialogTitle>
            <DialogDescription>
              {t("deliveries.dialog.deliveredTo" as any)} <strong className="text-foreground">{selectedReport?.recipient}</strong> {t("deliveries.dialog.via" as any)} {selectedReport?.channel} {t("deliveries.dialog.on" as any)} {selectedReport?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-muted/20 p-5 rounded-xl border border-border/30 text-sm leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto font-mono text-foreground/90 custom-scrollbar shadow-inner">
            {selectedReport?.content}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
