import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CliLogViewer } from "../../research/components/CliLogViewer"
import { fetchReportLogs } from "../api"
import { AgentLog } from "../types"
import { Loader2 } from "lucide-react"

interface ReportCliDialogProps {
  reportId: string | number | null
  isOpen: boolean
  onClose: () => void
}

export const ReportCliDialog: React.FC<ReportCliDialogProps> = ({
  reportId,
  isOpen,
  onClose
}) => {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeLogTab, setActiveLogTab] = useState<string>("All")

  useEffect(() => {
    if (isOpen && reportId) {
      const loadLogs = async () => {
        try {
          setIsLoading(true)
          const fetchedLogs = await fetchReportLogs(reportId)
          setLogs(fetchedLogs)
        } catch (error) {
          console.error("Failed to load report logs", error)
        } finally {
          setIsLoading(false)
        }
      }
      loadLogs()
    } else {
      setLogs([])
    }
  }, [isOpen, reportId])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-background/95 border-primary/30 backdrop-blur-xl shadow-[0_0_50px_rgba(0,240,255,0.1)]">
        <DialogHeader className="p-4 border-b border-primary/20 shrink-0 bg-black/40">
          <DialogTitle className="text-primary tracking-widest text-sm font-mono uppercase flex items-center gap-2">
            Execution Logs <span className="text-muted-foreground text-xs font-normal">| ID: {reportId}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <CliLogViewer 
              logs={logs as any} 
              logAnimationStep={12} // Fully complete step to show everything
              activeLogTab={activeLogTab as any}
              setActiveLogTab={setActiveLogTab as any}
              isTyping={false}
              isExpanded={false}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
