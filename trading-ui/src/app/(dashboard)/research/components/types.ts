import React from "react"

export type Message = {
  id: string
  role: "user" | "agent" | "system"
  agentRole?: string
  content: string | React.ReactNode
  timestamp: string
}
