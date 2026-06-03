"use client"

import React, { useState, useEffect } from "react"
import { type TickerInfo, type DayReport } from "./types"
import { TickerList } from "./components/TickerList"
import { ReportsList } from "./components/ReportsList"
import { DetailPanel } from "./components/DetailPanel"
import { ReportCliDialog } from "./components/ReportCliDialog"
import { fetchTickers, fetchReportsByTicker } from "./api"
import { Loader2, Database } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"

export default function ReportsPage() {
  const [tickers, setTickers] = useState<TickerInfo[]>([])
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo | null>(null)
  const [reports, setReports] = useState<DayReport[]>([])
  const [selectedReport, setSelectedReport] = useState<DayReport | null>(null)
  const [isCliOpen, setIsCliOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setHasError(false)
        const data = await fetchTickers()
        setTickers(data)
        if (data.length > 0) {
          setSelectedTicker(data[0])
        }
      } catch (error) {
        console.error("Failed to load tickers:", error)
        setHasError(true)
        toast.error("Failed to load reports from backend")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    async function loadReports() {
      if (!selectedTicker) return;
      try {
        const data = await fetchReportsByTicker(selectedTicker.ticker);
        setReports(data);
        if (data.length > 0) {
          setSelectedReport(data[0]);
        } else {
          setSelectedReport(null);
        }
      } catch (error) {
        console.error("Failed to load reports for ticker", error);
        toast.error("Failed to load ticker reports");
      }
    }
    loadReports();
  }, [selectedTicker]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background/50 relative">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (hasError || tickers.length === 0 || !selectedTicker) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-background/50 relative text-muted-foreground gap-4">
        <Database className="w-12 h-12 opacity-20" />
        <p>{hasError ? "Unable to connect to the server." : "No reports generated yet."}</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background/50 relative">
      <div className="cyber-grid pointer-events-none"/>

      {/* LEFT: Ticker List sidebar */}
      <TickerList 
        tickers={tickers}
        selectedTicker={selectedTicker}
        onSelectTicker={(ticker) => {
          setSelectedTicker(ticker)
          setSelectedReport(null)
        }}
      />

      {/* CENTER: Report List feed */}
      <ReportsList 
        selectedTicker={selectedTicker}
        reports={reports}
        selectedReport={selectedReport}
        onSelectReport={setSelectedReport}
      />

      {/* RIGHT: Detail Panel drawer */}
      {selectedReport && (
        <DetailPanel 
          ticker={selectedTicker} 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)}
          onViewLogs={() => setIsCliOpen(true)}
        />
      )}

      <ReportCliDialog 
        reportId={selectedReport?.id || null} 
        isOpen={isCliOpen} 
        onClose={() => setIsCliOpen(false)} 
      />
    </div>
  )
}
