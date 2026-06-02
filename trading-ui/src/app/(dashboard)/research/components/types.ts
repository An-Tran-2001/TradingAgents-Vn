import React from "react"

export type Message = {
  id: string
  role: "user" | "assistant" | "agent" | "system"
  agentRole?: string
  content: string | React.ReactNode
  timestamp: string
}

export type AgentLog = {
  step: number;
  time: string;
  agent: string;
  type: string;
  content: string;
}
