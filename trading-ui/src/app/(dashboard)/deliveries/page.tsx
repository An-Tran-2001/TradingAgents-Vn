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
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useLanguage } from "@/contexts/language-context"
import { getDeliveries, resendDelivery, createDelivery, Delivery } from "@/lib/api/deliveries"

export default function DeliveriesPage() {
  const [filter, setFilter] = useState("ALL")
  const [search, setSearch] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Delivery | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Broadcast state
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false)
  const [broadcastReportId, setBroadcastReportId] = useState("")
  const [broadcastChannel, setBroadcastChannel] = useState("EMAIL")
  const [broadcastRecipient, setBroadcastRecipient] = useState("")
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  
  const { t } = useLanguage()

  const fetchDeliveries = async () => {
    try {
      setIsLoading(true)
      const data = await getDeliveries()
      setDeliveries(data)
    } catch (error) {
      toast.error("Failed to load deliveries")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchDeliveries()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDeliveries()
    setIsRefreshing(false)
    toast("Sync Complete", { description: "Delivery history is up to date." })
  }

  const handleResend = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await resendDelivery(id)
      toast.success("Delivery Queued", { description: `Report has been queued for resending.` })
      fetchDeliveries()
    } catch (error) {
      toast.error("Failed to resend delivery")
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastReportId || !broadcastRecipient) {
      toast.error("Please fill all fields")
      return
    }
    
    try {
      setIsBroadcasting(true)
      await createDelivery(parseInt(broadcastReportId), broadcastChannel, broadcastRecipient)
      toast.success("Broadcast Queued", { description: "Your manual broadcast has been queued." })
      setIsBroadcastOpen(false)
      setBroadcastReportId("")
      setBroadcastRecipient("")
      fetchDeliveries()
    } catch (error) {
      toast.error("Failed to broadcast report")
    } finally {
      setIsBroadcasting(false)
    }
  }

  const filteredData = deliveries.filter(d => {
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
          <Button size="sm" className="gap-2" onClick={() => setIsBroadcastOpen(true)}>
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
                    DEL-{row.id}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground flex items-center gap-2">
                        {row.ticker}
                        <Badge variant="outline" className="text-[10px] py-0">REP-{row.report_id}</Badge>
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
                      {row.trigger_source}
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
                    {row.error_message && (
                      <div className="text-[10px] text-red-400 mt-1 line-clamp-1 max-w-[150px]" title={row.error_message}>
                        {row.error_message}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(row.sent_at).toLocaleString()}
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
              <Badge variant="outline" className="text-xs">REP-{selectedReport?.report_id}</Badge>
            </DialogTitle>
            <DialogDescription>
              {t("deliveries.dialog.deliveredTo" as any)} <strong className="text-foreground">{selectedReport?.recipient}</strong> {t("deliveries.dialog.via" as any)} {selectedReport?.channel} {t("deliveries.dialog.on" as any)} {selectedReport ? new Date(selectedReport.sent_at).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 bg-muted/20 p-5 rounded-xl border border-border/30 text-sm leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto font-mono text-foreground/90 custom-scrollbar shadow-inner">
            {selectedReport?.content}
          </div>
        </DialogContent>
      </Dialog>

      {/* MANUAL BROADCAST DIALOG */}
      <Dialog open={isBroadcastOpen} onOpenChange={setIsBroadcastOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("deliveries.manualBroadcast" as any) || "Manual Broadcast"}</DialogTitle>
            <DialogDescription>
              Enter the details to manually broadcast a report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="report-id" className="text-right">
                Report ID
              </Label>
              <Input
                id="report-id"
                type="number"
                value={broadcastReportId}
                onChange={(e) => setBroadcastReportId(e.target.value)}
                className="col-span-3"
                placeholder="e.g. 1"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel" className="text-right">
                Channel
              </Label>
              <div className="col-span-3">
                <Select value={broadcastChannel} onValueChange={setBroadcastChannel}>
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="TELEGRAM">Telegram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">
                Recipient
              </Label>
              <Input
                id="recipient"
                value={broadcastRecipient}
                onChange={(e) => setBroadcastRecipient(e.target.value)}
                className="col-span-3"
                placeholder="Email or Chat ID"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBroadcastOpen(false)}>Cancel</Button>
            <Button onClick={handleBroadcast} disabled={isBroadcasting}>
              {isBroadcasting ? "Sending..." : "Broadcast"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
