import React, { useState, useEffect, useRef } from "react"
import { 
  TerminalSquare, Loader2
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { TradingJob } from "./types"
import { fetchJobLogs } from "../api"

interface JobLogDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedJob: TradingJob | null
}

export const JobLogDialog: React.FC<JobLogDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedJob,
}) => {
  const { t } = useLanguage()
  const [activeLogTab, setActiveLogTab] = useState<string>("All")
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && selectedJob) {
      setActiveLogTab("All")
      loadLogs()
    }
  }, [isOpen, selectedJob])

  const loadLogs = async () => {
    if (!selectedJob) return
    try {
      setIsLoading(true)
      const data = await fetchJobLogs(selectedJob.id)
      setLogs(data)
    } catch (error) {
      console.error("Failed to load logs:", error)
      setLogs([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, activeLogTab])

  const filteredLogs = activeLogTab === "All" ? logs : logs.filter(l => l.agent === activeLogTab)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 border border-primary/30 bg-[#0a0a0f] text-green-500 overflow-hidden font-mono text-sm shadow-[0_0_50px_rgba(0,240,255,0.15)] rounded-lg">
        
        {/* Top Bar (Header) */}
        <div className="flex items-center justify-between p-2 px-4 border-b border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase">
            <TerminalSquare className="w-4 h-4" /> 
            Pipeline_Execution_Log 
            <span className="text-muted-foreground ml-2">:: {selectedJob?.ticker}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={() => onOpenChange(false)}></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          <div className="flex-1 flex flex-col min-w-0">
            <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
              {t("jobs.create").includes("Tạo") ? "TIN NHẮN & CÔNG CỤ TỪ CSDL" : "REAL-TIME LOGS FROM DB"}
            </div>
            
            {/* Sub-Tabs for Agents */}
            <div className="flex border-b border-primary/20 overflow-x-auto custom-scrollbar shrink-0">
              {["All", "Fundamentals Analyst", "Sentiment Analyst", "News Analyst", "Technical Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Risk Management", "Portfolio Manager", "Trader"].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveLogTab(tab)}
                  className={`px-4 py-2 text-[11px] uppercase tracking-wider transition-colors border-r border-primary/20 whitespace-nowrap ${
                    activeLogTab === tab 
                      ? "bg-primary/20 text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(0,240,255,1)]" 
                      : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                  }`}
                >
                  {tab === "All" 
                    ? (t("jobs.create").includes("Tạo") ? "Tất cả" : "All") 
                    : tab.replace(" Analyst", "").replace(" Researcher", "").replace(" Management", "").replace(" Manager", "")}
                </button>
              ))}
            </div>

            {/* Log Table Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-black/60 relative custom-scrollbar">
              <table className="w-full text-xs text-left table-fixed">
                <thead className="text-muted-foreground sticky top-0 bg-[#0a0a0f] z-10 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.5)]">
                  <tr>
                    <th className="pb-3 w-[80px] font-normal">Time</th>
                    <th className="pb-3 w-[160px] font-normal">Agent</th>
                    <th className="pb-3 w-[80px] font-normal">Type</th>
                    <th className="font-normal">Content</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {filteredLogs.map((log, i) => (
                    <tr key={i} className="border-t border-primary/10 hover:bg-primary/5 transition-colors">
                      <td className="py-3 text-muted-foreground truncate">{log.time}</td>
                      <td className="py-3 text-foreground font-semibold truncate">{log.agent}</td>
                      <td className="py-3 truncate">
                        <span className="text-pink-500 bg-pink-500/10 px-1.5 py-0.5 rounded">{log.type}</span>
                      </td>
                      <td className="py-3 text-green-400 break-words whitespace-normal pr-2">
                        {log.content.includes("**Reasoning**") ? (
                          <span><span className="text-yellow-400 font-bold">Reasoning:</span> {log.content.replace("**Reasoning**: ", "")}</span>
                        ) : log.content.includes("**Action**") ? (
                          <span><span className="text-primary font-bold">Action:</span> {log.content.replace("**Action**: ", "")}</span>
                        ) : log.content.includes("**Synthesis**") ? (
                          <span><span className="text-purple-400 font-bold">Synthesis:</span> {log.content.replace("**Synthesis**: ", "")}</span>
                        ) : (
                          log.content
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground font-mono text-xs">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Fetching logs from database...
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {!isLoading && filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-muted-foreground font-mono text-xs">
                         {t("jobs.create").includes("Tạo") ? "Chưa có dữ liệu chạy thực tế. Hệ thống Cron chưa được kích hoạt để thực thi job này." : "No actual execution logs found. The Cron engine has not been activated to run this job yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div ref={logEndRef} className="h-4 w-full"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
