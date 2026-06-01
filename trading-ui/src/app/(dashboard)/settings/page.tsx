"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Save, ShieldCheck, Settings2, Cpu } from "lucide-react"

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
import { toast } from "sonner" // Assuming sonner is available since we saw it in list_dir

function SecureInput({ id, placeholder, defaultValue = "" }: { id: string, placeholder: string, defaultValue?: string }) {
  const [showPassword, setShowPassword] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="pr-10"
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
  const handleSave = () => {
    // Simulate save
    toast("Configuration Saved", {
      description: "Your agent settings have been securely saved.",
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:gap-8 lg:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Agent Settings</h1>
          <p className="text-muted-foreground">
            Manage your AI providers, model configurations, and system parameters.
          </p>
        </div>
        <Button onClick={handleSave} className="hidden sm:flex gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="providers" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            API Providers
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

        {/* TAB 1: PROVIDERS */}
        <TabsContent value="providers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider API Keys</CardTitle>
              <CardDescription>
                Securely store your API keys. These keys are used by the trading agents to access AI models.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="OPENAI_API_KEY">OpenAI API Key</Label>
                <SecureInput id="OPENAI_API_KEY" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="GOOGLE_API_KEY">Google API Key</Label>
                <SecureInput id="GOOGLE_API_KEY" placeholder="AIza..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ANTHROPIC_API_KEY">Anthropic API Key</Label>
                <SecureInput id="ANTHROPIC_API_KEY" placeholder="sk-ant-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="XAI_API_KEY">xAI API Key</Label>
                <SecureInput id="XAI_API_KEY" placeholder="xai-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="DEEPSEEK_API_KEY">DeepSeek API Key</Label>
                <SecureInput id="DEEPSEEK_API_KEY" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="OPENROUTER_API_KEY">OpenRouter API Key</Label>
                <SecureInput id="OPENROUTER_API_KEY" placeholder="sk-or-..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="DASHSCOPE_API_KEY">DashScope API Key</Label>
                <SecureInput id="DASHSCOPE_API_KEY" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="DASHSCOPE_CN_API_KEY">DashScope CN API Key</Label>
                <SecureInput id="DASHSCOPE_CN_API_KEY" placeholder="sk-..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ZHIPU_API_KEY">Zhipu API Key</Label>
                <SecureInput id="ZHIPU_API_KEY" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ZHIPU_CN_API_KEY">Zhipu CN API Key</Label>
                <SecureInput id="ZHIPU_CN_API_KEY" placeholder="sk-..." />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="MINIMAX_API_KEY">MiniMax API Key</Label>
                <SecureInput id="MINIMAX_API_KEY" placeholder="sk-..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="MINIMAX_CN_API_KEY">MiniMax CN API Key</Label>
                <SecureInput id="MINIMAX_CN_API_KEY" placeholder="sk-..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local & Remote Servers</CardTitle>
              <CardDescription>
                Configure local instances or custom compatible endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-xl">
                <Label htmlFor="OLLAMA_BASE_URL">Ollama Base URL</Label>
                <Input id="OLLAMA_BASE_URL" placeholder="http://localhost:11434/v1" />
                <p className="text-[0.8rem] text-muted-foreground mt-1">
                  Leave empty to default to local instance.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: AGENT CONFIGURATION */}
        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Agent Configuration</CardTitle>
              <CardDescription>
                Override the system default configuration without editing code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 max-w-md">
                <Label htmlFor="TRADINGAGENTS_LLM_PROVIDER">Primary LLM Provider</Label>
                <Select defaultValue="openai">
                  <SelectTrigger id="TRADINGAGENTS_LLM_PROVIDER">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="deepseek">DeepSeek</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_DEEP_THINK_LLM">Deep Think Model</Label>
                  <Input id="TRADINGAGENTS_DEEP_THINK_LLM" defaultValue="gpt-4o" />
                  <p className="text-[0.8rem] text-muted-foreground">Used for complex analysis.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_QUICK_THINK_LLM">Quick Think Model</Label>
                  <Input id="TRADINGAGENTS_QUICK_THINK_LLM" defaultValue="gpt-4o-mini" />
                  <p className="text-[0.8rem] text-muted-foreground">Used for rapid classification.</p>
                </div>
              </div>

              <div className="space-y-2 max-w-xl">
                <Label htmlFor="TRADINGAGENTS_LLM_BACKEND_URL">LLM Backend URL (Override)</Label>
                <Input id="TRADINGAGENTS_LLM_BACKEND_URL" placeholder="https://..." />
                <p className="text-[0.8rem] text-muted-foreground">Optional: Override default API endpoints (e.g. for LM Studio).</p>
              </div>

              <div className="space-y-2 max-w-md">
                <Label htmlFor="TRADINGAGENTS_OUTPUT_LANGUAGE">Output Language</Label>
                <Select defaultValue="English">
                  <SelectTrigger id="TRADINGAGENTS_OUTPUT_LANGUAGE">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: ADVANCED */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engine Parameters</CardTitle>
              <CardDescription>
                Tune the trading agent debate cycles and model sampling behavior.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_MAX_DEBATE_ROUNDS">Max Debate Rounds</Label>
                  <Input id="TRADINGAGENTS_MAX_DEBATE_ROUNDS" type="number" min="0" max="10" defaultValue="1" />
                  <p className="text-[0.8rem] text-muted-foreground">Number of iterations agents debate before consensus.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="TRADINGAGENTS_MAX_RISK_ROUNDS">Max Risk Rounds</Label>
                  <Input id="TRADINGAGENTS_MAX_RISK_ROUNDS" type="number" min="0" max="10" defaultValue="1" />
                  <p className="text-[0.8rem] text-muted-foreground">Number of risk assessment evaluation cycles.</p>
                </div>
              </div>

              <div className="space-y-2 max-w-md">
                <Label htmlFor="TRADINGAGENTS_TEMPERATURE">Temperature</Label>
                <Input id="TRADINGAGENTS_TEMPERATURE" type="number" step="0.1" min="0" max="2" defaultValue="0.0" />
                <p className="text-[0.8rem] text-muted-foreground">Lower value = less variation. (0.0 recommended for predictability).</p>
              </div>

              <div className="flex flex-row items-center justify-between rounded-lg border p-4 max-w-2xl">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Checkpoints</Label>
                  <p className="text-[0.8rem] text-muted-foreground">
                    Save agent states to resume interrupted runs.
                  </p>
                </div>
                <Switch id="TRADINGAGENTS_CHECKPOINT_ENABLED" />
              </div>

            </CardContent>
            <CardFooter className="bg-muted/50 py-4 border-t sm:hidden">
              <Button onClick={handleSave} className="w-full gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
