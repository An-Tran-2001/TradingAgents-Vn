"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useLanguage } from "@/contexts/language-context"
import Cookies from "js-cookie"
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
import { FinalReport } from "./components/FinalReport"
import { Message, AgentLog } from "./components/types"
import { agentChatsApi } from "@/lib/api/agent_chats"

const AGENT_STEP_MAP: Record<string, number> = {
  "Fundamentals Analyst": 1,
  "Sentiment Analyst": 2,
  "News Analyst": 3,
  "Technical Analyst": 4,
  "Bull Researcher": 5,
  "Bear Researcher": 6,
  "Research Manager": 7,
  "Aggressive Analyst": 8,
  "Conservative Analyst": 8,
  "Neutral Analyst": 8,
  "Risk Management": 8,
  "Portfolio Manager": 9,
  "Trader": 10,
  "System": 11
};

export default function AgentsResearchPage() {
  const { t, language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [ticker, setTicker] = useState("")
  
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [sessionId, setSessionId] = useState<number | null>(null)
  
  // Cyberpunk Workflow State
  const [isTyping, setIsTyping] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [isViewingLogs, setIsViewingLogs] = useState(false)
  const [isCliExpanded, setIsCliExpanded] = useState(false)
  const [logAnimationStep, setLogAnimationStep] = useState(0)
  const [activeLogTab, setActiveLogTab] = useState<string>("All")
  const [activeTool, setActiveTool] = useState<string | null>(null)
  
  // History Sidebar State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [refreshSidebarTrigger, setRefreshSidebarTrigger] = useState(0)

  const handleSelectSession = useCallback(async (selectedSessionId: number) => {
    try {
      setIsHistoryOpen(false);
      setSessionId(selectedSessionId);
      setIsTyping(false);
      setIsResearching(false);
      setIsViewingLogs(false);
      setIsCliExpanded(false);
      setLogs([]);
      setLogAnimationStep(0);
      
      const sessionData = await agentChatsApi.getSessionDetails(selectedSessionId);
      
      if (sessionData.ticker) {
        setTicker(sessionData.ticker);
      }

      if (sessionData.messages) {
        let restoredLogs: AgentLog[] = [];
        
        const loadedMsgs = sessionData.messages.map((m: any) => {
          let content = m.content;
          try {
            if (content.startsWith('{"type": "final_report"')) {
              const parsed = JSON.parse(content);
              content = (
                <div className="space-y-4">
                  <FinalReport 
                    ticker={sessionData.ticker || "Asset"} 
                    finalState={parsed.state} 
                    onReplay={replayWorkflow}
                    onViewLogs={() => {
                      if (parsed.logs && parsed.logs.length > 0) {
                        setLogs(parsed.logs.map((log: any) => ({
                          step: log.step,
                          time: log.time,
                          agent: log.agent,
                          type: log.log_type,
                          content: log.content
                        })));
                        setLogAnimationStep(12);
                      }
                      setIsViewingLogs(true);
                      setIsCliExpanded(true);
                    }}
                  />
                </div>
              );
              
              if (parsed.logs && parsed.logs.length > 0) {
                 restoredLogs = parsed.logs.map((log: any) => ({
                    step: log.step,
                    time: log.time,
                    agent: log.agent,
                    type: log.log_type,
                    content: log.content
                 }));
              }
            }
          } catch (e) {}
          
          return {
            id: m.id.toString(),
            role: m.role === "user" ? "user" : "assistant",
            agentRole: m.agent_name || "Orchestrator",
            content: content,
            timestamp: new Date(m.created_at || m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });
        
        setMessages(loadedMsgs);
        if (restoredLogs.length > 0) {
          setLogs(restoredLogs);
          setLogAnimationStep(12);
        } else {
          setLogs([]);
        }
      } else {
        setMessages([]);
        setLogs([]);
      }
    } catch (e) {
      console.error("Failed to load session details", e);
    }
  }, []);



  const handleNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setTicker("");
    setIsTyping(false);
    setIsResearching(false);
    setIsViewingLogs(false);
    setIsCliExpanded(false);
    setLogs([]);
    setLogAnimationStep(0);
    setIsHistoryOpen(false);
  }, []);

  // No mock timer needed anymore

  const handleSend = async (text: string, suggestedTicker?: string) => {
    if (!text.trim()) return

    const activeTicker = suggestedTicker || ticker
    if (activeTicker) setTicker(activeTicker)

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages((prev) => [...prev, newMsg])
    setIsTyping(true)
    setActiveTool(null)
    setIsResearching(false)
    setIsViewingLogs(false)
    setIsCliExpanded(false)
    setLogs([])
    setLogAnimationStep(0)
    
    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const session = await agentChatsApi.createSession(text.substring(0, 50) + "...", activeTicker);
        currentSessionId = session.id;
        setSessionId(currentSessionId);
        setRefreshSidebarTrigger(prev => prev + 1);
      }
      
      // Get full config from local storage
      let configPayload: any = { output_language: language };
      try {
        const savedSettings = localStorage.getItem("trading_research_settings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          
          const active_teams = [];
          if (parsed.teamFundamentals) active_teams.push("Fundamentals");
          if (parsed.teamSentiment) active_teams.push("Sentiment");
          if (parsed.teamNews) active_teams.push("News");
          if (parsed.teamTechnical) active_teams.push("Technical");

          configPayload = {
            ...configPayload,
            llm_provider: parsed.selectedProvider || "openai",
            model: parsed.useAdvancedModels ? undefined : (parsed.selectedModel || "gpt-4o"),
            quick_think_model: parsed.useAdvancedModels ? (parsed.selectedQuickModel || parsed.selectedModel) : undefined,
            deep_think_model: parsed.useAdvancedModels ? (parsed.selectedDeepModel || parsed.selectedModel) : undefined,
            depth: parsed.depth || "medium",
            reasoning_effort: parsed.effort || "high",
            active_teams: active_teams.length > 0 ? active_teams : ["Fundamentals", "Sentiment", "News", "Technical"],
            temperature: parsed.temperature !== undefined ? Number(parsed.temperature) : undefined,
            top_p: parsed.topP !== undefined ? Number(parsed.topP) : undefined,
            top_k: parsed.topK !== undefined ? Number(parsed.topK) : undefined,
            max_tokens: parsed.maxTokens !== undefined ? Number(parsed.maxTokens) : undefined,
            max_retries: parsed.maxRetries !== undefined ? Number(parsed.maxRetries) : undefined,
          };
        }
      } catch (e) {
        console.warn("Could not read settings from localStorage", e);
      }
      
      // Inject chat history to provide context
      const chatHistory = messages.map(msg => {
        let contentStr = "";
        if (typeof msg.content === 'string') {
          contentStr = msg.content;
        } else {
          contentStr = "Research Complete. A detailed report has been generated.";
        }
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: contentStr
        };
      });
      configPayload.chat_history = chatHistory;
      
      const res = await agentChatsApi.chatStream(currentSessionId as number, text, configPayload);
      if (!res.body) throw new Error("No response body");
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      
      let finalState: any = null;
      let finalContent: string = "";
      
      let activeMessageId: string | null = null;
      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const line = buffer.slice(0, boundary).trim();
          buffer = buffer.slice(boundary + 2);
          
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === "text_chunk") {
                setIsTyping(false); // Remove typing indicator since we are streaming text now
                
                if (!activeMessageId) {
                  activeMessageId = Date.now().toString();
                  setMessages(prev => [...prev, {
                    id: activeMessageId!,
                    role: "assistant",
                    content: data.content,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }]);
                } else {
                  setMessages(prev => prev.map(msg => 
                    msg.id === activeMessageId 
                      ? { ...msg, content: msg.content + data.content } 
                      : msg
                  ));
                }
              } else if (data.type === "done") {
                setIsTyping(false); // Safety fallback
                setActiveTool(null);
              } else if (data.type === "text") {
                // Fallback for older non-streaming API events
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.content,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
                setIsTyping(false);
                setActiveTool(null);
              } else if (data.type === "handoff") {
                setIsResearching(true);
                setActiveTool(null);
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: data.content || "Starting financial research pipeline...",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
              } else if (data.type === "orchestrator_tool_start") {
                setActiveTool(data.tool);
                const newLog: AgentLog = {
                  step: 0,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  agent: "System",
                  type: "Action",
                  content: `**Orchestrator Action**: Calling tool \`${data.tool}\` with args: \`${JSON.stringify(data.args)}\``
                };
                setLogs(prev => [...prev, newLog]);
              } else if (data.type === "orchestrator_tool_end") {
                setActiveTool(null);
                const snippet = data.result && data.result.length > 120 ? data.result.slice(0, 117) + "..." : data.result;
                const newLog: AgentLog = {
                  step: 0,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  agent: "System",
                  type: "Tool",
                  content: `**Orchestrator Tool Result**: \`${data.tool}\` execution completed. Output: \`${snippet}\``
                };
                setLogs(prev => [...prev, newLog]);
              } else if (data.type === "agent_log") {
                setIsResearching(true);
                const newLog: AgentLog = {
                  step: data.step,
                  time: data.time,
                  agent: data.agent,
                  type: data.log_type,
                  content: data.content
                };
                setLogs(prev => [...prev, newLog]);
                
                // Update log animation step based on mapped agent
                const step = AGENT_STEP_MAP[data.agent];
                if (step) {
                  setLogAnimationStep(prev => Math.max(prev, step));
                }
              } else if (data.type === "agent_log_chunk") {
                setLogs(prev => {
                  const newLogs = [...prev];
                  const lastLog = newLogs[newLogs.length - 1];
                  if (lastLog && lastLog.agent === data.agent) {
                    newLogs[newLogs.length - 1] = {
                      ...lastLog,
                      content: lastLog.content + data.content
                    };
                  }
                  return newLogs;
                });
              } else if (data.type === "pipeline_complete") {
                finalState = data.final_state;
                setLogAnimationStep(12); // Finish pipeline visually
              } else if (data.type === "error" || data.type === "pipeline_error") {
                setIsTyping(false);
                setIsResearching(false);
                setActiveTool(null);
                setMessages(prev => [...prev, {
                  id: Date.now().toString(),
                  role: "assistant",
                  content: `**⚠️ Error Encountered:**\n\n${data.content || "An unknown error occurred during execution."}`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk", e, "Line:", line);
            }
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
      
      // If we got a final state, show the complete report
      if (finalState) {
        setTimeout(() => {
          setIsTyping(false);
          setIsResearching(false);
          setActiveLogTab("All");
          
          setMessages(prev => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && (lastMsg.role === "assistant" || lastMsg.role === "agent")) {
              return [
                ...prev.slice(0, -1),
                {
                  ...lastMsg,
                  content: (
                    <div className="space-y-4">
                      {typeof lastMsg.content === 'string' ? <p>{lastMsg.content}</p> : lastMsg.content}
                      <FinalReport 
                        ticker={activeTicker || "Asset"} 
                        finalState={finalState} 
                        onReplay={replayWorkflow}
                        onViewLogs={() => {
                          setIsViewingLogs(true);
                          setIsCliExpanded(true);
                        }}
                      />
                    </div>
                  )
                }
              ];
            } else {
              return [
                ...prev,
                {
                  id: Date.now().toString(),
                  role: "agent",
                  agentRole: "Tauric Nexus",
                  content: (
                    <FinalReport 
                      ticker={activeTicker || "Asset"} 
                      finalState={finalState} 
                      onReplay={replayWorkflow}
                      onViewLogs={() => {
                        setIsViewingLogs(true);
                        setIsCliExpanded(true);
                      }}
                    />
                  ),
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              ];
            }
          });
        }, 1000);
      }
      
    } catch (e) {
      console.error("Chat error:", e);
      setIsTyping(false);
    }
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
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshTrigger={refreshSidebarTrigger}
      />
      
      {/* Main Chat Area (Left/Center) */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {(isResearching || isViewingLogs) ? (
          <div className="flex h-full w-full flex-col p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-700">
            {isViewingLogs && !isResearching && (
              <div className="mb-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewingLogs(false)}
                  className="bg-background/50 backdrop-blur border-primary/20 hover:bg-primary/10 hover:text-primary text-muted-foreground"
                >
                  &larr; Back to Chat
                </Button>
              </div>
            )}
            {/* TOP HALF: Fantasy Pipeline Visualization */}
            {!isCliExpanded && <PipelineVisualization logAnimationStep={logAnimationStep} />}

            {/* BOTTOM HALF: CLI-STYLE LOG VIEWER */}
            <CliLogViewer 
              logs={logs}
              logAnimationStep={logAnimationStep}
              activeLogTab={activeLogTab}
              setActiveLogTab={setActiveLogTab}
              isTyping={isTyping}
              isExpanded={isCliExpanded}
              onToggleExpand={() => setIsCliExpanded(!isCliExpanded)}
            />
          </div>
        ) : (
          <ChatInterface 
            messages={messages}
            isTyping={isTyping}
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            onSend={handleSend}
            activeTool={activeTool}
          />
        )}
      </div>

      {/* Settings Panel (Right side) */}
      <SettingsPanel />
    </div>
  )
}
