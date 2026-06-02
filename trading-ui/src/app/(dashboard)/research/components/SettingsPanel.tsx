import React, { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import { useProviders, useProviderModels } from "@/hooks/useConfig"
import { 
  Settings2, 
  Cloud, 
  Loader2, 
  Cpu, 
  Zap, 
  BrainCircuit, 
  BarChart3, 
  TrendingUp, 
  Newspaper, 
  LineChart, 
  Sparkles, 
  Layers, 
  Gauge 
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

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

export const SettingsPanel: React.FC = () => {
  const { t } = useLanguage()
  
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
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  const { providers, isLoading: providersLoading } = useProviders()
  const { models, isLoading: modelsLoading } = useProviderModels(selectedProvider)
  const selectedProviderInfo = providers.find(provider => provider.id === selectedProvider)

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem("trading_research_settings")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.selectedProvider) setSelectedProvider(parsed.selectedProvider)
        if (parsed.selectedModel) setSelectedModel(parsed.selectedModel)
        if (parsed.selectedQuickModel) setSelectedQuickModel(parsed.selectedQuickModel)
        if (parsed.selectedDeepModel) setSelectedDeepModel(parsed.selectedDeepModel)
        if (parsed.useAdvancedModels !== undefined) setUseAdvancedModels(parsed.useAdvancedModels)
        if (parsed.teamFundamentals !== undefined) setTeamFundamentals(parsed.teamFundamentals)
        if (parsed.teamSentiment !== undefined) setTeamSentiment(parsed.teamSentiment)
        if (parsed.teamNews !== undefined) setTeamNews(parsed.teamNews)
        if (parsed.teamTechnical !== undefined) setTeamTechnical(parsed.teamTechnical)
        if (parsed.depth) setDepth(parsed.depth)
        if (parsed.effort) setEffort(parsed.effort)
      } catch (e) {
        console.error("Error parsing research settings", e)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save settings when they change
  useEffect(() => {
    if (!isInitialized) return

    const settingsToSave = {
      selectedProvider,
      selectedModel,
      selectedQuickModel,
      selectedDeepModel,
      useAdvancedModels,
      teamFundamentals,
      teamSentiment,
      teamNews,
      teamTechnical,
      depth,
      effort
    }
    localStorage.setItem("trading_research_settings", JSON.stringify(settingsToSave))
  }, [
    isInitialized,
    selectedProvider,
    selectedModel,
    selectedQuickModel,
    selectedDeepModel,
    useAdvancedModels,
    teamFundamentals,
    teamSentiment,
    teamNews,
    teamTechnical,
    depth,
    effort
  ])

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

  // Auto-select first ready provider if current is not ready
  useEffect(() => {
    if (providers.length > 0 && selectedProviderInfo && !selectedProviderInfo.is_ready) {
      const firstReady = providers.find(p => p.is_ready);
      if (firstReady) {
        setSelectedProvider(firstReady.id);
      }
    }
  }, [providers, selectedProviderInfo])

  return (
    <div className="w-full lg:w-80 border-l border-border/50 bg-background/60 backdrop-blur-md flex flex-col h-[40vh] lg:h-full shrink-0 z-20">
      <div className="p-4 border-b border-border/50 flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur z-10">
        <Settings2 className="h-5 w-5 text-primary" />
        <h2 className="font-semibold text-sm">{t("research.settings")}</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-8">
          
          {/* Provider + Model selectors driven by API */}
          <div className="space-y-5">
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
                    {providers.map((provider) => {
                      return (
                        <SelectItem 
                          key={provider.id} 
                          value={provider.id} 
                          textValue={provider.name}
                          disabled={!provider.is_ready}
                          className={!provider.is_ready ? "opacity-50" : ""}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <ProviderBrandMark providerId={provider.id} />
                            <span>{provider.name}</span>
                            {!provider.requires_api_key && (
                              <span className="ml-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">Local</span>
                            )}
                            {!provider.is_ready && (
                              <span className="ml-1 text-[10px] text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">Missing API Key</span>
                            )}
                          </span>
                        </SelectItem>
                      )
                    })}
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
                    <span>Loading models...</span>
                  </div>
                ) : models.length === 0 ? (
                  <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-dashed border-primary/20 bg-background/40 text-muted-foreground text-sm">
                    <span>No models available</span>
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
                    <SelectContent className="rounded-xl border-primary/20 max-h-72 w-[var(--radix-select-trigger-width)]">
                      {/* Quick Think group */}
                      {models.filter(m => m.mode === "quick").length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                            <Zap className="h-3 w-3 text-yellow-500" /> Quick Think
                          </div>
                          {models.filter(m => m.mode === "quick").map(m => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              textValue={m.name.split(" - ")[0]}
                              className="max-w-full"
                            >
                              <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                              {m.name.includes(" - ") && (
                                <span className="text-[10px] text-muted-foreground ml-1.5 truncate">
                                  — {m.name.split(" - ")[1]}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {/* Deep Think group */}
                      {models.filter(m => m.mode === "deep").length > 0 && (
                        <>
                          <div className="px-2 py-1.5 mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 border-t border-border/40">
                            <BrainCircuit className="h-3 w-3 text-purple-400" /> Deep Think
                          </div>
                          {models.filter(m => m.mode === "deep").map(m => (
                            <SelectItem
                              key={m.id}
                              value={m.id}
                              textValue={m.name.split(" - ")[0]}
                              className="max-w-full"
                            >
                              <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                              {m.name.includes(" - ") && (
                                <span className="text-[10px] text-muted-foreground ml-1.5 truncate">
                                  — {m.name.split(" - ")[1]}
                                </span>
                              )}
                            </SelectItem>
                          ))}
                        </>
                      )}
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

                {/* Quick Model Selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-yellow-500" /> Quick Think Model
                  </Label>
                  <Select value={selectedQuickModel} onValueChange={setSelectedQuickModel}>
                    <SelectTrigger className="bg-background/60 h-9 border-primary/20 hover:border-primary/40 text-xs transition-all rounded-lg shadow-sm w-full min-w-0">
                      <SelectValue placeholder="Select Quick Model">
                        {selectedQuickModel
                          ? (models.find(m => m.id === selectedQuickModel)?.name.split(" - ")[0] ?? selectedQuickModel)
                          : "Select Quick Model"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 max-h-72 w-[var(--radix-select-trigger-width)]">
                      {models.filter(m => m.mode === "quick").map(m => (
                        <SelectItem key={m.id} value={m.id} textValue={m.name.split(" - ")[0]} className="max-w-full">
                          <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Deep Model Selector */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1.5">
                    <BrainCircuit className="h-3 w-3 text-purple-400" /> Deep Think Model
                  </Label>
                  <Select value={selectedDeepModel} onValueChange={setSelectedDeepModel}>
                    <SelectTrigger className="bg-background/60 h-9 border-primary/20 hover:border-primary/40 text-xs transition-all rounded-lg shadow-sm w-full min-w-0">
                      <SelectValue placeholder="Select Deep Model">
                        {selectedDeepModel
                          ? (models.find(m => m.id === selectedDeepModel)?.name.split(" - ")[0] ?? selectedDeepModel)
                          : "Select Deep Model"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-primary/20 max-h-72 w-[var(--radix-select-trigger-width)]">
                      {models.filter(m => m.mode === "deep").map(m => (
                        <SelectItem key={m.id} value={m.id} textValue={m.name.split(" - ")[0]} className="max-w-full">
                          <span className="text-xs font-medium">{m.name.split(" - ")[0]}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Analyst Teams Multi-select */}
          <div className="space-y-3">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BrainCircuit className="h-3 w-3" /> {t("research.activeTeams")}
            </Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">Fundamentals</span>
                </div>
                <Checkbox 
                  id="team-fundamentals" 
                  checked={teamFundamentals} 
                  onCheckedChange={(checked) => setTeamFundamentals(!!checked)}
                  className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                />
              </label>
              
              <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">Sentiment</span>
                </div>
                <Checkbox 
                  id="team-sentiment" 
                  checked={teamSentiment} 
                  onCheckedChange={(checked) => setTeamSentiment(!!checked)}
                  className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                />
              </label>
              
              <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <Newspaper className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">News</span>
                </div>
                <Checkbox 
                  id="team-news" 
                  checked={teamNews} 
                  onCheckedChange={(checked) => setTeamNews(!!checked)}
                  className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                />
              </label>
              
              <label className="flex items-center justify-between rounded-xl border border-primary/10 bg-background/40 px-3 py-2.5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)] transition-all group">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                    <LineChart className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">Technical</span>
                </div>
                <Checkbox 
                  id="team-technical" 
                  checked={teamTechnical} 
                  onCheckedChange={(checked) => setTeamTechnical(!!checked)}
                  className="rounded-full data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/30 shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                />
              </label>
            </div>
          </div>

          {/* Research & Reasoning */}
          <div className="space-y-5 rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden shadow-[inset_0_0_20px_rgba(var(--primary),0.05)]">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-primary">
              <Sparkles className="h-16 w-16" />
            </div>
            
            <div className="space-y-3 relative z-10">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="h-3 w-3" /> {t("research.depth")}
              </Label>
              <Select value={depth} onValueChange={setDepth}>
                <SelectTrigger className="bg-background/80 h-9 border-primary/30 hover:border-primary/50 focus:ring-primary/40 transition-all rounded-lg shadow-sm">
                  <SelectValue placeholder="Select Depth" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-primary/30">
                  <SelectItem value="shallow">{t("research.depthShallow")}</SelectItem>
                  <SelectItem value="medium">{t("research.depthMedium")}</SelectItem>
                  <SelectItem value="deep">{t("research.depthDeepOption")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 relative z-10">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="h-3 w-3" /> {t("research.reasoningEffort")}
              </Label>
              <Select value={effort} onValueChange={setEffort}>
                <SelectTrigger className="bg-background/80 h-9 border-primary/30 hover:border-primary/50 focus:ring-primary/40 transition-all rounded-lg shadow-sm">
                  <SelectValue placeholder="Select Effort" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-primary/30">
                  <SelectItem value="low">{t("research.effortLow")}</SelectItem>
                  <SelectItem value="medium">{t("research.effortMedium")}</SelectItem>
                  <SelectItem value="high">{t("research.effortHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
        </div>
      </ScrollArea>
    </div>
  )
}
