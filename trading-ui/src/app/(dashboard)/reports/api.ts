import { TickerInfo, DayReport } from "./types"
import { fetchClient } from "@/lib/api/client"

// Helper to convert backend snake_case report to frontend camelCase DayReport
function mapReport(r: any): DayReport {
  return {
    id: r.id,
    ticker: r.ticker,
    status: r.status,
    date: new Date(r.report_date).toLocaleDateString(), // map report_date to date string
    price: r.current_price || 0,
    change: r.change ?? 0, 
    agents: r.agents_count || (r.agent_outputs ? r.agent_outputs.length : 0),
    duration: r.duration || "01:45", 
    recommendation: r.recommendation || "HOLD",
    confidence: r.confidence || 0,
    targetPrice: r.target_price || 0,
    stopLoss: r.stop_loss || 0,
    riskReward: r.risk_reward || 0,
    summary: r.summary || "",
    bullPoints: r.bull_points || [],
    bearPoints: r.bear_points || [],
    agentOutputs: (r.agent_outputs || []).map((a: any) => ({
      agent: a.agent_name,
      team: a.team_name as "Analyst" | "Research" | "Execution",
      recommendation: a.recommendation,
      confidence: a.confidence,
      summary: a.summary
    })),
    forecast: (r.forecasts || []).map((f: any) => ({
      day: f.day_offset,
      date: "", // Placeholder if not provided by backend
      price: f.price_target,
      low: f.price_low,
      high: f.price_high,
      signal: f.signal
    }))
  } as DayReport;
}

export async function fetchTickers(): Promise<TickerInfo[]> {
  const data = await fetchClient("/agent_reports/tickers")
  return data.map((t: any) => ({
    ticker: t.ticker,
    name: t.name,
    type: t.type,
    currency: t.currency,
    reportCount: t.report_count || 0,
    latestReportDate: t.latest_report_date || null,
    latestRecommendation: t.latest_recommendation || "HOLD"
  }))
}

export async function fetchReportsByTicker(ticker: string): Promise<DayReport[]> {
  const data = await fetchClient(`/agent_reports/tickers/${ticker}`)
  return data.map(mapReport)
}

export async function fetchReportDetails(reportId: number): Promise<DayReport> {
  const data = await fetchClient(`/agent_reports/${reportId}`)
  return mapReport(data)
}

export async function fetchReportLogs(reportId: number | string): Promise<any[]> {
  return await fetchClient(`/agent_reports/${reportId}/logs`)
}
