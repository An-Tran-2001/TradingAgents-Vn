"use client"

import React, { useState } from "react"
import { 
  Bot, 
  Brain, 
  Coins, 
  Cpu, 
  LineChart, 
  MessageSquare, 
  Play, 
  RotateCcw, 
  ShieldCheck, 
  TrendingUp, 
  Users,
  Terminal,
  ChevronRight,
  Sparkles,
  Database
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

// Steps mapping for Workflow Diagram
const WORKFLOW_STEPS = [
  {
    id: "data",
    label: "Data Ingestion",
    icon: Database,
    description: "Fetches live price data, technical indicators, and social sentiment (Reddit, X, StockTwits).",
    color: "from-blue-500 to-cyan-500 animate-pulse",
    glow: "shadow-blue-500/20"
  },
  {
    id: "analysts",
    label: "Analyst Team",
    icon: Users,
    description: "Specialized agents run parallel research on Fundamentals, News, Sentiment & Technicals.",
    color: "from-cyan-500 to-teal-500",
    glow: "shadow-cyan-500/20",
    subAgents: ["Fundamentals Analyst", "Sentiment Analyst", "News Analyst", "Technical Analyst"]
  },
  {
    id: "researchers",
    label: "Debate & Research",
    icon: Brain,
    description: "Bull and Bear Researchers debate risks and upside. Research Manager weights the final consensus.",
    color: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/20",
    subAgents: ["Bull Researcher", "Bear Researcher", "Research Manager"]
  },
  {
    id: "risk",
    label: "Risk & Execution",
    icon: ShieldCheck,
    description: "Trader proposes sizing. Risk Management verifies bounds and Portfolio Manager signs off.",
    color: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/20",
    subAgents: ["Trader Agent", "Risk Management", "Portfolio Manager"]
  },
  {
    id: "exchange",
    label: "Order Execution",
    icon: Coins,
    description: "Sends the approved transaction order to the Simulated Exchange broker for execution.",
    color: "from-green-500 to-emerald-500",
    glow: "shadow-green-500/20"
  }
]

export default function HomeIntroPage() {
  const [activeStep, setActiveStep] = useState<string>("data")

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto custom-scrollbar p-6 bg-background/30 relative">
      <div className="cyber-grid pointer-events-none absolute inset-0 z-0" />
      
      <div className="relative z-10 space-y-8 max-w-6xl mx-auto w-full pb-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/20 backdrop-blur-md p-8 md:p-12 shadow-[inset_0_0_30px_rgba(0,240,255,0.05)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-2xl space-y-4">
            <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 px-3 py-1 font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" /> VERSION 0.2.5
            </Badge>
            
            <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
              TradingAgents VN
            </h1>
            
            <p className="text-lg text-muted-foreground leading-relaxed">
              An AI-powered multi-agent financial trading framework mirroring real-world trading desks. 
              Deploying specialized LLM agents from research analysts to risk managers cooperating to beat the market.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild className="bg-primary hover:bg-primary/95 text-background font-bold shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                <Link href="/research" className="flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current" /> Run Simulation Now
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/5 text-foreground">
                <Link href="/jobs" className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Manage Schedules
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Workflow Diagram & Architecture */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Standard Multi-Agent Workflow
            </h2>
            <p className="text-muted-foreground text-sm">
              Click on each phase to discover the agents, roles, and collaborative decision pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Interactive Steps */}
            <div className="lg:col-span-2 flex flex-col justify-between space-y-4 p-6 rounded-2xl border border-border/50 bg-card/10 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
              
              {/* Nodes Map */}
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-2 pt-6 pb-4">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = activeStep === step.id
                  return (
                    <React.Fragment key={step.id}>
                      {/* Connection Line */}
                      {idx > 0 && (
                        <div className="hidden md:block flex-1 h-[2px] bg-gradient-to-r from-primary/30 to-primary/50 relative">
                          <div className="absolute inset-0 bg-primary/80 animate-ping opacity-20" />
                        </div>
                      )}
                      
                      {/* Node Button */}
                      <button
                        onClick={() => setActiveStep(step.id)}
                        className={`relative z-10 flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-300 w-28 text-center group ${
                          isActive 
                            ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(0,240,255,0.15)] scale-105"
                            : "bg-background/80 border-border/50 hover:border-primary/40 hover:scale-102"
                        }`}
                      >
                        <div className={`p-2.5 rounded-lg bg-gradient-to-br ${step.color} text-background mb-2 shadow-lg`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-bold tracking-tight uppercase group-hover:text-primary transition-colors">
                          {step.label}
                        </span>
                      </button>
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Active Step Panel */}
              {(() => {
                const current = WORKFLOW_STEPS.find(s => s.id === activeStep)!
                const StepIcon = current.icon
                return (
                  <div className="mt-4 p-5 rounded-xl border border-primary/20 bg-black/40 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <StepIcon className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-base text-primary">{current.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {current.description}
                      </p>
                    </div>

                    {current.subAgents && (
                      <div className="mt-4 pt-3 border-t border-border/20">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                          Active Agents in this Phase:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {current.subAgents.map(sa => (
                            <Badge key={sa} variant="outline" className="bg-primary/5 border-primary/20 text-xs px-2 py-0.5 text-primary font-mono">
                              {sa}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Quick Summary Sidebar */}
            <div className="flex flex-col justify-between p-6 rounded-2xl border border-border/50 bg-card/10 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Framework Tech</h3>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/30">
                    <h4 className="font-bold text-xs text-foreground mb-1">State Persistence</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Utilizes SQLite Database checkpoints powered by LangGraph, enabling recovery or resume from intermediate crashed steps.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/30">
                    <h4 className="font-bold text-xs text-foreground mb-1">Self-Correction & Memory</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Feeds realized returns of past decisions into the Portfolio Manager prompt for continuous optimization.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30 mt-4">
                <Link href="/research" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  Go to Command Center <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Roles Breakdown */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Core Agent Teams
            </h2>
            <p className="text-muted-foreground text-sm">
              Each team mirrors standard investment bank structures.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 border-border/50 bg-card/30 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                  <LineChart className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">1. Analyst Team</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ingests technical indicators, macroeconomic updates, news stories, and stock chatter into a single, comprehensive market reading.
                </p>
              </div>
            </Card>

            <Card className="p-5 border-border/50 bg-card/30 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                  <Brain className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">2. Research Team</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Employs structured debates between Bull and Bear researchers to challenge bias and balance risk, managed by the Research Manager.
                </p>
              </div>
            </Card>

            <Card className="p-5 border-border/50 bg-card/30 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 text-orange-400">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">3. Trader Agent</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Synthesizes reports from research and analysts to construct order proposals, defining entry, exit targets and timing.
                </p>
              </div>
            </Card>

            <Card className="p-5 border-border/50 bg-card/30 hover:border-primary/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">4. Portfolio & Risk</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enforces position sizing bounds, verifies drawdown risk, and grants final execution sign-off before trades land on-chain.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
