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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
        className="pr-10 bg-background/50 focus:bg-background transition-colors"
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
      <div className="flex flex-1 items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8 max-w-5xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Manage your AI providers, notifications, and core agent parameters.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="hidden sm:flex gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mb-6">
          <TabsTrigger value="providers" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            API & Integrations
          </TabsTrigger>
          <TabsTrigger value="configuration" className="gap-2">
            <Cpu className="h-4 w-4" />
            Agent Config
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: API & INTEGRATIONS */}
        <TabsContent value="providers" className="space-y-8 animate-in fade-in-50 duration-500">
          
          {/* Global LLMs */}
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Global LLM Providers</CardTitle>
              </div>
              <CardDescription>
                Primary API keys for world-class AI models.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="OPENAI_API_KEY">OpenAI API Key</Label>
                <SecureInput id="OPENAI_API_KEY" placeholder="sk-..." value={getApiKeyValue('openai')} onChange={(v) => handleApiKeyChange('openai', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ANTHROPIC_API_KEY">Anthropic API Key</Label>
                <SecureInput id="ANTHROPIC_API_KEY" placeholder="sk-ant-..." value={getApiKeyValue('anthropic')} onChange={(v) => handleApiKeyChange('anthropic', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="GOOGLE_API_KEY">Google API Key</Label>
                <SecureInput id="GOOGLE_API_KEY" placeholder="AIza..." value={getApiKeyValue('google')} onChange={(v) => handleApiKeyChange('google', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="XAI_API_KEY">xAI API Key</Label>
                <SecureInput id="XAI_API_KEY" placeholder="xai-..." value={getApiKeyValue('xai')} onChange={(v) => handleApiKeyChange('xai', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="DEEPSEEK_API_KEY">DeepSeek API Key</Label>
                <SecureInput id="DEEPSEEK_API_KEY" placeholder="sk-..." value={getApiKeyValue('deepseek')} onChange={(v) => handleApiKeyChange('deepseek', v)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="OPENROUTER_API_KEY">OpenRouter API Key</Label>
                <SecureInput id="OPENROUTER_API_KEY" placeholder="sk-or-..." value={getApiKeyValue('openrouter')} onChange={(v) => handleApiKeyChange('openrouter', v)} />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Regional LLMs */}
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Regional Providers (CN)</CardTitle>
                </div>
                <CardDescription>
                  API keys for specialized regional models.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="DASHSCOPE_API_KEY">DashScope / CN Key</Label>
                  <SecureInput id="DASHSCOPE_API_KEY" placeholder="sk-..." value={getApiKeyValue('dashscope')} onChange={(v) => handleApiKeyChange('dashscope', v)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ZHIPU_API_KEY">Zhipu / CN Key</Label>
                  <SecureInput id="ZHIPU_API_KEY" placeholder="sk-..." value={getApiKeyValue('zhipu')} onChange={(v) => handleApiKeyChange('zhipu', v)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="MINIMAX_API_KEY">MiniMax / CN Key</Label>
                  <SecureInput id="MINIMAX_API_KEY" placeholder="sk-..." value={getApiKeyValue('minimax')} onChange={(v) => handleApiKeyChange('minimax', v)} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              {/* Notifications */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Notifications & Alerts</CardTitle>
                  </div>
                  <CardDescription>
                    Configure automated reporting channels.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="GOOGLE_EMAIL_APP_PASSWORD">Google App Password</Label>
                    <SecureInput id="GOOGLE_EMAIL_APP_PASSWORD" placeholder="abcd efgh ijkl mnop" value={getApiKeyValue('google_email')} onChange={(v) => handleApiKeyChange('google_email', v)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="TELEGRAM_BOT_TOKEN">Telegram Bot Token</Label>
                    <SecureInput id="TELEGRAM_BOT_TOKEN" placeholder="123456789:ABCDEF..." value={getApiKeyValue('telegram')} onChange={(v) => handleApiKeyChange('telegram', v)} />
                  </div>
                </CardContent>
              </Card>

              {/* Local Servers */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-muted-foreground" />
                    <CardTitle>Local AI Servers</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="OLLAMA_BASE_URL">Ollama / LM Studio Base URL</Label>
                    <Input id="OLLAMA_BASE_URL" placeholder="http://localhost:11434/v1" value={formData.llm_backend_url || ""} onChange={(e) => setFormData(p => ({...p, llm_backend_url: e.target.value}))} />
                    <p className="text-[0.8rem] text-muted-foreground mt-1">
                      Leave empty to use default local endpoints.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: AGENT CONFIGURATION */}
        <TabsContent value="configuration" className="space-y-8 animate-in fade-in-50 duration-500">
          <Card className="border-t-4 border-t-primary shadow-sm">
            <CardHeader>
              <CardTitle>Core Agent Behavior</CardTitle>
              <CardDescription>
                Customize the AI models that drive the trading pipelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-8 lg:grid-cols-2">
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_LLM_PROVIDER">Primary LLM Provider</Label>
                  <Select value={formData.llm_provider} onValueChange={(val) => setFormData(p => ({...p, llm_provider: val}))}>
                    <SelectTrigger id="TRADINGAGENTS_LLM_PROVIDER">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI (Recommended)</SelectItem>
                      <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                      <SelectItem value="google">Google Gemini</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                      <SelectItem value="ollama">Local (Ollama)</SelectItem>
                      <SelectItem value="lmstudio">Local (LM Studio)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_OUTPUT_LANGUAGE">Output Language</Label>
                  <Select value={formData.language} onValueChange={(val) => setFormData(p => ({...p, language: val}))}>
                    <SelectTrigger id="TRADINGAGENTS_OUTPUT_LANGUAGE">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Vietnamese">Tiếng Việt</SelectItem>
                      <SelectItem value="Chinese">中文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6 bg-muted/30 p-6 rounded-xl border border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_DEEP_THINK_LLM">Deep Think Model (Reasoning)</Label>
                  <Input id="TRADINGAGENTS_DEEP_THINK_LLM" value={formData.deep_think_model} onChange={(e) => setFormData(p => ({...p, deep_think_model: e.target.value}))} />
                  <p className="text-[0.8rem] text-muted-foreground">Used for complex market analysis and strategy generation.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_QUICK_THINK_LLM">Quick Think Model (Execution)</Label>
                  <Input id="TRADINGAGENTS_QUICK_THINK_LLM" value={formData.quick_think_model} onChange={(e) => setFormData(p => ({...p, quick_think_model: e.target.value}))} />
                  <p className="text-[0.8rem] text-muted-foreground">Used for rapid classification and data extraction.</p>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ADVANCED */}
        <TabsContent value="advanced" className="space-y-8 animate-in fade-in-50 duration-500">
          <Card className="border-t-4 border-t-destructive shadow-sm">
            <CardHeader>
              <CardTitle>Engine Parameters</CardTitle>
              <CardDescription>
                Tune the underlying debate cycles and model sampling behavior. Modifying these can affect performance and cost.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              <div className="grid gap-8 sm:grid-cols-3">
                <div className="space-y-2 bg-background p-4 rounded-lg border">
                  <Label htmlFor="TRADINGAGENTS_MAX_DEBATE_ROUNDS" className="font-medium">Debate Rounds</Label>
                  <Input id="TRADINGAGENTS_MAX_DEBATE_ROUNDS" type="number" min="0" max="10" value={formData.max_debate_rounds} onChange={(e) => setFormData(p => ({...p, max_debate_rounds: parseInt(e.target.value) || 0}))} />
                  <p className="text-[0.8rem] text-muted-foreground">Iterations agents debate before consensus.</p>
                </div>
                
                <div className="space-y-2 bg-background p-4 rounded-lg border">
                  <Label htmlFor="TRADINGAGENTS_MAX_RISK_ROUNDS" className="font-medium">Risk Rounds</Label>
                  <Input id="TRADINGAGENTS_MAX_RISK_ROUNDS" type="number" min="0" max="10" value={formData.max_risk_rounds} onChange={(e) => setFormData(p => ({...p, max_risk_rounds: parseInt(e.target.value) || 0}))} />
                  <p className="text-[0.8rem] text-muted-foreground">Risk assessment evaluation cycles.</p>
                </div>

                <div className="space-y-2 bg-background p-4 rounded-lg border">
                  <Label htmlFor="TRADINGAGENTS_TEMPERATURE" className="font-medium">Temperature</Label>
                  <Input id="TRADINGAGENTS_TEMPERATURE" type="number" step="0.1" min="0" max="2" value={formData.temperature} onChange={(e) => setFormData(p => ({...p, temperature: parseFloat(e.target.value) || 0}))} />
                  <p className="text-[0.8rem] text-muted-foreground">0.0 recommended for predictability.</p>
                </div>
              </div>

              <div className="flex flex-row items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 max-w-2xl">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Enable State Checkpoints</Label>
                  <p className="text-sm text-muted-foreground">
                    Saves agent states to database. Allows resuming interrupted runs but uses more storage.
                  </p>
                </div>
                <Switch id="TRADINGAGENTS_CHECKPOINT_ENABLED" checked={formData.checkpoint_enabled} onCheckedChange={(checked) => setFormData(p => ({...p, checkpoint_enabled: checked}))} />
              </div>

            </CardContent>
            
            {/* Mobile save button */}
            <CardFooter className="bg-muted/50 py-6 border-t sm:hidden">
              <Button onClick={handleSave} disabled={isSaving} size="lg" className="w-full gap-2 text-lg h-14">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save All Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
