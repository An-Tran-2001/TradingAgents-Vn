import { fetchClient } from "@/lib/api/client";

export interface TickerCount {
  ticker: string;
  count: number;
}

export interface TopPerformingTicker {
  ticker: string;
  return_percentage: number;
  win_rate: number;
}

export interface PortfolioDataPoint {
  date: string;
  value: number;
  benchmark: number;
}

export interface TokenUsageDataPoint {
  date: string;
  tokens: number;
}

export interface StatusCount {
  completed: number;
  failed: number;
  running: number;
  pending: number;
}

export interface SentimentCount {
  BUY: number;
  HOLD: number;
  SELL: number;
}

export interface DeliveryStats {
  success: number;
  failed: number;
  total: number;
  success_rate: number;
}

export interface DashboardMetrics {
  total_tokens_used: number;
  total_cost_usd: number;
  avg_cost_per_report_usd: number;
  total_tickers_queried: number;
  total_reports_created: number;
  total_jobs_created: number;
  total_jobs_run: number;
  tokens_per_model: Record<string, number>;
  avg_report_duration_seconds: number;
  win_rate_percentage: number;
  avg_roi_percentage: number;
  sentiment_distribution: SentimentCount;
  delivery_stats: DeliveryStats;
  top_tickers: TickerCount[];
  top_performing_tickers: TopPerformingTicker[];
  portfolio_history: PortfolioDataPoint[];
  token_usage_history: TokenUsageDataPoint[];
  reports_by_status: StatusCount;
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const data = await fetchClient("/analytics/dashboard");
  return data;
}
