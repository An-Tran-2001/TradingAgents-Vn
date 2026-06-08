"use client"

import React, { useState, useEffect } from "react"
import { Eye, EyeOff, Save, ShieldCheck, Settings2, Cpu, Globe, Mail, Server, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useSettingsStore } from "@/store/settingsStore"
import { UpdateUserSettingRequest } from "@/types/settings"

function SecureInput({ id, placeholder, value, onChange }: { id: string, placeholder: string, value: string, onChange: (val: string) => void }) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-10 bg-background/50 focus:bg-background transition-colors rounded-xl"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span className="sr-only">Toggle password visibility</span>
      </Button>
    </div>
  )
}

export default function SettingsPage() {
  const { settings, fetchSettings, updateSettings, isLoading, isSaving } = useSettingsStore()
  const [activeTab, setActiveTab] = useState("providers")

  const [formData, setFormData] = useState<UpdateUserSettingRequest>({
    api_keys: {},
    llm_provider: "openai",
    deep_think_model: "gpt-4o",
    quick_think_model: "gpt-4o-mini",
    language: "English",
    max_debate_rounds: 1,
    max_risk_rounds: 1,
    temperature: 0.0,
    llm_backend_url: "",
    checkpoint_enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setFormData({
        api_keys: settings.api_keys || {},
        llm_provider: settings.llm_provider || "openai",
        deep_think_model: settings.deep_think_model || "gpt-4o",
        quick_think_model: settings.quick_think_model || "gpt-4o-mini",
        language: settings.language || "English",
        max_debate_rounds: settings.max_debate_rounds || 1,
        max_risk_rounds: settings.max_risk_rounds || 1,
        temperature: settings.temperature || 0.0,
        llm_backend_url: settings.llm_backend_url || "",
        checkpoint_enabled: settings.checkpoint_enabled || false,
      });
    }
  }, [settings]);

  const handleApiKeyChange = (provider: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      api_keys: {
        ...(prev.api_keys || {}),
        [provider]: value
      }
    }));
  };

  const getApiKeyValue = (provider: string) => {
    return formData.api_keys?.[provider] || "";
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
    } catch {
      // Toast is handled by settingsStore
    }
  }

  if (isLoading && !settings) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background/50 relative">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background/50 relative overflow-hidden">
      <div className="cyber-grid pointer-events-none opacity-50"/>
      
      <div className="flex flex-1 h-full overflow-hidden z-10">
        
        {/* Left Sidebar Menu */}
        <div className="w-64 border-r border-border/50 bg-background/60 backdrop-blur-md flex flex-col h-full shrink-0">
          <div className="p-6 pb-4 border-b border-border/50 shrink-0">
            <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Manage AI providers, notifications, and core agent parameters.</p>
          </div>
          
          <ScrollArea className="flex-1 custom-scrollbar min-h-0">
            <div className="p-3 space-y-1">
              <button 
                onClick={() => setActiveTab("providers")} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === 'providers' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.08)] border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> API & Integrations
              </button>
              
              <button 
                onClick={() => setActiveTab("configuration")} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === 'configuration' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.08)] border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                }`}
              >
                <Cpu className="h-4 w-4" /> Agent Config
              </button>
              
              <button 
                onClick={() => setActiveTab("advanced")} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeTab === 'advanced' ? 'bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,240,255,0.08)] border border-primary/20' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                }`}
              >
                <Settings2 className="h-4 w-4" /> Advanced
              </button>
            </div>
          </ScrollArea>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-background/30">
          
          {/* Content Header (Sticky) */}
          <div className="p-5 md:px-8 border-b border-border/30 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-md z-20 shrink-0 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 text-foreground/90">
              {activeTab === 'providers' && <><ShieldCheck className="w-5 h-5 text-primary"/> API & Integrations</>}
              {activeTab === 'configuration' && <><Cpu className="w-5 h-5 text-primary"/> Agent Configuration</>}
              {activeTab === 'advanced' && <><Settings2 className="w-5 h-5 text-primary"/> Advanced Parameters</>}
            </h2>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2 shadow-md rounded-xl" size="sm">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </div>

          {/* Scrollable Form Content */}
          <ScrollArea className="flex-1 custom-scrollbar min-h-0">
            <div className="p-5 md:p-8 max-w-4xl space-y-8 pb-24">
              
              {/* TAB 1: API & INTEGRATIONS */}
              {activeTab === 'providers' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="shadow-sm rounded-2xl border-primary/20 overflow-hidden bg-card/40 backdrop-blur">
                    <CardHeader className="bg-primary/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">Global LLM Providers</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        Primary API keys for world-class AI models.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="OPENAI_API_KEY" className="text-xs text-muted-foreground font-semibold">OpenAI API Key</Label>
                        <SecureInput id="OPENAI_API_KEY" placeholder="sk-..." value={getApiKeyValue('openai')} onChange={(v) => handleApiKeyChange('openai', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ANTHROPIC_API_KEY" className="text-xs text-muted-foreground font-semibold">Anthropic API Key</Label>
                        <SecureInput id="ANTHROPIC_API_KEY" placeholder="sk-ant-..." value={getApiKeyValue('anthropic')} onChange={(v) => handleApiKeyChange('anthropic', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="GOOGLE_API_KEY" className="text-xs text-muted-foreground font-semibold">Google API Key</Label>
                        <SecureInput id="GOOGLE_API_KEY" placeholder="AIza..." value={getApiKeyValue('google')} onChange={(v) => handleApiKeyChange('google', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="XAI_API_KEY" className="text-xs text-muted-foreground font-semibold">xAI API Key</Label>
                        <SecureInput id="XAI_API_KEY" placeholder="xai-..." value={getApiKeyValue('xai')} onChange={(v) => handleApiKeyChange('xai', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="DEEPSEEK_API_KEY" className="text-xs text-muted-foreground font-semibold">DeepSeek API Key</Label>
                        <SecureInput id="DEEPSEEK_API_KEY" placeholder="sk-..." value={getApiKeyValue('deepseek')} onChange={(v) => handleApiKeyChange('deepseek', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="OPENROUTER_API_KEY" className="text-xs text-muted-foreground font-semibold">OpenRouter API Key</Label>
                        <SecureInput id="OPENROUTER_API_KEY" placeholder="sk-or-..." value={getApiKeyValue('openrouter')} onChange={(v) => handleApiKeyChange('openrouter', v)} />
                      </div>
                      
                      {/* Azure OpenAI */}
                      <div className="col-span-full h-px bg-border/50 my-2" />
                      <div className="space-y-1.5">
                        <Label htmlFor="AZURE_OPENAI_API_KEY" className="text-xs text-muted-foreground font-semibold">Azure OpenAI Key</Label>
                        <SecureInput id="AZURE_OPENAI_API_KEY" placeholder="azure-key-..." value={getApiKeyValue('azure')} onChange={(v) => handleApiKeyChange('azure', v)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="AZURE_OPENAI_ENDPOINT" className="text-xs text-muted-foreground font-semibold">Azure Endpoint</Label>
                        <Input id="AZURE_OPENAI_ENDPOINT" placeholder="https://<resource>.openai.azure.com/" value={getApiKeyValue('azure_endpoint')} onChange={(e) => handleApiKeyChange('azure_endpoint', e.target.value)} className="bg-background/50 focus:bg-background transition-colors rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="AZURE_OPENAI_DEPLOYMENT" className="text-xs text-muted-foreground font-semibold">Azure Deployment</Label>
                        <Input id="AZURE_OPENAI_DEPLOYMENT" placeholder="gpt-4o" value={getApiKeyValue('azure_deployment')} onChange={(e) => handleApiKeyChange('azure_deployment', e.target.value)} className="bg-background/50 focus:bg-background transition-colors rounded-xl" />
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="shadow-sm rounded-2xl bg-card/40 backdrop-blur">
                      <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                          <Globe className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">Regional Providers (CN)</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-5">
                        <div className="space-y-1.5">
                          <Label htmlFor="DASHSCOPE_API_KEY" className="text-xs text-muted-foreground font-semibold">DashScope / CN Key</Label>
                          <SecureInput id="DASHSCOPE_API_KEY" placeholder="sk-..." value={getApiKeyValue('dashscope')} onChange={(v) => handleApiKeyChange('dashscope', v)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="ZHIPU_API_KEY" className="text-xs text-muted-foreground font-semibold">Zhipu / CN Key</Label>
                          <SecureInput id="ZHIPU_API_KEY" placeholder="sk-..." value={getApiKeyValue('zhipu')} onChange={(v) => handleApiKeyChange('zhipu', v)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="MINIMAX_API_KEY" className="text-xs text-muted-foreground font-semibold">MiniMax / CN Key</Label>
                          <SecureInput id="MINIMAX_API_KEY" placeholder="sk-..." value={getApiKeyValue('minimax')} onChange={(v) => handleApiKeyChange('minimax', v)} />
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-6">
                      <Card className="shadow-sm rounded-2xl bg-card/40 backdrop-blur">
                        <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            <CardTitle className="text-base">Notifications & Alerts</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                          <div className="space-y-1.5">
                            <Label htmlFor="GOOGLE_EMAIL_APP_PASSWORD" className="text-xs text-muted-foreground font-semibold">Google App Password</Label>
                            <SecureInput id="GOOGLE_EMAIL_APP_PASSWORD" placeholder="abcd efgh ijkl mnop" value={getApiKeyValue('google_email')} onChange={(v) => handleApiKeyChange('google_email', v)} />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="TELEGRAM_BOT_TOKEN" className="text-xs text-muted-foreground font-semibold">Telegram Bot Token</Label>
                            <SecureInput id="TELEGRAM_BOT_TOKEN" placeholder="123456789:ABCDEF..." value={getApiKeyValue('telegram')} onChange={(v) => handleApiKeyChange('telegram', v)} />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm rounded-2xl bg-card/40 backdrop-blur">
                        <CardHeader className="bg-muted/30 pb-4">
                          <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">Local AI Servers</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-1.5">
                            <Label htmlFor="OLLAMA_BASE_URL" className="text-xs text-muted-foreground font-semibold">Ollama / LM Studio Base URL</Label>
                            <Input id="OLLAMA_BASE_URL" placeholder="http://localhost:11434/v1" value={formData.llm_backend_url || ""} onChange={(e) => setFormData(p => ({...p, llm_backend_url: e.target.value}))} className="rounded-xl bg-background/50" />
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Leave empty to use default local endpoints.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: AGENT CONFIGURATION */}
              {activeTab === 'configuration' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="shadow-sm rounded-2xl border-primary/20 bg-card/40 backdrop-blur overflow-hidden">
                    <CardHeader className="bg-primary/5 pb-4">
                      <CardTitle className="text-base">Core Agent Behavior</CardTitle>
                      <CardDescription className="text-xs">
                        Customize the AI models that drive the trading pipelines.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-8 lg:grid-cols-2">
                      <div className="space-y-6">
                        <div className="space-y-1.5">
                          <Label htmlFor="TRADINGAGENTS_LLM_PROVIDER" className="text-xs text-muted-foreground font-semibold">Primary LLM Provider</Label>
                          <Select value={formData.llm_provider} onValueChange={(val) => setFormData(p => ({...p, llm_provider: val}))}>
                            <SelectTrigger id="TRADINGAGENTS_LLM_PROVIDER" className="rounded-xl h-10 bg-background/50">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="openai">OpenAI (Recommended)</SelectItem>
                              <SelectItem value="azure">Azure OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                              <SelectItem value="google">Google Gemini</SelectItem>
                              <SelectItem value="deepseek">DeepSeek</SelectItem>
                              <SelectItem value="ollama">Local (Ollama)</SelectItem>
                              <SelectItem value="lmstudio">Local (LM Studio)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="TRADINGAGENTS_OUTPUT_LANGUAGE" className="text-xs text-muted-foreground font-semibold">Output Language</Label>
                          <Select value={formData.language} onValueChange={(val) => setFormData(p => ({...p, language: val}))}>
                            <SelectTrigger id="TRADINGAGENTS_OUTPUT_LANGUAGE" className="rounded-xl h-10 bg-background/50">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="English">English</SelectItem>
                              <SelectItem value="Vietnamese">Tiếng Việt</SelectItem>
                              <SelectItem value="Chinese">中文</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-6 bg-muted/20 p-5 rounded-2xl border border-dashed border-primary/20 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none rounded-2xl" />
                        <div className="space-y-1.5 relative">
                          <Label htmlFor="TRADINGAGENTS_DEEP_THINK_LLM" className="text-xs text-primary font-semibold">Deep Think Model (Reasoning)</Label>
                          <Input id="TRADINGAGENTS_DEEP_THINK_LLM" value={formData.deep_think_model} onChange={(e) => setFormData(p => ({...p, deep_think_model: e.target.value}))} className="rounded-xl bg-background/80" />
                          <p className="text-[10px] text-muted-foreground">Used for complex market analysis and strategy generation.</p>
                        </div>
                        <div className="space-y-1.5 relative">
                          <Label htmlFor="TRADINGAGENTS_QUICK_THINK_LLM" className="text-xs text-primary font-semibold">Quick Think Model (Execution)</Label>
                          <Input id="TRADINGAGENTS_QUICK_THINK_LLM" value={formData.quick_think_model} onChange={(e) => setFormData(p => ({...p, quick_think_model: e.target.value}))} className="rounded-xl bg-background/80" />
                          <p className="text-[10px] text-muted-foreground">Used for rapid classification and data extraction.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* TAB 3: ADVANCED */}
              {activeTab === 'advanced' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="shadow-sm rounded-2xl border-destructive/20 overflow-hidden bg-card/40 backdrop-blur">
                    <CardHeader className="bg-destructive/5 pb-4">
                      <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <Settings2 className="w-5 h-5"/> Engine Parameters
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Tune the underlying debate cycles and model sampling behavior.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid gap-6 sm:grid-cols-3">
                        <div className="space-y-1.5 bg-background/60 p-4 rounded-2xl border border-border/50">
                          <Label htmlFor="TRADINGAGENTS_MAX_DEBATE_ROUNDS" className="text-xs text-muted-foreground font-semibold">Debate Rounds</Label>
                          <Input id="TRADINGAGENTS_MAX_DEBATE_ROUNDS" type="number" min="0" max="10" value={formData.max_debate_rounds} onChange={(e) => setFormData(p => ({...p, max_debate_rounds: parseInt(e.target.value) || 0}))} className="rounded-xl" />
                          <p className="text-[10px] text-muted-foreground leading-tight mt-1">Iterations agents debate before consensus.</p>
                        </div>
                        
                        <div className="space-y-1.5 bg-background/60 p-4 rounded-2xl border border-border/50">
                          <Label htmlFor="TRADINGAGENTS_MAX_RISK_ROUNDS" className="text-xs text-muted-foreground font-semibold">Risk Rounds</Label>
                          <Input id="TRADINGAGENTS_MAX_RISK_ROUNDS" type="number" min="0" max="10" value={formData.max_risk_rounds} onChange={(e) => setFormData(p => ({...p, max_risk_rounds: parseInt(e.target.value) || 0}))} className="rounded-xl" />
                          <p className="text-[10px] text-muted-foreground leading-tight mt-1">Risk assessment evaluation cycles.</p>
                        </div>

                        <div className="space-y-1.5 bg-background/60 p-4 rounded-2xl border border-border/50">
                          <Label htmlFor="TRADINGAGENTS_TEMPERATURE" className="text-xs text-muted-foreground font-semibold">Temperature</Label>
                          <Input id="TRADINGAGENTS_TEMPERATURE" type="number" step="0.1" min="0" max="2" value={formData.temperature} onChange={(e) => setFormData(p => ({...p, temperature: parseFloat(e.target.value) || 0}))} className="rounded-xl" />
                          <p className="text-[10px] text-muted-foreground leading-tight mt-1">0.0 recommended for predictability.</p>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-5">
                        <div className="space-y-1 pr-4">
                          <Label className="text-sm font-semibold text-primary">Enable State Checkpoints</Label>
                          <p className="text-xs text-muted-foreground">
                            Saves agent states to database. Allows resuming interrupted runs but uses more storage.
                          </p>
                        </div>
                        <Switch id="TRADINGAGENTS_CHECKPOINT_ENABLED" checked={formData.checkpoint_enabled} onCheckedChange={(checked) => setFormData(p => ({...p, checkpoint_enabled: checked}))} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm rounded-2xl border-blue-500/20 bg-card/40 backdrop-blur overflow-hidden">
                    <CardHeader className="bg-blue-500/5 pb-4">
                      <div className="flex items-center gap-2">
                        <Server className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base text-blue-500">Observability & Tracing</CardTitle>
                      </div>
                      <CardDescription className="text-xs">
                        Configure LangSmith integration for monitoring agent logic.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex flex-row items-center justify-between rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                          <div className="space-y-1">
                            <Label className="text-sm font-semibold text-blue-500">Enable LangChain Tracing</Label>
                            <p className="text-xs text-muted-foreground">
                              (LANGCHAIN_TRACING_V2) Enable tracing for LLM calls.
                            </p>
                          </div>
                          <Switch 
                            id="LANGCHAIN_TRACING_V2" 
                            checked={getApiKeyValue('langchain_tracing_v2') === 'true'} 
                            onCheckedChange={(checked) => handleApiKeyChange('langchain_tracing_v2', checked ? 'true' : 'false')} 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="LANGCHAIN_API_KEY" className="text-xs text-muted-foreground font-semibold">LangChain API Key</Label>
                        <SecureInput 
                          id="LANGCHAIN_API_KEY" 
                          placeholder="lsv2_..." 
                          value={getApiKeyValue('langchain_api_key')} 
                          onChange={(v) => handleApiKeyChange('langchain_api_key', v)} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="LANGCHAIN_PROJECT" className="text-xs text-muted-foreground font-semibold">LangChain Project</Label>
                        <Input 
                          id="LANGCHAIN_PROJECT" 
                          placeholder="trading_agents" 
                          value={getApiKeyValue('langchain_project')} 
                          onChange={(e) => handleApiKeyChange('langchain_project', e.target.value)} 
                          className="bg-background/50 focus:bg-background transition-colors rounded-xl" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
