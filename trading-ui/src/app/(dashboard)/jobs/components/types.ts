export type JobStatus = "active" | "paused"

export interface TradingJob {
  id: string
  ticker: string
  frequency: string
  depth: string
  reasoning: string
  agents: string[]
  startDate: string
  endDate: string
  status: JobStatus
  lastRun: string
  nextRun: string
  history: ("success" | "warning" | "failed" | "none")[]
  config?: any
}
