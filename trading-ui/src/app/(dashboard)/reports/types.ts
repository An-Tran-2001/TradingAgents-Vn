export type Rec = "BUY" | "HOLD" | "SELL"

export type AgentLog = {
  id: string
  timestamp: string
  team: string
  agent_name: string
  log_type: string
  content: string
  meta_data?: any
}

export type ForecastDay = {
  day: string
  date: string
  price: number
  low: number
  high: number
  signal: "UP" | "DOWN" | "FLAT"
}

export type AgentOutput = {
  agent: string
  team: "Analyst" | "Research" | "Execution"
  recommendation: Rec
  confidence: number
  summary: string
}

export type DayReport = {
  id: string | number
  date: string
  recommendation: Rec
  confidence: number
  price: number
  change: number
  agents?: number
  duration?: string
  summary: string
  forecast: ForecastDay[]
  agentOutputs: AgentOutput[]
  bullPoints: string[]
  bearPoints: string[]
  targetPrice: number
  stopLoss: number
  riskReward: number
}

export type TickerInfo = {
  ticker: string
  name: string
  type: string
  currency: string
  reportCount: number
  latestReportDate: string | null
  latestRecommendation: Rec
}
