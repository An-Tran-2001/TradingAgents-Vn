import React, { useState, useEffect, useRef } from "react"
import { 
  TerminalSquare, Activity, FileText, MessageSquare, Newspaper, 
  TrendingUp, TrendingDown, BrainCircuit, Scale, ShieldAlert, 
  Briefcase, Clock, Network 
} from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { TradingJob } from "./types"

// Mock Log Data
const cliLogsData = [
  { step: 1, time: "16:45:01", agent: "Fundamentals Analyst", type: "Agent", content: "**Action**: Evaluating company financials and SEC filings. PE ratio indicates slight overvaluation." },
  { step: 2, time: "16:45:03", agent: "Sentiment Analyst", type: "Agent", content: "**Action**: Scanning Reddit and StockTwits. Social sentiment is highly bullish." },
  { step: 3, time: "16:45:05", agent: "News Analyst", type: "Agent", content: "**Action**: Monitoring macroeconomic indicators. Fed rate decision pending, market cautious." },
  { step: 4, time: "16:45:07", agent: "Technical Analyst", type: "Agent", content: "**Action**: MACD crossing signal line. RSI at 65. Short-term bullish momentum detected." },
  
  { step: 5, time: "16:45:10", agent: "Bull Researcher", type: "Agent", content: "**Reasoning**: Technical breakout aligns with strong social sentiment. Accumulation phase verified." },
  { step: 6, time: "16:45:12", agent: "Bear Researcher", type: "Agent", content: "**Reasoning**: Macro headwinds and overvaluation present high risk. Suggest waiting for pullback." },
  { step: 7, time: "16:45:15", agent: "Research Manager", type: "Agent", content: "**Synthesis**: Bullish thesis accepted due to technical momentum, but scaling in recommended due to macro risks." },
  
  { step: 8, time: "16:45:18", agent: "Risk Management", type: "Agent", content: "**Action**: Assessing portfolio exposure. Volatility is within acceptable ATR boundaries. Approving risk." },
  { step: 9, time: "16:45:20", agent: "Portfolio Manager", type: "Agent", content: "**Synthesis**: Finalizing allocation. Approving 1.5% position sizing." },
  { step: 10, time: "16:45:22", agent: "Trader", type: "Agent", content: "**Action**: Executing TWAP buy order on simulated exchange." },
  { step: 11, time: "16:45:25", agent: "System", type: "System", content: "Pipeline Execution Complete. Generating Reports." },
]

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
  const [logAnimationStep, setLogAnimationStep] = useState(0)
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLogAnimationStep(0)
      setActiveLogTab("All")
      const timer = setInterval(() => {
        setLogAnimationStep(prev => {
          if (prev < 12) return prev + 1
          clearInterval(timer)
          return prev
        })
      }, 1000) // 1 second per step
      return () => clearInterval(timer)
    }
  }, [isOpen])

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logAnimationStep, activeLogTab])

  // Filter logs up to current animation step
  const visibleLogs = cliLogsData.filter(log => log.step <= logAnimationStep)
  const filteredLogs = activeLogTab === "All" ? visibleLogs : visibleLogs.filter(l => l.agent === activeLogTab)

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

        {/* Main Content Area (2 Columns) */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          
          {/* Left Column: Progress Tree */}
          <div className="w-[30%] lg:w-[25%] border-r border-primary/20 flex flex-col bg-background/50">
            <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
              {t("jobs.create").includes("Tạo") ? "TIẾN TRÌNH" : "PROGRESS"}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs custom-scrollbar">
              
              {/* Team 1: Analyst */}
              <div>
                <div className="text-muted-foreground uppercase mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3"/> {t("reports.analystTeam")}
                </div>
                <div className="pl-4 border-l border-primary/20 space-y-3">
                  
                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 0 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.fundamentals")}
                    </span>
                    {logAnimationStep >= 2 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 1 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 1 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.sentiment")}
                    </span>
                    {logAnimationStep >= 3 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 2 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 2 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.newsAnalyst").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 4 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 3 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 3 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-500"/> {t("reports.technicals")}
                    </span>
                    {logAnimationStep >= 5 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 4 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                </div>
              </div>

              {/* Team 2: Research */}
              <div>
                <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2">
                  <Network className="w-3 h-3"/> {t("reports.researchTeam")}
                </div>
                <div className="pl-4 border-l border-primary/20 space-y-3">
                  
                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 4 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-pink-500"/> {t("reports.bullResearcher").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 6 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 5 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 5 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-pink-500"/> {t("reports.bearResearcher").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 7 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 6 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 6 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-500"/> {t("reports.researchManager").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 8 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 7 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                </div>
              </div>

              {/* Team 3: Execution */}
              <div>
                <div className="text-muted-foreground uppercase mb-2 mt-2 flex items-center gap-2">
                  <Scale className="w-3 h-3"/> {t("reports.executionTeam")}
                </div>
                <div className="pl-4 border-l border-primary/20 space-y-3">
                  
                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 7 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-yellow-500"/> {t("reports.riskManagement").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 9 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 8 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 8 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-yellow-500"/> {t("reports.portfolioManager").split(" ")[0]}
                    </span>
                    {logAnimationStep >= 10 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 9 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                  <div className={`flex items-center justify-between transition-opacity duration-300 ${logAnimationStep >= 9 ? "opacity-100" : "opacity-40"}`}>
                    <span className="text-foreground flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-green-500"/> {t("reports.trader")}
                    </span>
                    {logAnimationStep >= 11 
                      ? <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/30">completed</Badge> 
                      : logAnimationStep >= 10 
                        ? <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-500 border-cyan-500/30 animate-pulse">in_progress</Badge> 
                        : <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground border-border/30">waiting...</Badge>}
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Messages & Tools */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="py-2 text-center border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5">
              {t("jobs.create").includes("Tạo") ? "TIN NHẮN & CÔNG CỤ" : "MESSAGES & TOOLS"}
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
                    <tr key={i} className="border-t border-primary/10 hover:bg-primary/5 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono text-xs">
                        {logAnimationStep === 0 
                          ? (t("jobs.create").includes("Tạo") ? "Đang khởi tạo luồng..." : "Initializing pipeline...") 
                          : `${t("jobs.create").includes("Tạo") ? "Không tìm thấy log cho" : "No logs found for"} ${activeLogTab}.`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div ref={logEndRef} className="h-4 w-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Current Report */}
        <div className="h-[35%] lg:h-[30%] border-t border-primary/30 flex flex-col bg-[#050508] relative shrink-0">
          <div className="py-2 px-4 border-b border-primary/20 text-xs font-bold tracking-widest text-primary bg-primary/5 flex items-center justify-between shrink-0">
            <span>{t("jobs.create").includes("Tạo") ? "BÁO CÁO HIỆN TẠI" : "CURRENT REPORT"}</span>
            <span className="text-muted-foreground text-[10px] font-normal">{t("jobs.create").includes("Tạo") ? "Xuất PDF / Markdown" : "Export to PDF / Markdown"}</span>
          </div>
          
          {logAnimationStep < 12 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <p className="animate-pulse font-mono text-xs tracking-widest uppercase">
                {t("jobs.create").includes("Tạo") ? "Đang tổng hợp báo cáo từ các Agent..." : "Waiting for Pipeline Synthesis..."}
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 text-sm leading-relaxed text-muted-foreground custom-scrollbar animate-in fade-in zoom-in-95 duration-700">
              <h3 className="text-foreground font-bold mb-4 text-lg border-b border-border/40 pb-2">
                {t("jobs.create").includes("Tạo") ? "Quyết Định Quản Trị Danh Mục" : "Portfolio Management Decision"}
              </h3>
              
              <h4 className="text-primary mt-4 mb-2">
                {t("jobs.create").includes("Tạo") ? "Phân Tích Của Chuyên Viên Độc Lập" : "Neutral Analyst Analysis"}
              </h4>
              <p className="mb-4">
                {t("jobs.create").includes("Tạo") 
                  ? `Tôi đã lắng nghe ý kiến từ cả hai phía, và thực tế, cả hai chuyên viên đang đưa ra các quan điểm thái cực mà bỏ qua lộ trình thực tế, được tính toán kỹ lưỡng hơn cho ${selectedJob?.ticker}. Cả hai đều bị mắc kẹt trong tư duy nhị phân giữa việc mạo hiểm không kiểm soát hoặc tê liệt hoàn toàn, và không có cách tiếp cận nào là tối ưu cho nguồn vốn chúng ta đang quản lý.`
                  : `I’ve listened to both sides of this debate, and frankly, both of you are presenting extremes that overlook a more pragmatic, calculated path forward for ${selectedJob?.ticker}. You’re both trapped in a binary mindset of either reckless abandonment or total paralysis, and neither approach is optimal for the capital we’re managing.`}
              </p>
              
              <p className="mb-4">
                {t("jobs.create").includes("Tạo")
                  ? `Đối với Chuyên viên Tấn công, bạn đúng khi xác định khả năng đảo chiều trung bình, nhưng bạn đang nhắm mắt trước thực tế biến động. Việc đặt lệnh dừng lỗ ở mức $69,500 với ATR gần $1,800 là một công thức dẫn đến thất bại. Đó không phải là quản lý rủi ro; đó là điểm dừng lỗ quá sát.`
                  : `To the Aggressive Analyst, you are right to identify the potential for a mean reversion, but you’re blinding yourself to the reality of the volatility. Setting a stop-loss at $69,500 with an ATR of nearly $1,800 is a recipe for disaster. That isn’t risk management; it’s a "stop-out magnet." You’re giving the market barely 1.5 ATRs of room to breathe.`}
              </p>

              <p className="mb-4">
                {t("jobs.create").includes("Tạo")
                  ? `Mặt khác, Chuyên viên Thận trọng lại đang nghiêng quá nhiều về nỗi sợ hãi cấu trúc. Đúng là các đường trung bình động của ${selectedJob?.ticker} đang giảm, và xu hướng hiện tại đang đi xuống. Nhưng việc chờ đợi sự xác nhận xu hướng hoàn toàn—như chờ giá vượt qua đường SMA 200 ngày—có nghĩa là chúng ta sẽ bỏ lỡ toàn bộ giai đoạn phục hồi của thị trường.`
                  : `On the other hand, the Conservative Analyst is leaning too heavily on structural fear. Yes, the moving averages for ${selectedJob?.ticker} are bearish, and yes, the trend is currently pointing down. But waiting for a total trend confirmation—like waiting for the price to reclaim the 200-day SMA—effectively means we miss the entire recovery phase of the move.`}
              </p>

              <div className="p-4 border-l-2 border-primary bg-primary/5 mt-6 text-foreground shadow-[inset_0_0_20px_rgba(0,240,255,0.05)]">
                <strong>{t("jobs.create").includes("Tạo") ? "Đề Xuất Chiến Lược Cân Bằng:" : "Balanced Strategy Proposed:"}</strong>{" "}
                {t("jobs.create").includes("Tạo")
                  ? "Chúng tôi thực hiện vị thế khởi đầu nhỏ—khoảng 1.5%—ở mức hiện tại để tôn trọng dải Bollinger Band dưới dưới dạng hỗ trợ tiềm năng. Điều này giúp chúng ta tham gia giao dịch và tuân theo logic \"mua khi điều chỉnh\" trong khi giảm thiểu rủi ro tối đa."
                  : "We take a small starter position—say 1.5%—at the current level to respect the lower Bollinger Band as a potential support. This gets us into the trade and honors the \"buy the dip\" logic while minimizing exposure. Volatility is within acceptable ATR boundaries."}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar: System Stats */}
        <div className="p-2 border-t border-primary/30 bg-primary/10 flex flex-wrap justify-between items-center text-[11px] text-primary/80 font-mono shrink-0">
          <div className="flex items-center gap-4 divide-x divide-primary/30">
            <span className="pl-2">{t("jobs.create").includes("Tạo") ? "Agents:" : "Agents:"} {Math.min(logAnimationStep, 10)}/10</span>
            <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Lượt gọi LLM:" : "LLM Calls:"} {logAnimationStep * 2}</span>
            <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Công cụ:" : "Tools Used:"} {Math.floor(logAnimationStep * 1.5)}</span>
            <span className="pl-4 flex items-center gap-1">Tokens: {(38.0 * (logAnimationStep/12)).toFixed(1)}k<Activity className="w-3 h-3 text-red-400" /> {(15.8 * (logAnimationStep/12)).toFixed(1)}k<Activity className="w-3 h-3 text-green-400" /></span>
            <span className="pl-4">{t("jobs.create").includes("Tạo") ? "Báo cáo:" : "Reports Generated:"} {logAnimationStep >= 12 ? "4/4" : `${Math.floor(logAnimationStep/3)}/4`}</span>
          </div>
          <div className="flex items-center gap-2 text-foreground font-bold pr-2">
            <Clock className="w-3 h-3 text-primary" />
            01:45
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}
