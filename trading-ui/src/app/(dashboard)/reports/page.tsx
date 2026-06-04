"use client"

import React, { useState, useEffect } from "react"
import { type TickerInfo, type DayReport } from "./types"
import { TickerList } from "./components/TickerList"
import { ReportsList } from "./components/ReportsList"
import { DetailPanel } from "./components/DetailPanel"
import { ReportCliDialog } from "./components/ReportCliDialog"
import { fetchTickers, fetchReportsByTicker, deleteReport, deleteTickerReports } from "./api"
import { Loader2, Database, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function ReportsPage() {
  const [tickers, setTickers] = useState<TickerInfo[]>([])
  const [selectedTicker, setSelectedTicker] = useState<TickerInfo | null>(null)
  const [reports, setReports] = useState<DayReport[]>([])
  const [selectedReport, setSelectedReport] = useState<DayReport | null>(null)
  const [isCliOpen, setIsCliOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'report' | 'ticker', id: string | number, name: string } | null>(null)
  const { t } = useLanguage()

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      if (deleteTarget.type === 'report') {
        await deleteReport(deleteTarget.id)
        toast.success(t("reports.reportDeletedSuccess") || "Report deleted successfully")
        setReports(prev => prev.filter(r => r.id !== deleteTarget.id))
        if (selectedReport?.id === deleteTarget.id) setSelectedReport(null)
      } else {
        await deleteTickerReports(deleteTarget.name)
        toast.success(t("reports.tickerDeletedSuccess") || "Ticker deleted successfully")
      }
      
      const updatedTickers = await fetchTickers()
      setTickers(updatedTickers)
      
      if (deleteTarget.type === 'ticker' && selectedTicker?.ticker === deleteTarget.name) {
        setSelectedTicker(updatedTickers[0] || null)
        setSelectedReport(null)
      } else if (selectedTicker && !updatedTickers.find(t => t.ticker === selectedTicker.ticker)) {
        setSelectedTicker(updatedTickers[0] || null)
        setSelectedReport(null)
      }
    } catch (err) {
      toast.error(t("reports.deleteFailed") || "Failed to delete")
      console.error(err)
    } finally {
      setDeleteTarget(null)
    }
  }

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
        onRequestDelete={(ticker) => setDeleteTarget({ type: 'ticker', id: ticker.ticker, name: ticker.ticker })}
      />

      {/* CENTER: Report List feed */}
      <ReportsList 
        selectedTicker={selectedTicker}
        reports={reports}
        selectedReport={selectedReport}
        onSelectReport={setSelectedReport}
        onRequestDelete={(reportId) => setDeleteTarget({ type: 'report', id: reportId, name: 'Report' })}
      />

      {/* RIGHT: Detail Panel drawer */}
      {selectedReport && (
        <DetailPanel 
          ticker={selectedTicker} 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)}
          onViewLogs={() => setIsCliOpen(true)}
          onRequestDelete={(reportId) => setDeleteTarget({ type: 'report', id: reportId, name: 'Report' })}
        />
      )}

      <ReportCliDialog 
        reportId={selectedReport?.id || null} 
        isOpen={isCliOpen} 
        onClose={() => setIsCliOpen(false)} 
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md border-border/50 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              {deleteTarget?.type === 'ticker' 
                ? t("reports.confirmDeleteTickerTitle") || "Delete Ticker" 
                : t("reports.confirmDeleteReportTitle") || "Delete Report"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-3">
              {deleteTarget?.type === 'ticker' 
                ? t("reports.confirmDeleteTickerDesc") || `Are you sure you want to hide all reports for ${deleteTarget.name}? They will remain in your chat history.`
                : t("reports.confirmDeleteReportDesc") || "Are you sure you want to hide this report? It will remain in your chat history."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDelete}>
              {t("common.confirm") || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
