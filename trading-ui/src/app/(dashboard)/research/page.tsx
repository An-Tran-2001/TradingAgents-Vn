"use client"

import React, { useState, useEffect } from "react"
import { useLanguage } from "@/contexts/language-context"
import {
  BarChart3,
  Scale,
  ShieldCheck,
  RotateCcw
} from "lucide-react"

import { Button } from "@/components/ui/button"

import { HistorySidebar } from "./components/HistorySidebar"
import { PipelineVisualization } from "./components/PipelineVisualization"
import { CliLogViewer } from "./components/CliLogViewer"
import { ChatInterface } from "./components/ChatInterface"
import { SettingsPanel } from "./components/SettingsPanel"
import { Message } from "./components/types"

export default function AgentsResearchPage() {
  const { t } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [ticker, setTicker] = useState("")
  
  // Cyberpunk Workflow State
  const [isTyping, setIsTyping] = useState(false)
  const [logAnimationStep, setLogAnimationStep] = useState(0)
  const [activeLogTab, setActiveLogTab] = useState<"All" | "Fundamentals Analyst" | "Sentiment Analyst" | "News Analyst" | "Technical Analyst" | "Bull Researcher" | "Bear Researcher" | "Research Manager" | "Risk Management" | "Portfolio Manager" | "Trader">("All")
  
  // History Sidebar State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Timer for log animation
  useEffect(() => {
    if (isTyping) {
      setLogAnimationStep(0)
      const timer = setInterval(() => {
        setLogAnimationStep(prev => {
          if (prev < 12) return prev + 1
          clearInterval(timer)
          
          // Complete the pipeline and show report
          setTimeout(() => {
            setIsTyping(false)
            setActiveLogTab("All")
            
            setMessages((msgs) => {
              // Prevent duplicate report on replay
              const targetTicker = ticker || "the requested market"
              const lastMsg = msgs[msgs.length - 1]
              if (lastMsg && lastMsg.role === "agent" && lastMsg.content && (lastMsg.content as any)?.props?.children?.[0]?.props?.children?.[2]?.props?.children === targetTicker) {
                return msgs
              }
              
              return [
                ...msgs,
                {
                  id: (Date.now() + 1).toString(),
                  role: "agent",
                  agentRole: "Tauric Nexus",
                  content: (
                    <div className="space-y-4">
                      <p>Pipeline synthesis complete for <strong>{targetTicker}</strong>.</p>
                      <div className="rounded-lg bg-card/50 p-4 border border-primary/10 shadow-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-cyan-500"/> Market Analysis</h4>
                        <p className="text-sm text-muted-foreground">Analyst Team reported strong consolidation. Technicals suggest a potential breakout despite short-term neutral action.</p>
                      </div>
                      <div className="rounded-lg bg-card/50 p-4 border border-primary/10 shadow-sm">
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Scale className="h-4 w-4 text-pink-500"/> Debate Conclusion</h4>
                        <p className="text-sm text-muted-foreground">Bearish debaters noted macroeconomic headwinds, but the Bullish consensus prevailed due to institutional buying pressure and accumulation patterns. Research Manager approved Bullish thesis.</p>
                      </div>
                      <div className="rounded-lg bg-card/50 p-4 border border-green-500/20 bg-green-500/5 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-500"><ShieldCheck className="h-4 w-4"/> Execution Order</h4>
                        <p className="text-sm font-medium text-green-400">RECOMMENDATION: ACCUMULATE (Target Allocation 1.5%)</p>
                      </div>
                      <div className="pt-2 border-t border-primary/10 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => replayWorkflow(targetTicker)}
                          className="text-xs h-8 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-primary transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Replay Workflow
                        </Button>
                      </div>
                    </div>
                  ),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ]
            })
          }, 1000)
          return prev
        })
      }, 1000) // 1 step per second
      return () => clearInterval(timer)
    }
  }, [isTyping, ticker])

  const handleSend = (text: string, suggestedTicker?: string) => {
    if (!text.trim()) return

    if (suggestedTicker) {
      setTicker(suggestedTicker)
    }

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, newMsg])
    setIsTyping(true)
  }

  const replayWorkflow = (targetTicker: string) => {
    setIsTyping(true)
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col lg:flex-row overflow-hidden bg-background/50 relative z-0">
      
      {/* Sci-Fi Background Grid */}
      <div className="cyber-grid pointer-events-none"></div>

      {/* History Sidebar (Left) */}
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
      
      {/* Main Chat Area (Left/Center) */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {isTyping ? (
          <div className="flex h-full w-full flex-col p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-700">
            {/* TOP HALF: Fantasy Pipeline Visualization */}
            <PipelineVisualization logAnimationStep={logAnimationStep} />

            {/* BOTTOM HALF: CLI-STYLE LOG VIEWER */}
            <CliLogViewer 
              logAnimationStep={logAnimationStep}
              activeLogTab={activeLogTab}
              setActiveLogTab={setActiveLogTab}
              isTyping={isTyping}
            />
          </div>
        ) : (
          <ChatInterface 
            messages={messages}
            isTyping={isTyping}
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            onSend={handleSend}
          />
        )}
      </div>

      {/* Settings Panel (Right side) */}
      <SettingsPanel />
    </div>
  )
}
