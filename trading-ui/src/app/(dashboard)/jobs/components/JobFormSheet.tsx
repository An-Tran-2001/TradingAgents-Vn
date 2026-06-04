import React, { useState, useEffect } from "react"
import { CalendarClock, Activity, Network, Cloud, Loader2, Cpu, Zap, BrainCircuit, BarChart3, TrendingUp, Newspaper, LineChart, Sparkles, Layers, Gauge } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useProviders, useProviderModels } from "@/hooks/useConfig"

import {
  AnthropicIcon,
  AzureIcon,
  DeepSeekIcon,
  GLMIcon,
  GoogleGeminiIcon,
  MiniMaxIcon,
  OllamaIcon,
  OpenAIIcon,
  OpenRouterIcon,
  QwenIcon,
  XAIIcon,
} from "@/components/icons/brand-icons"

type ProviderIconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { className?: string }>

const PROVIDER_ICONS: Record<string, { Icon: ProviderIconComponent; color: string; bg: string }> = {
  openai:       { Icon: OpenAIIcon, color: "text-foreground", bg: "bg-foreground/10" },
  google:       { Icon: GoogleGeminiIcon, color: "text-[#8E75B2]", bg: "bg-[#8E75B2]/10" },
  anthropic:    { Icon: AnthropicIcon, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-500/10" },
  xai:          { Icon: XAIIcon, color: "text-foreground", bg: "bg-foreground/10" },
  deepseek:     { Icon: DeepSeekIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
  qwen:         { Icon: QwenIcon, color: "text-orange-500", bg: "bg-orange-500/10" },
  "qwen-cn":    { Icon: QwenIcon, color: "text-orange-500", bg: "bg-orange-500/10" },
  glm:          { Icon: GLMIcon, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  "glm-cn":     { Icon: GLMIcon, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  minimax:      { Icon: MiniMaxIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
  "minimax-cn": { Icon: MiniMaxIcon, color: "text-purple-500", bg: "bg-purple-500/10" },
  openrouter:   { Icon: OpenRouterIcon, color: "text-green-500", bg: "bg-green-500/10" },
  azure:        { Icon: AzureIcon, color: "text-sky-500", bg: "bg-sky-500/10" },
  ollama:       { Icon: OllamaIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  lmstudio:     { Icon: Cpu, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  _default:     { Icon: Cloud, color: "text-muted-foreground", bg: "bg-muted" },
}

const ProviderBrandMark = ({ providerId }: { providerId: string }) => {
  const icon = PROVIDER_ICONS[providerId] ?? PROVIDER_ICONS._default
  const Icon = icon.Icon

  return (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${icon.bg}`}>
      <Icon className={`h-3.5 w-3.5 ${icon.color}`} aria-hidden="true" />
    </span>
  )
}


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
    config: any
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
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  
  // Advanced Config state
  const [selectedProvider, setSelectedProvider] = useState<string>("openai")
  const [selectedModel, setSelectedModel] = useState<string>("")
  const [selectedQuickModel, setSelectedQuickModel] = useState<string>("")
  const [selectedDeepModel, setSelectedDeepModel] = useState<string>("")
  const [useAdvancedModels, setUseAdvancedModels] = useState<boolean>(false)
  const [teamFundamentals, setTeamFundamentals] = useState<boolean>(true)
  const [teamSentiment, setTeamSentiment] = useState<boolean>(true)
  const [teamNews, setTeamNews] = useState<boolean>(true)
  const [teamTechnical, setTeamTechnical] = useState<boolean>(true)
  const [depth, setDepth] = useState<string>("medium")
  const [effort, setEffort] = useState<string>("high")
  
  const [temperature, setTemperature] = useState<number>(0.2)
  const [topP, setTopP] = useState<number>(1.0)
  const [topK, setTopK] = useState<number>(40)
  const [maxTokens, setMaxTokens] = useState<number>(8000)
  const [maxRetries, setMaxRetries] = useState<number>(3)

  const { providers, isLoading: providersLoading } = useProviders()
  const { models, isLoading: modelsLoading } = useProviderModels(selectedProvider)
  const selectedProviderInfo = providers.find(provider => provider.id === selectedProvider)

  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setTicker(editingJob.ticker)
        setFrequency(editingJob.frequency)
        setDepth(editingJob.depth.toLowerCase())
        setEffort(editingJob.reasoning.toLowerCase())
        setStartDate(editingJob.startDate)
        setEndDate(editingJob.endDate)
        
        // Load config
        if (editingJob.config) {
          const cfg = editingJob.config
          if (cfg.selectedProvider) setSelectedProvider(cfg.selectedProvider)
          if (cfg.selectedModel) setSelectedModel(cfg.selectedModel)
          if (cfg.selectedQuickModel) setSelectedQuickModel(cfg.selectedQuickModel)
          if (cfg.selectedDeepModel) setSelectedDeepModel(cfg.selectedDeepModel)
          if (cfg.useAdvancedModels !== undefined) setUseAdvancedModels(cfg.useAdvancedModels)
          if (cfg.teamFundamentals !== undefined) setTeamFundamentals(cfg.teamFundamentals)
          if (cfg.teamSentiment !== undefined) setTeamSentiment(cfg.teamSentiment)
          if (cfg.teamNews !== undefined) setTeamNews(cfg.teamNews)
          if (cfg.teamTechnical !== undefined) setTeamTechnical(cfg.teamTechnical)
          if (cfg.temperature !== undefined) setTemperature(Number(cfg.temperature))
          if (cfg.topP !== undefined) setTopP(Number(cfg.topP))
          if (cfg.topK !== undefined) setTopK(Number(cfg.topK))
          if (cfg.maxTokens !== undefined) setMaxTokens(Number(cfg.maxTokens))
          if (cfg.maxRetries !== undefined) setMaxRetries(Number(cfg.maxRetries))
        }
      } else {
        // Reset defaults
        setTicker("")
        setFrequency("Daily (00:00 UTC)")
        setDepth("medium")
        setEffort("high")
        setStartDate(new Date().toISOString().split('T')[0])
        setEndDate("")
        setUseAdvancedModels(false)
        setTeamFundamentals(true)
        setTeamSentiment(true)
        setTeamNews(true)
        setTeamTechnical(true)
      }
    }
  }, [isOpen, editingJob])

  // Auto-select first available model when provider changes
  useEffect(() => {
    if (models.length > 0) {
      if (!useAdvancedModels) {
        if (!models.find(m => m.id === selectedModel)) {
          setSelectedModel(models[0].id)
        }
      } else {
        const quickModels = models.filter(m => m.mode === "quick")
        const deepModels = models.filter(m => m.mode === "deep")
        
        if (quickModels.length > 0 && !quickModels.find(m => m.id === selectedQuickModel)) {
          setSelectedQuickModel(quickModels[0].id)
        }
        if (deepModels.length > 0 && !deepModels.find(m => m.id === selectedDeepModel)) {
          setSelectedDeepModel(deepModels[0].id)
        }
      }
    }
  }, [models, selectedModel, selectedQuickModel, selectedDeepModel, useAdvancedModels])

  const handleSave = () => {
    if (!ticker.trim()) return

    const agents = ["Market Analyst", "Research Manager", "Trader"]
    if (teamFundamentals) agents.push("Fundamentals")
    if (teamSentiment) agents.push("Sentiment")
    if (teamNews) agents.push("News")
    if (teamTechnical) agents.push("Technical")

    const config = {
      selectedProvider,
      selectedModel,
      selectedQuickModel,
      selectedDeepModel,
      useAdvancedModels,
      teamFundamentals,
      teamSentiment,
      teamNews,
      teamTechnical,
      temperature,
      topP,
      topK,
      maxTokens,
      maxRetries
    }

    onSave({
      ticker: ticker.trim().toUpperCase(),
      frequency,
      depth: depth.charAt(0).toUpperCase() + depth.slice(1),
      reasoning: effort.charAt(0).toUpperCase() + effort.slice(1),
      startDate,
      endDate,
      agents,
      config
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="border-l-border/40 bg-background/95 backdrop-blur-xl flex flex-col w-[90vw] sm:w-[600px] overflow-y-auto p-0">
        <div className="p-6 pb-2 border-b border-border/50 bg-background/95 sticky top-0 z-20">
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              {editingJob 
                ? (t("jobs.create").includes("Tạo") ? "Cập Nhật Lịch Trình" : "Edit Scheduled Job") 
                : t("jobs.create")}
            </SheetTitle>
            <SheetDescription>
              {t("jobs.create").includes("Tạo") 
                ? "Cấu hình lịch trình và chi tiết thông số AI cho agent." 
                : "Configure schedule and detailed AI parameters for the agent."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 p-6 pt-4 space-y-6">
          <Tabs defaultValue="schedule" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="schedule">
                {t("jobs.create").includes("Tạo") ? "Lịch Trình" : "Schedule"}
              </TabsTrigger>
              <TabsTrigger value="config">
                {t("jobs.create").includes("Tạo") ? "Cấu Hình Phân Tích" : "Analysis Config"}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4 mt-0 border border-border/50 rounded-lg p-4 bg-card/30">
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
                    <Label htmlFor="end-date">{t("jobs.create").includes("Tạo") ? "Ngày Kết Thúc" : "End Date"}</Label>
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
            </TabsContent>

            <TabsContent value="config" className="space-y-4 mt-0">
              <div className="space-y-5 rounded-xl border border-primary/20 bg-background/30 p-4">
                
                {/* Provider Selector */}
                <div className="space-y-3">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Cloud className="h-3 w-3" /> {t("research.provider")}
                  </Label>
                  {providersLoading ? (
                    <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-primary/20 bg-background/60 text-muted-foreground text-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Loading providers...</span>
                    </div>
                  ) : (
                    <Select value={selectedProvider} onValueChange={(v) => { 
                      setSelectedProvider(v); 
                      setSelectedModel(""); 
                      setSelectedQuickModel(""); 
                      setSelectedDeepModel(""); 
                    }}>
                      <SelectTrigger className="bg-background/60 h-10 border-primary/20 hover:border-primary/40 focus:ring-primary/30 transition-all rounded-xl shadow-sm w-full">
                        <SelectValue placeholder="Select Provider">
                          {selectedProviderInfo ? (
                            <span className="flex min-w-0 items-center gap-2">
                              <ProviderBrandMark providerId={selectedProviderInfo.id} />
                              <span className="truncate">{selectedProviderInfo.name}</span>
                            </span>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-primary/20 max-h-72 w-full">
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id} disabled={!provider.is_ready}>
                            <span className="flex min-w-0 items-center gap-2">
                              <ProviderBrandMark providerId={provider.id} />
                              <span>{provider.name}</span>
                              {!provider.is_ready && (
                                <span className="ml-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">Missing API Key</span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Model Selector */}
                {!useAdvancedModels ? (
                  <div className="space-y-3">
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Cpu className="h-3 w-3" /> {t("research.model")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] normal-case opacity-70">Advanced</span>
                        <Switch checked={useAdvancedModels} onCheckedChange={setUseAdvancedModels} className="h-4 w-7 [&_span]:h-3 [&_span]:w-3" />
                      </div>
                    </Label>
                    {modelsLoading ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-primary/20 bg-background/60 text-muted-foreground text-sm">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      </div>
                    ) : (
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="bg-background/60 h-10 border-primary/20 hover:border-primary/40 focus:ring-primary/30 transition-all rounded-xl shadow-sm w-full min-w-0">
                          <SelectValue placeholder="Select Model">
                            {selectedModel
                              ? (models.find(m => m.id === selectedModel)?.name.split(" - ")[0] ?? selectedModel)
                              : "Select Model"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/20 max-h-72">
                          {models.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-xl border border-primary/20 bg-background/30 p-3 relative">
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="h-3 w-3" /> Models
                      </Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] normal-case text-primary opacity-90 font-semibold">Advanced</span>
                        <Switch checked={useAdvancedModels} onCheckedChange={setUseAdvancedModels} className="h-4 w-7 [&_span]:h-3 [&_span]:w-3" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-yellow-500" /> Quick Think Model
                      </Label>
                      <Select value={selectedQuickModel} onValueChange={setSelectedQuickModel}>
                        <SelectTrigger className="bg-background/60 h-9 border-primary/20 hover:border-primary/40 text-xs transition-all rounded-lg shadow-sm w-full min-w-0">
                          <SelectValue placeholder="Select Quick Model">
                            {selectedQuickModel ? (models.find(m => m.id === selectedQuickModel)?.name.split(" - ")[0] ?? selectedQuickModel) : "Select Quick Model"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/20 max-h-72 w-[var(--radix-select-trigger-width)]">
                          {models.filter(m => m.mode === "quick").map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
                        <BrainCircuit className="h-3 w-3 text-purple-400" /> Deep Think Model
                      </Label>
                      <Select value={selectedDeepModel} onValueChange={setSelectedDeepModel}>
                        <SelectTrigger className="bg-background/60 h-9 border-primary/20 hover:border-primary/40 text-xs transition-all rounded-lg shadow-sm w-full min-w-0">
                          <SelectValue placeholder="Select Deep Model">
                            {selectedDeepModel ? (models.find(m => m.id === selectedDeepModel)?.name.split(" - ")[0] ?? selectedDeepModel) : "Select Deep Model"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/20 max-h-72 w-[var(--radix-select-trigger-width)]">
                          {models.filter(m => m.mode === "deep").map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Advanced Text Params */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("research.temperature")}</Label>
                  <Input type="number" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)} className="h-9" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("research.maxTokens")}</Label>
                  <Input type="number" step="100" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)} className="h-9" />
                </div>
              </div>

              {/* Research Teams */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BrainCircuit className="h-3 w-3" /> {t("research.activeTeams")}
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer">
                    <span className="text-sm font-medium">Fundamentals</span>
                    <Checkbox checked={teamFundamentals} onCheckedChange={(c) => setTeamFundamentals(!!c)} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer">
                    <span className="text-sm font-medium">Sentiment</span>
                    <Checkbox checked={teamSentiment} onCheckedChange={(c) => setTeamSentiment(!!c)} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer">
                    <span className="text-sm font-medium">News</span>
                    <Checkbox checked={teamNews} onCheckedChange={(c) => setTeamNews(!!c)} />
                  </label>
                  <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer">
                    <span className="text-sm font-medium">Technical</span>
                    <Checkbox checked={teamTechnical} onCheckedChange={(c) => setTeamTechnical(!!c)} />
                  </label>
                </div>
              </div>

              {/* Depth & Reasoning */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">{t("research.depth")}</Label>
                  <Select value={depth} onValueChange={setDepth}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shallow">Shallow</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="deep">Deep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">{t("research.reasoningEffort")}</Label>
                  <Select value={effort} onValueChange={setEffort}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

            </TabsContent>
          </Tabs>
        </div>

        <div className="p-6 pt-4 border-t border-border/50 sticky bottom-0 bg-background/95 z-20">
          <SheetFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("jobs.create").includes("Tạo") ? "Hủy" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!ticker.trim()} 
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(6,182,212,0.4)] w-32"
            >
              {editingJob 
                ? (t("jobs.create").includes("Tạo") ? "Lưu Thay Đổi" : "Save Changes") 
                : t("jobs.create")}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
