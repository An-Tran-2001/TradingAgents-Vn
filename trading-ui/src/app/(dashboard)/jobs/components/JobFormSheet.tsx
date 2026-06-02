import React, { useState, useEffect } from "react"
import { CalendarClock, Activity, Network } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TradingJob } from "./types"

interface JobFormSheetProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingJob: TradingJob | null
  onSave: (data: {
    ticker: string
    frequency: string
    depth: string
    reasoning: string
    startDate: string
    endDate: string
    agents: string[]
  }) => void
}

export const JobFormSheet: React.FC<JobFormSheetProps> = ({
  isOpen,
  onOpenChange,
  editingJob,
  onSave,
}) => {
  const { t } = useLanguage()

  const [ticker, setTicker] = useState("")
  const [frequency, setFrequency] = useState("Daily (00:00 UTC)")
  const [depth, setDepth] = useState("Medium")
  const [reasoning, setReasoning] = useState("Medium")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [agents, setAgents] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setTicker(editingJob.ticker)
        setFrequency(editingJob.frequency)
        setDepth(editingJob.depth)
        setReasoning(editingJob.reasoning)
        setStartDate(editingJob.startDate)
        setEndDate(editingJob.endDate)
        setAgents(editingJob.agents)
      } else {
        setTicker("")
        setFrequency("Daily (00:00 UTC)")
        setDepth("Medium")
        setReasoning("Medium")
        setStartDate(new Date().toISOString().split('T')[0])
        setEndDate("")
        setAgents(["Market Analyst", "Bull Researcher", "Bear Researcher", "Research Manager", "Trader"])
      }
    }
  }, [isOpen, editingJob])

  const handleSave = () => {
    if (!ticker.trim()) return
    onSave({
      ticker: ticker.trim().toUpperCase(),
      frequency,
      depth,
      reasoning,
      startDate,
      endDate,
      agents,
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="border-l-border/40 bg-background/95 backdrop-blur-xl flex flex-col w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {editingJob 
              ? (t("jobs.create").includes("Tạo") ? "Cập Nhật Lịch Trình" : "Edit Scheduled Job") 
              : t("jobs.create")}
          </SheetTitle>
          <SheetDescription>
            {t("jobs.create").includes("Tạo") 
              ? "Cấu hình các tham số lập lịch nâng cao cho luồng xử lý tự động của agent AI." 
              : "Configure advanced scheduling parameters for your automated trading agent pipeline."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 space-y-6">
          <div className="space-y-4 border border-border/50 rounded-lg p-4 bg-card/30">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <Activity className="w-4 h-4"/> 
              {t("jobs.create").includes("Tạo") ? "Mục Tiêu & Lịch Trình" : "Target & Schedule"}
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticker">{t("research.ticker")}</Label>
                <Input 
                  id="ticker" 
                  placeholder="e.g. BTC-USD, AAPL" 
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  className="bg-background/50 border-border/50 focus-visible:ring-primary/50 font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("jobs.tableSchedule")}</Label>
                <Select 
                  value={frequency} 
                  onValueChange={setFrequency}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Every Hour">Every Hour</SelectItem>
                    <SelectItem value="Every 4 Hours">Every 4 Hours</SelectItem>
                    <SelectItem value="Daily (00:00 UTC)">Daily (00:00 UTC)</SelectItem>
                    <SelectItem value="Weekly (Mon 09:30 EST)">Weekly (Mon 09:30 EST)</SelectItem>
                    <SelectItem value="Custom Cron">Custom Cron...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">{t("jobs.create").includes("Tạo") ? "Ngày Bắt Đầu" : "Start Date"}</Label>
                  <Input 
                    id="start-date" 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">{t("jobs.create").includes("Tạo") ? "Ngày Kết Thúc (Tùy chọn)" : "End Date (Optional)"}</Label>
                  <Input 
                    id="end-date" 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 border border-border/50 rounded-lg p-4 bg-card/30">
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              <Network className="w-4 h-4"/> 
              {t("jobs.create").includes("Tạo") ? "Cấu Hình Đội Ngũ Agent" : "Agent Configuration"}
            </h3>
            
            <div className="space-y-3">
              <Label>{t("jobs.create").includes("Tạo") ? "Nhóm Tham Gia" : "Participating Teams"}</Label>
              <div className="flex flex-col gap-3 p-3 border border-border/40 rounded-md bg-background/30">
                <div className="flex items-center space-x-2">
                  <Checkbox id="agent-analyst" checked={true} disabled />
                  <label htmlFor="agent-analyst" className="text-sm font-medium leading-none cursor-pointer">
                    {t("reports.analystTeam")} (Full Suite)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agent-research" checked={true} disabled />
                  <label htmlFor="agent-research" className="text-sm font-medium leading-none cursor-pointer">
                    {t("reports.researchTeam")} (Debate)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="agent-trader" checked={true} disabled />
                  <label htmlFor="agent-trader" className="text-sm font-medium leading-none cursor-pointer">
                    {t("reports.executionTeam")}
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("research.depth")}</Label>
                <Select 
                  value={depth} 
                  onValueChange={setDepth}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Shallow">{t("research.depthShallow").split(" ")[0]}</SelectItem>
                    <SelectItem value="Medium">{t("research.depthMedium").split(" ")[0]}</SelectItem>
                    <SelectItem value="Deep">{t("research.depthDeepOption").split(" ")[0]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t("research.reasoningEffort")}</Label>
                <Select 
                  value={reasoning} 
                  onValueChange={setReasoning}
                >
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">{t("research.effortLow").split(" ")[0]}</SelectItem>
                    <SelectItem value="Medium">{t("research.effortMedium").split(" ")[0]}</SelectItem>
                    <SelectItem value="High">{t("research.effortHigh").split(" ")[0]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("jobs.create").includes("Tạo") ? "Hủy" : "Cancel"}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!ticker.trim()} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            {editingJob 
              ? (t("jobs.create").includes("Tạo") ? "Lưu Thay Đổi" : "Save Changes") 
              : t("jobs.create")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
